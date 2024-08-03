from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db_control import crud, connect, schemas
import base64
from typing import List

app = FastAPI()

# CORS設定
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/user_with_photos", response_model=schemas.UserWithPhotos)
def read_user_with_photos(user_id: int, db: Session = Depends(connect.get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.user_picture = base64.b64encode(user.user_picture).decode('utf-8') if user.user_picture else ""

    photos = crud.get_user_photos(db, user_id=user_id)
    for photo in photos:
        photo.photo_data = base64.b64encode(photo.photo_data).decode('utf-8')

    return {
        "user": user,
        "photos": photos,
    }


@app.get("/ec_sets", response_model=List[schemas.ECSetItem])
def get_ec_sets(category: str, db: Session = Depends(connect.get_db)):
    ec_sets = crud.get_ec_sets_by_category(db, category)

    return ec_sets


# ec_setsを更新するための暫定的なもの
# @app.put("/ec_sets/{ec_set_id}", response_model=schemas.ECSetUpdate)
# def update_ec_set_endpoint(ec_set_id: int, ec_set_data: schemas.ECSetUpdate, db: Session = Depends(connect.get_db)):
#     updated_ec_set = crud.update_ec_set(db, ec_set_id, ec_set_data.category, ec_set_data.set_name, ec_set_data.set_description, ec_set_data.algorithm_func)

#     if updated_ec_set is None:
#         raise HTTPException(status_code=404, detail="EC set not found")

#     return updated_ec_set


@app.get("/recommend", response_model=List[schemas.RecommendResponseItem])
def recommend(params: schemas.RecommendQueryParams = Depends()):
    ec_set_id = params.ec_set_id
    category = params.category
    cans = params.cans
    kinds = params.kinds
    ng_id = params.ng_id

    # ロジックをここに追加
    # 例: 推奨事項の計算やデータベースクエリ

    # クエリパラメータを使用してロジックを実装
    # ここではダミーデータを返す
    response_data = [
        {"ec_brand_id": 1, "name": "Brand A", "description": "Description A", "price": 100, "count": 12},
        {"ec_brand_id": 2, "name": "Brand B", "description": "Description B", "price": 200, "count": 6},
    ]

    return response_data
