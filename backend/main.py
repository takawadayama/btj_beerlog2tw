from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db_control import crud, connect, schemas
from db_control.token import router as token_router
import base64

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

app.include_router(token_router, prefix="/token")

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
