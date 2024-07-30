from sqlalchemy.orm import Session
from .mymodels import User, Photo, Post

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()

def get_user_photos(db: Session, user_id: int):
    return db.query(Photo).join(Post).filter(Post.user_id == user_id).all()
