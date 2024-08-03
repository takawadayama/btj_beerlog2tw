from sqlalchemy.orm import Session
from .mymodels import User, Photo, Post, EC_Set


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_photos(db: Session, user_id: int):
    return db.query(Photo).join(Post).filter(Post.user_id == user_id).all()


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


# ec_setsを更新するために用意した暫定的なもの
# def update_ec_set(db: Session, ec_set_id: int, category: str, set_name: str, set_description: str, algorithm_func: str):
#     ec_set = db.query(EC_Set).filter(EC_Set.ec_set_id == ec_set_id, EC_Set.category == category).first()

#     if ec_set:
#         ec_set.set_name = set_name
#         ec_set.set_description = set_description
#         ec_set.algorithm_func = algorithm_func

#         db.commit()
#         db.refresh(ec_set)

#         return ec_set
#     else:
#         return None
