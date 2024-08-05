from pydantic import BaseModel
from typing import List, Dict

class UserBase(BaseModel):
    user_name: str
    user_profile: str
    user_picture: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    user_id: int

    class Config:
        orm_mode = True

class Photo(BaseModel):
    photo_id: int
    photo_data: str

    class Config:
        orm_mode = True

class UserWithPhotos(BaseModel):
    user: User
    photos: List[Photo]

class Brand(BaseModel):
    brand_id: int
    brand_name: str

    class Config:
        orm_mode = True

class Item(BaseModel):
    item_id: int
    item_name: str

    class Config:
        orm_mode = True

class Preference(BaseModel):
    user_id: int
    item_id: int
    score: float
    item: Item

    class Config:
        orm_mode = True

class UserPreferences(BaseModel):
    preferences: List[Preference]

    class Config:
        orm_mode = True

class UpdatePreferencesRequest(BaseModel):
    user_id: int
    preferences: Dict[int, float]

class FavoriteCreate(BaseModel):
    user_id: int
    brand_name: str

    class Config:
        orm_mode = True

class UserFavorites(BaseModel):
    favorites: List[Brand]

    class Config:
        orm_mode = True
