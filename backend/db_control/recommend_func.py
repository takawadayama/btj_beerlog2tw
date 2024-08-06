import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from .mymodels import Survey, Brand, Preference, User, EC_Brand, EC_Set

from scipy.spatial.distance import cosine
from datetime import date, datetime


# セット情報の取得
def get_ec_sets_by_category(db: Session, category: str):
    return (
        db.query(
            EC_Set.ec_set_id,
            EC_Set.set_name,
            EC_Set.set_description,
        )
        .filter(EC_Set.category == category)
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
