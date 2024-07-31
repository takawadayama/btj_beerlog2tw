from pydantic import BaseModel
from typing import List, Optional

class Photo(BaseModel):
    photo_id: int
    photo_data: bytes
    post_id: int

    class Config:
        from_attributes = True

class User(BaseModel):
    user_id: int
    user_name: str
    user_picture: Optional[str] = None
    user_profile: Optional[str] = None

    class Config:
        from_attributes = True