from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from app import models, schemas, auth, database
from typing import List

print(f"PORT環境変数: {os.environ.get('PORT')}")

app = FastAPI()

# アップロードディレクトリの作成
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 静的ファイルのマウント
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # ローカルフロントエンド
        "http://localhost:3001",     # 代替ポート
        "http://127.0.0.1:3000",     # ローカルフロントエンド（別表記）
        "http://127.0.0.1:3001",     # 代替ポート（別表記）
        "https://tech0step3app-production.up.railway.app",  # Railway.app上のフロントエンド
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    print(f"Login attempt - username: {form_data.username}, grant_type: {form_data.grant_type}")
    user = db.query(models.Employee).filter(models.Employee.email == form_data.username).first()
    print(f"User found: {user is not None}")
    
    if user:
        print(f"Verifying password for user: {user.email}")
        is_valid_password = auth.verify_password(form_data.password, user.password)
        is_valid_temp_password = user.temp_password and form_data.password == user.temp_password
        print(f"Password verification - normal: {is_valid_password}, temp: {is_valid_temp_password}")
        
        if is_valid_password or is_valid_temp_password:
            access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = auth.create_access_token(
                data={
                    "sub": user.email,
                    "role": user.role
                },
                expires_delta=access_token_expires
            )
            print(f"Token generated for user: {user.email} with role: {user.role}")
            return {"access_token": access_token, "token_type": "bearer"}
    
    print("Authentication failed")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="メールアドレスまたはパスワードが正しくありません",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.get("/me", response_model=schemas.EmployeeResponse)
async def read_users_me(current_user: models.Employee = Depends(auth.get_current_user)):
    print(f"Getting user info - email: {current_user.email}, role: {current_user.role}")
    return current_user

@app.get("/employees", response_model=List[schemas.EmployeeResponse])
async def get_employees(
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"Getting employees list - requested by: {current_user.email}")
    employees = db.query(models.Employee).all()
    print(f"Found {len(employees)} employees")
    return employees 