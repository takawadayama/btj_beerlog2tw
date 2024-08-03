from pydantic import BaseModel
from typing import List, Optional


class UserBase(BaseModel):
    user_name: str
    user_profile: str
    user_picture: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    user_id: int

    class Config:
        from_attributes = True


class Photo(BaseModel):
    photo_id: int
    photo_data: str

    class Config:
        from_attributes = True


class UserWithPhotos(BaseModel):
    user: User
    photos: List[Photo]


class ECSetItem(BaseModel):
    ec_set_id: int
    set_name: str
    set_description: str


# ec_setsの内容を更新するための暫定的なもの
# class ECSetUpdate(BaseModel):
#     category: str
#     set_name: str
#     set_description: str
#     algorithm_func: str


class RecommendQueryParams(BaseModel):
    ec_set_id: int
    category: str
    cans: int
    kinds: int
    ng_id: Optional[List[int]] = None


class RecommendResponseItem(BaseModel):
    ec_brand_id: int
    name: str
    description: str
    price: int
    count: int
