from sqlalchemy.orm import Session
from db_control import mymodels
from .mymodels import User, Photo, Brand, Preference, Item, Favorite

def get_user(db: Session, user_id: int):
    return db.query(mymodels.User).filter(mymodels.User.user_id == user_id).first()

def get_user_photos(db: Session, user_id: int):
    return db.query(mymodels.Photo).join(mymodels.Post).filter(mymodels.Post.user_id == user_id).all()

def get_user_preferences(db: Session, user_id: int):
    return db.query(Preference).filter(Preference.user_id == user_id).join(Item, Preference.item_id == Item.item_id).all()

def get_user_favorites(db: Session, user_id: int):
    return db.query(Brand).join(Brand.favorites).filter(Brand.favorites.any(user_id=user_id)).all()

def add_user_favorite(db: Session, user_id: int, brand_id: int):
    # favorites テーブルの次の favorite_id を取得
    next_favorite_id = db.query(Favorite).order_by(Favorite.favorite_id.desc()).first().favorite_id + 1
    favorite = Favorite(favorite_id=next_favorite_id, user_id=user_id, brand_id=brand_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite

def search_brands(db: Session, search_term: str):
    return db.query(Brand).filter(Brand.brand_name.ilike(f'%{search_term}%')).all()

def update_user_preference(db: Session, user_id: int, item_id: int, score: float):
    preference = db.query(Preference).filter(Preference.user_id == user_id, Preference.item_id == item_id).first()
    if preference:
        preference.score = score
    else:
        preference = Preference(user_id=user_id, item_id=item_id, score=score)
        db.add(preference)
    db.commit()
    return preference