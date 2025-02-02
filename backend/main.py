from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import shutil
import traceback
from dotenv import load_dotenv
from app import models, schemas, auth, database
from typing import List
from app.utils.email import send_welcome_email
import secrets
import string

# .envファイルを読み込む
load_dotenv()

print(f"PORT環境変数: {os.environ.get('PORT')}")
print(f"JWT_SECRET_KEY: {os.environ.get('JWT_SECRET_KEY')}")
print(f"JWT_ALGORITHM: {os.environ.get('JWT_ALGORITHM')}")

app = FastAPI()

# アップロードディレクトリの作成
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 静的ファイルのマウント
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, html=True), name="uploads")

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのオリジン
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],
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
    return schemas.EmployeeResponse.from_orm(current_user)

@app.get("/employees", response_model=List[schemas.EmployeeResponse])
async def get_employees(
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"Getting employees list - requested by: {current_user.email}")
    employees = db.query(models.Employee).all()
    print(f"Found {len(employees)} employees")
    return [schemas.EmployeeResponse.from_orm(employee) for employee in employees]

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.Employee = Depends(auth.get_current_user)
):
    try:
        # ファイル名を生成（従業員ID_タイムスタンプ.拡張子）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{current_user.employee_id}_{timestamp}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)

        # ファイルを保存
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # URLを生成（8080ポートを使用）
        file_url = f"/uploads/{new_filename}"
        
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/me/profile", response_model=schemas.EmployeeResponse)
async def update_profile(
    profile_update: schemas.EmployeeProfileUpdate,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"Updating profile for user: {current_user.email}")
    print(f"Update data: {profile_update}")

    # ユーザー情報を更新
    user = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if profile_update.department is not None:
        user.department = profile_update.department
    if profile_update.icon_url is not None:
        user.icon_url = profile_update.icon_url

    db.commit()
    db.refresh(user)
    print(f"Profile updated successfully")
    return schemas.EmployeeResponse.from_orm(user)

@app.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # 管理者権限チェック
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この操作には管理者権限が必要です"
        )

    # 従業員を検索
    employee = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された従業員が見つかりません"
        )

    # 自分自身は削除できない
    if employee.email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身は削除できません"
        )

    # 従業員を削除
    db.delete(employee)
    db.commit()

    return {"message": "従業員を削除しました"}

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

@app.post("/employees", response_model=schemas.EmployeeResponse)
async def create_employee(
    employee: schemas.EmployeeCreate,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        # 管理者権限チェック
        if not current_user or current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この操作には管理者権限が必要です"
            )

        # メールアドレスの重複チェック
        existing_email = db.query(models.Employee).filter(models.Employee.email == employee.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このメールアドレスは既に使用されています"
            )

        # 従業員IDの重複チェック
        existing_id = db.query(models.Employee).filter(models.Employee.employee_id == employee.employee_id).first()
        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この従業員IDは既に使用されています"
            )

        # 仮パスワードを生成
        temp_password = generate_temp_password()
        hashed_password = auth.get_password_hash(temp_password)

        # 新しい従業員を作成
        db_employee = models.Employee(
            employee_id=employee.employee_id,
            name=employee.name,
            email=employee.email,
            password=hashed_password,
            department=employee.department,
            role=employee.role,
            temp_password=temp_password  # 仮パスワードを保存
        )

        try:
            # データベースに保存
            db.add(db_employee)
            db.commit()
            db.refresh(db_employee)

            # ウェルカムメールを送信（非同期）
            try:
                await send_welcome_email(employee.email, employee.name, temp_password)
            except Exception as mail_error:
                print(f"Failed to send welcome email: {str(mail_error)}")
                # メール送信失敗はユーザー作成に影響させない

            return schemas.EmployeeResponse.from_orm(db_employee)

        except Exception as db_error:
            db.rollback()
            print(f"Database error: {str(db_error)}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="従業員の作成に失敗しました"
            )

    except HTTPException as http_error:
        # 既存のHTTPExceptionはそのまま再送
        raise http_error

    except Exception as e:
        # 予期せぬエラーの場合
        print(f"Unexpected error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )