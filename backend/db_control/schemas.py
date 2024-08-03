from pydantic import BaseModel
from typing import List


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
