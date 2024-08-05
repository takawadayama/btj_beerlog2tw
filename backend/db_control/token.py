from sqlalchemy.orm import Session
from db_control.mymodels import User, Base, UserModel  # UserModelをインポート
from db_control.connect import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from typing import Annotated
from sqlalchemy.orm import mapped_column, Mapped

from db_control.schemas import UpdatePasswordRequest, LoginRequest

# .env の読み込み
load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserInDB(User):
    hashed_password: Mapped[str] = mapped_column()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db, user_mail: str):
    return db.query(User).filter(User.user_mail == user_mail).first()


def authenticate_user(db, user_mail: str, user_password: str):
    user = get_user(db, user_mail)
    if not user:
        return False
    if not verify_password(user_password, user.user_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.user_mail, form_data.user_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.user_id}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me/", response_model=UserModel)  # UserModelをレスポンスモデルとして使用
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# パスワードの更新エンドポイント
@router.put("/update_password/")
def update_user_password(request: UpdatePasswordRequest, db: Session = Depends(get_db)):
    # print(user_id)
    # print(new_password)
    print(request.user_id)
    print(request.new_password)

    user = db.query(User).filter(User.user_id == request.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # 新しいパスワードをハッシュ化
    hashed_password = get_password_hash(request.new_password)

    user.user_password = hashed_password
    db.commit()
    return {"message": "Password updated successfully"}
