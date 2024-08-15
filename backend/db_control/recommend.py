import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from db_control.mymodels import Brand, Preference, User, EC_Brand, Survey, EC_Set, Purchase, PurchaseDetail
from db_control.connect import get_db
from fastapi import APIRouter, Depends, HTTPException, Query

from db_control.schemas import RecommendQueryParams, RecommendResponseItem, ECSetItem
from typing import List

# from .mymodels import Survey, Brand, Preference, User, EC_Brand, EC_Set

from scipy.spatial.distance import cosine
from datetime import date, datetime, timedelta
import math
import random

router = APIRouter()


# セット情報の取得
def get_ec_sets_by_category(db: Session, category: str):
    return (
        db.query(
            EC_Set.ec_set_id,
            EC_Set.set_name,
            EC_Set.set_description,
        )
        .filter(EC_Set.category == category, EC_Set.ec_set_id < 900)  # ec_set_idが900未満のものを抽出(900以上はダミーデータ)
        .all()
    )


# 1.製品に関するベクトル情報を取得する
# 1-1.ageとgenderの条件に当てはまるデータを取得（データが存在するbrand_idを取得するために使う）
def get_filtered_data_by_age_gender(age: int, gender: int, category: str, db: Session):
    query = (
        select(Survey)
        .join(Brand)
        .where(
            and_(
                Survey.age_lower_limit < age,
                Survey.age_upper_limit > age,
                Survey.gender == gender,
                Brand.category == category,
            )
        )
    )

    results = db.execute(query).mappings().all()

    return results


# 1-2.抽出したデータに含まれるbrand_idの種類を取得
def get_unique_brand_ids(results):
    brand_ids = {row['Survey'].brand_id for row in results}  # {}集合なので重複なしが得られる
    return brand_ids


# 1-3.brand_id, age, genderの条件に当てはまるデータをSuveyから抽出して、brand_idのベクトル情報として整理する
def get_filtered_data(brand_id: int, age: int, gender: int, db: Session):
    query = select(Survey).where(and_(Survey.brand_id == brand_id, Survey.age_lower_limit < age, Survey.age_upper_limit > age, Survey.item_id.in_([1, 2, 3, 4, 5, 6, 7, 8]), Survey.gender == gender))

    # 出力結果をうまく扱えなかったので辞書形式にする
    results = db.execute(query).mappings().fetchall()

    # スコアを8次元のベクトルとして整理
    data = {'brand_id': [brand_id], 'age': [age], 'gender': [gender], 'id1': [None], 'id2': [None], 'id3': [None], 'id4': [None], 'id5': [None], 'id6': [None], 'id7': [None], 'id8': [None]}

    for row in results:
        survey = row['Survey']  # 辞書からオブジェクトを取り出す
        item_id = survey.item_id
        if 1 <= item_id <= 8:
            data[f'id{item_id}'][0] = survey.score

    df = pd.DataFrame(data)
    return df


# 1-4. 各brand_idについて、get_filtered_dataを使用してデータを取得し、一つのDataFrameを作成
def get_combined_data(age: int, gender: int, category: str, db: Session):
    results = get_filtered_data_by_age_gender(age, gender, category, db)
    brand_ids = get_unique_brand_ids(results)

    combined_data = pd.DataFrame()

    for brand_id in brand_ids:
        df = get_filtered_data(brand_id, age, gender, db)
        combined_data = pd.concat([combined_data, df], ignore_index=True)

    return combined_data


# 2.ユーザーの好みベクトルを取得する
# 2-1. 指定したuser_idに関する情報を抽出
def get_user_preferences(user_id: int, db: Session):
    query = select(Preference).where(Preference.user_id == user_id)

    results = db.execute(query).mappings().fetchall()

    return results


# 2-2. item_idに対応するscoreを8次元のベクトルとして整理して、結果をDataFrame形式で出力
def get_user_preference_vector(user_id: int, db: Session):
    results = get_user_preferences(user_id, db)

    # スコアを8次元のベクトルとして整理
    data = {'user_id': [user_id], 'id1': [None], 'id2': [None], 'id3': [None], 'id4': [None], 'id5': [None], 'id6': [None], 'id7': [None], 'id8': [None]}

    for row in results:
        preference = row['Preference']  # 辞書からオブジェクトを取り出す
        item_id = preference.item_id
        if 1 <= item_id <= 8:
            data[f'id{item_id}'][0] = preference.score

    df = pd.DataFrame(data)
    return df


# 3.ユーザーの好みベクトルを用いて、各製品のベクトルに対してcos類似度を計算し、リコメンド順にソートしたものを返す
# 3-1.Cos類似度を計算する関数(scipyを利用)
def calculate_cosine_similarity(vector1: list[float], vector2: list[float]):
    return 1 - cosine(vector1, vector2)


# 3-2.combined_dfの8次元ベクトルとuser_dfの8次元ベクトルでcos類似度を計算し、rec_scoreに格納する関数
def add_recommendation_scores(combined_df: pd.DataFrame, user_vector: pd.DataFrame):
    combined_df['rec_score'] = 0.0
    user_vector = user_vector.iloc[0, 1:].values.tolist()  # user_vectorの8次元ベクトルを取得

    for idx, row in combined_df.iterrows():
        combined_vector = row[['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7', 'id8']].values.tolist()
        rec_score = calculate_cosine_similarity(combined_vector, user_vector)
        combined_df.at[idx, 'rec_score'] = rec_score

    # 'rec_score'を降順でソート
    combined_df = combined_df.sort_values(by='rec_score', ascending=False).reset_index(drop=True)

    return combined_df


# 4.1~3をすべてをまとめて、cos類似度でソートした結果を返す
def recommendation_by_cosine_similarity(user_id: int, age: int, gender: int, category: str, db: Session):
    combined_df = get_combined_data(age, gender, category, db)
    user_df = get_user_preference_vector(user_id, db)
    combined_df = add_recommendation_scores(combined_df, user_df)
    return combined_df


# user_idに対するbirthdateとgenderを基に計算して、age, genderを返す
def get_user_age_and_gender(user_id: int, db: Session):
    query = select(User.birthdate, User.gender).where(User.user_id == user_id)

    result = db.execute(query).fetchone()

    if result is None:
        return None, None
    else:
        birthdate, gender = result

    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))  # 誕生日前なら１を引く

    return age, gender


# ec_set_id=2の計算
def recommend_preferred_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):

    age, gender = get_user_age_and_gender(user_id, db)
    recommendation_df = recommendation_by_cosine_similarity(user_id, age, gender, category, db)

    # ng_idに含まれないbrand_idを持つ行を抽出
    # ng_idがNoneまたは空リストでないことを確認
    if ng_id is not None and len(ng_id) > 0:
        query_str = ' & '.join([f'brand_id != {i}' for i in ng_id])
        filtered_recommendation_df = recommendation_df.query(query_str)
    else:
        # ng_idがNoneまたは空リストの場合、全ての行を保持
        filtered_recommendation_df = recommendation_df

    recommendation_df = filtered_recommendation_df.head(kinds)[["brand_id"]]

    # recommendation_df = recommendation_df.head(kinds)[["brand_id"]]

    brand_ids = recommendation_df["brand_id"].tolist()
    stmt = select(EC_Brand).where(EC_Brand.brand_id.in_(brand_ids))
    result = db.execute(stmt).scalars().all()

    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in result
    ]
    return response_data


# 最近１か月で購入されたec_brand_idを購入数が多い順にソートした結果を返す
def recommendation_by_popularity(user_id: int, category: str, ng_id: list[int], db: Session):
    # 1. Purchaseテーブルを確認して、date_timeが（本日から一か月前まで）の期間に当てはまるデータを抽出
    one_month_ago = datetime.now() - timedelta(days=30)
    recent_purchases = db.query(Purchase).filter(Purchase.date_time >= one_month_ago, Purchase.user_id == user_id).all()

    # 2. 抽出した各データについてpurchase_idを用いて、PurchaseDetailテーブルを参照して、ng_idに含まれるbrand_idを除外
    purchase_ids = [purchase.purchase_id for purchase in recent_purchases]
    purchase_details = (
        db.query(PurchaseDetail)
        .filter(
            PurchaseDetail.purchase_id.in_(purchase_ids),
            PurchaseDetail.category == category,
            ~PurchaseDetail.ec_brand_id.in_(ng_id),
        )
        .all()
    )

    # 3. 抽出された全PurchaseDetailを確認して、その中に入っている、ec_brand_idを重複なく取得
    brand_counts = {}
    for detail in purchase_details:
        if detail.ec_brand_id not in brand_counts:
            brand_counts[detail.ec_brand_id] = 0
        brand_counts[detail.ec_brand_id] += 1

    # 4. 3で作成したec_brand_idのそれぞれについて、個数を計算し、DataFrame形式で求める
    data = {'ec_brand_id': list(brand_counts.keys()), 'score': list(brand_counts.values())}
    df = pd.DataFrame(data)

    # 5. "score"が昇順になるように結果をソートしたものを返す
    df_sorted = df.sort_values(by='score', ascending=False)

    return df_sorted


def recommend_popular_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):
    # 1. recommendation_by_popularity関数を用いて、結果を取得する（ng_idを引数に追加）
    df_sorted = recommendation_by_popularity(user_id, category, ng_id, db)

    # 2. 上位(kinds)個のデータを取得する際には、ng_listを取り除く必要はありません
    top_kinds_df = df_sorted.head(kinds)

    # 3. そのように得られたec_brand_idについて、EC_Brandテーブルを参照して、ec_brand_idが一致するデータを取得する
    ec_brand_ids = top_kinds_df['ec_brand_id'].tolist()
    result = db.query(EC_Brand).filter(EC_Brand.ec_brand_id.in_(ec_brand_ids)).all()

    # 4. その結果を用いて、response_dataに変換して返す
    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in result
    ]

    return response_data


def split_kinds(kinds: int):
    majority_kinds = math.ceil(kinds / 2)  # kindsの過半数を計算（端数は切り上げ）
    minority_kinds = kinds - majority_kinds  # 残りの値を計算

    return majority_kinds, minority_kinds


def recommend_diverse_preferred_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):
    # 1. recommendation_dfを取得
    age, gender = get_user_age_and_gender(user_id, db)
    recommendation_df = recommendation_by_cosine_similarity(user_id, age, gender, category, db)

    # kindsをmajority_kindsとminority_kindsに分割
    majority_kinds, minority_kinds = split_kinds(kinds)

    # 2. minority_kindsが0の場合、処理をスキップする
    if minority_kinds > 0:
        # recommendation_dfからng_idに含まれるものを除き、上位(minority_kinds)個のbrand_idを取得
        filtered_recommendation_df = recommendation_df[~recommendation_df['brand_id'].isin(ng_id)]
        top_minor_brand_ids = filtered_recommendation_df.head(minority_kinds)['brand_id'].tolist()

        # 3. EC_Brandテーブルから、top_minor_brand_idsに含まれるbrand_idに一致するものを抽出
        minor_brands = db.query(EC_Brand).filter(EC_Brand.brand_id.in_(top_minor_brand_ids)).all()
    else:
        top_minor_brand_ids = []
        minor_brands = []

    # 4. EC_Brandテーブルから、brand_idが(ng_id + top_minor_brand_ids)に含まれず、かつcategoryが一致するものをすべて抽出
    excluded_brand_ids = ng_id + top_minor_brand_ids
    remaining_brands = (
        db.query(EC_Brand)
        .filter(
            ~EC_Brand.brand_id.in_(excluded_brand_ids),
            EC_Brand.category == category,
        )
        .all()
    )

    # 5. 残りのブランドからランダムに(majority_kinds)個を取得
    if len(remaining_brands) > majority_kinds:
        major_brands = random.sample(remaining_brands, majority_kinds)
    else:
        major_brands = remaining_brands

    # 6. 3と5の結果をまとめる
    combined_brands = minor_brands + major_brands

    # 7. 整理してresponse_dataとして返す
    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in combined_brands
    ]

    return response_data


def recommend_adventurous_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):
    # 1. recommendation_dfを取得
    age, gender = get_user_age_and_gender(user_id, db)
    recommendation_df = recommendation_by_cosine_similarity(user_id, age, gender, category, db)

    # kindsをmajority_kindsとminority_kindsに分割
    majority_kinds, minority_kinds = split_kinds(kinds)

    # 2. minority_kindsが0の場合、処理をスキップする
    if minority_kinds > 0:
        # recommendation_dfからng_idに含まれるものを除き、上位(minority_kinds)個のbrand_idを取得
        filtered_recommendation_df = recommendation_df[~recommendation_df['brand_id'].isin(ng_id)]
        top_minor_brand_ids = filtered_recommendation_df.head(minority_kinds)['brand_id'].tolist()

        # 3. EC_Brandテーブルから、top_minor_brand_idsに含まれるbrand_idに一致するものを抽出
        minor_brands = db.query(EC_Brand).filter(EC_Brand.brand_id.in_(top_minor_brand_ids)).all()
    else:
        top_minor_brand_ids = []
        minor_brands = []

    # 4. recommendation_dfから（top_minor_brand_ids + ng_id）に含まれるものを除き、下位(majority_kinds)個のbrand_idを取得
    excluded_brand_ids = ng_id + top_minor_brand_ids
    remaining_recommendation_df = recommendation_df[~recommendation_df['brand_id'].isin(excluded_brand_ids)]
    bottom_major_brand_ids = remaining_recommendation_df.tail(majority_kinds)['brand_id'].tolist()

    # 5. EC_Brandテーブルから、bottom_major_brand_idsに含まれるbrand_idに一致するものを取得
    major_brands = db.query(EC_Brand).filter(EC_Brand.brand_id.in_(bottom_major_brand_ids)).all()

    # 6. 3と5の結果をまとめる
    combined_brands = minor_brands + major_brands

    # 7. 整理してresponse_dataとして返す
    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in combined_brands
    ]

    return response_data


def recommend_luxury_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):
    # 1. recommendation_dfを取得
    age, gender = get_user_age_and_gender(user_id, db)
    recommendation_df = recommendation_by_cosine_similarity(user_id, age, gender, category, db)

    # 2. ECブランドテーブルを参照して、categoryが一致し、かつng_idに含まれないbrand_idを持つデータを取得
    all_brands = (
        db.query(EC_Brand)
        .filter(
            EC_Brand.category == category,
            ~EC_Brand.brand_id.in_(ng_id),
        )
        .all()
    )

    # 3. priceで降順にソートして、上位半分（小数点以下切り上げ）のbrand_idを取得
    sorted_brands = sorted(all_brands, key=lambda x: x.price, reverse=True)
    top_half_brands_count = math.ceil(len(sorted_brands) / 2)
    top_half_brand_ids = [brand.brand_id for brand in sorted_brands[:top_half_brands_count]]

    # 4. recommendation_dfから、top_half_brand_idsを含むものを抽出し、rec_scoreの上位(kinds)個のbrand_idを取得
    filtered_recommendation_df = recommendation_df[recommendation_df['brand_id'].isin(top_half_brand_ids)]
    top_kinds_df = filtered_recommendation_df.head(kinds)
    selected_brand_ids = top_kinds_df['brand_id'].tolist()

    # 5. EC_Brandテーブルから、selected_brand_idsに一致するものを取得
    result = db.query(EC_Brand).filter(EC_Brand.brand_id.in_(selected_brand_ids)).all()

    # 6. 整理してresponse_dataとして返す
    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in result
    ]

    return response_data


def recommend_budget_products(user_id: int, category: str, cans: int, kinds: int, ng_id: list[int], db: Session):
    # 1. recommendation_dfを取得
    age, gender = get_user_age_and_gender(user_id, db)
    recommendation_df = recommendation_by_cosine_similarity(user_id, age, gender, category, db)

    # 2. ECブランドテーブルを参照して、categoryが一致し、かつng_idに含まれないbrand_idを持つデータを取得
    all_brands = (
        db.query(EC_Brand)
        .filter(
            EC_Brand.category == category,
            ~EC_Brand.brand_id.in_(ng_id),
        )
        .all()
    )

    # 3. priceで昇順にソートして、上位半分（小数点以下切り上げ）のbrand_idを取得
    sorted_brands = sorted(all_brands, key=lambda x: x.price)
    top_half_brands_count = math.ceil(len(sorted_brands) / 2)
    top_half_brand_ids = [brand.brand_id for brand in sorted_brands[:top_half_brands_count]]

    # 4. recommendation_dfから、top_half_brand_idsを含むものを抽出し、rec_scoreの上位(kinds)個のbrand_idを取得
    filtered_recommendation_df = recommendation_df[recommendation_df['brand_id'].isin(top_half_brand_ids)]
    top_kinds_df = filtered_recommendation_df.head(kinds)
    selected_brand_ids = top_kinds_df['brand_id'].tolist()

    # 5. EC_Brandテーブルから、selected_brand_idsに一致するものを取得
    result = db.query(EC_Brand).filter(EC_Brand.brand_id.in_(selected_brand_ids)).all()

    # 6. 整理してresponse_dataとして返す
    response_data = [
        {
            "ec_brand_id": brand.ec_brand_id,
            "name": brand.name,
            "description": brand.description,
            "price": brand.price,
            "count": int(cans / kinds),
        }
        for brand in result
    ]

    return response_data


@router.get("/ec_sets", response_model=List[ECSetItem])
def get_ec_sets(category: str, db: Session = Depends(get_db)):
    ec_sets = get_ec_sets_by_category(db, category)

    return ec_sets


@router.get("/recommend", response_model=List[RecommendResponseItem])
def recommend(
    ec_set_id: int = Query(...),
    category: str = Query(...),
    cans: int = Query(...),
    kinds: int = Query(...),
    ng_id: List[int] = Query([]),  # Pydanticのモデルではリストをうまく受け取れなったのでQueryを使う
    db: Session = Depends(get_db),
):
    # 検証用にPydanticのモデルへ入れておく
    params = RecommendQueryParams(ec_set_id=ec_set_id, category=category, cans=cans, kinds=kinds, ng_id=ng_id)

    # 改めてパラメータを置き直す
    ec_set_id = params.ec_set_id
    category = params.category
    cans = params.cans
    kinds = params.kinds
    ng_id = params.ng_id

    # 最終的にはJWTから取得する
    user_id = 1

    if ec_set_id == 2:

        # ec_set_idとアルゴリズムの対応を、一旦、直に書いておく
        # マッピングはうまく行かない
        # 関数のマッピング
        # function_mapping = {
        #     # "recommend_popular_products": recommend_popular_products,  # 未実装
        #     "recommend_preferred_products": recommend.recommend_preferred_products,
        #     # "recommend_diverse_preferred_products": recommend_diverse_preferred_products,  # 未実装
        # }

        # algorithm_function = function_mapping.get("recommend_preferred_products")
        # response_data = algorithm_function(user_id, category, cans, kinds, ng_id, db)

        response_data = recommend_preferred_products(user_id, category, cans, kinds, ng_id, db)

    elif ec_set_id == 1:

        response_data = recommend_popular_products(user_id, category, cans, kinds, ng_id, db)

    elif ec_set_id == 3:

        response_data = recommend_diverse_preferred_products(user_id, category, cans, kinds, ng_id, db)

    elif ec_set_id == 4:

        response_data = recommend_adventurous_products(user_id, category, cans, kinds, ng_id, db)

    elif ec_set_id == 5:

        response_data = recommend_luxury_products(user_id, category, cans, kinds, ng_id, db)

    elif ec_set_id == 6:

        response_data = recommend_budget_products(user_id, category, cans, kinds, ng_id, db)

    else:

        # ロジックをここに追加
        # 例: 推奨事項の計算やデータベースクエリ

        # クエリパラメータを使用してロジックを実装
        # ここではダミーデータを返す

        if category == "national":
            response_data = [
                {"ec_brand_id": 1, "name": "Brand A", "description": "Description A", "price": 100, "count": params.cans / 2},
                {"ec_brand_id": 2, "name": "Brand B", "description": "Description B", "price": 200, "count": params.cans / 2},
            ]

        elif category == "craft":
            response_data = [
                {"ec_brand_id": 3, "name": "Brand C", "description": "Description C", "price": 100, "count": params.cans / 3},
                {"ec_brand_id": 4, "name": "Brand D", "description": "Description D", "price": 200, "count": params.cans / 3},
                {"ec_brand_id": 5, "name": "Brand E", "description": "Description E", "price": 200, "count": params.cans / 3},
            ]

    return response_data
