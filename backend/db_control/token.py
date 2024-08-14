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

from db_control.schemas import UpdatePasswordRequest, LoginRequest, UserNameResponse

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
    user_id: int | None = None


class UserInDB(User):
    hashed_password: Mapped[str] = mapped_column()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user_by_mail(db, user_mail: str):
    return db.query(User).filter(User.user_mail == user_mail).first()


def get_user_by_id(db, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()


def authenticate_user(db, user_mail: str, user_password: str):
    user = get_user_by_mail(db, user_mail)
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
        expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_id(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    return user_id


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

    # JWTに入れる値はstrにしておく
    access_token = create_access_token(data={"sub": str(user.user_id)}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me/", response_model=UserModel)  # UserModelをレスポンスモデルとして使用
async def read_users_me(current_user_id: int = Depends(get_current_user_id)):
    return current_user_id


# パスワードの更新エンドポイント
# ユーザーの新規登録を行う場合には再利用するかもしれないのでコメントアウトだけしておく
# @router.put("/update_password/")
# def update_user_password(request: UpdatePasswordRequest, db: Session = Depends(get_db)):

#     user = db.query(User).filter(User.user_id == request.user_id).first()
#     if user is None:
#         raise HTTPException(status_code=404, detail="User not found")

#     # 新しいパスワードをハッシュ化
#     hashed_password = get_password_hash(request.new_password)

#     user.user_password = hashed_password
#     db.commit()
#     return {"message": "Password updated successfully"}


# ログイン認証を行う例
@router.get("/test_jwt/")
def get_test_jwt(user_id: int = Depends(get_current_user_id)):
    return user_id


# ユーザー名の取得用（Navbar用）
@router.get("/username/", response_model=UserNameResponse)
def get_username(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Userテーブルからuser_idに該当するユーザーを取得
    user = db.query(User).filter(User.user_id == user_id).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # user_nameをレスポンスモデルに沿って返す
    return {"user_name": user.user_name}
