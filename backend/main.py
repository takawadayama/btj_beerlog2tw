from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db_control import crud, connect, schemas
from db_control.mymodels import Item, Brand, Preference, Favorite
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
        "photos": photos
    }

@app.get("/user_preferences", response_model=List[schemas.Preference])
def read_user_preferences(user_id: int, db: Session = Depends(connect.get_db)):
    preferences = crud.get_user_preferences(db, user_id=user_id)
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    for preference in preferences:
        item = db.query(Item).filter(Item.item_id == preference.item_id).first()
        preference.item = item
    return preferences

@app.post("/add_favorite", response_model=schemas.Brand)
def add_favorite(favorite: schemas.FavoriteCreate, db: Session = Depends(connect.get_db)):
    brand = db.query(Brand).filter(Brand.brand_name == favorite.brand_name).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    new_favorite = Favorite(user_id=favorite.user_id, brand_id=brand.brand_id)
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    return brand

@app.post("/update_preferences")
def update_preferences(request: schemas.UpdatePreferencesRequest, db: Session = Depends(connect.get_db)):
    for item_id, score in request.preferences.items():
        crud.update_user_preference(db, user_id=request.user_id, item_id=item_id, score=score)
    return {"message": "Preferences updated successfully"}

@app.get("/search_brands", response_model=List[schemas.Brand])
def search_brands(search_term: str, db: Session = Depends(connect.get_db)):
    brands = crud.search_brands(db, search_term=search_term)
    if not brands:
        raise HTTPException(status_code=404, detail="Brands not found")
    return brands

@app.get("/user_favorites", response_model=List[schemas.Brand])
def read_user_favorites(user_id: int = Query(...), db: Session = Depends(connect.get_db)):
    favorites = crud.get_user_favorites(db, user_id=user_id)
    if not favorites:
        raise HTTPException(status_code=404, detail="Favorites not found")
    return favorites

@app.delete("/delete_favorite")
def delete_favorite(user_id: int = Query(...), brand_id: int = Query(...), db: Session = Depends(connect.get_db)):
    favorite = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.brand_id == brand_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
    return {"message": "Favorite deleted successfully"}