from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from db_control.connect import get_db
from db_control.crud import get_user, get_user_photos
from db_control.schemas import User, Photo

app = FastAPI()

@app.get("/user/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/user/{user_id}/photos", response_model=List[Photo])
def read_user_photos(user_id: int, db: Session = Depends(get_db)):
    photos = get_user_photos(db, user_id=user_id)
    if photos is None:
        raise HTTPException(status_code=404, detail="Photos not found")
    return photos
