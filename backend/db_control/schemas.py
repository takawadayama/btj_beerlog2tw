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
