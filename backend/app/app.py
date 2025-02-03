from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta, datetime
from . import models, schemas, database, auth
from .database import engine
from typing import List
import secrets
import aiofiles
import os
from .utils.email import send_password_reset_email, send_welcome_email
from fastapi.staticfiles import StaticFiles

models.Base.metadata.create_all(bind=engine)

app = APIRouter()  # FastAPIをAPIRouterに変更

# 画像保存用のディレクトリを作成
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 静的ファイルのマウント用のFastAPIインスタンス
static_app = FastAPI()
static_app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, html=True), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Employee Management API"}

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.Employee).filter(models.Employee.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 仮パスワードでのログインを試みる
    if user.temp_password and form_data.password == user.temp_password:
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": user.email, "role": user.role},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    # 通常のパスワードでのログインを試みる
    if not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.Token)
async def register_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.Employee).filter(models.Employee.email == employee.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています"
        )
    
    # 仮パスワードを生成
    temp_password = secrets.token_urlsafe(8)
    hashed_password = auth.get_password_hash(temp_password)
    
    db_employee = models.Employee(
        employee_id=employee.employee_id,
        name=employee.name,
        email=employee.email,
        password=hashed_password,
        temp_password=temp_password,  # 仮パスワードを保存
        role=employee.role
    )
    
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    # アクセストークンを生成
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_employee.email, "role": db_employee.role},
        expires_delta=access_token_expires
    )
    
    # ウェルカムメールを送信（一時的にコメントアウト）
    # await send_welcome_email(db_employee.email, db_employee.name, temp_password)
    
    print(f"仮パスワード: {temp_password}")  # デバッグ用に仮パスワードを表示
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.EmployeeResponse)
async def read_users_me(current_user: models.Employee = Depends(auth.get_current_user)):
    print(f"Getting user info for: {current_user.email}")
    return current_user

@app.get("/employees", response_model=List[schemas.EmployeeResponse])
async def get_employees(current_user: models.Employee = Depends(auth.get_current_user),
                       db: Session = Depends(database.get_db)):
    employees = db.query(models.Employee).all()
    return employees

@app.put("/employees/{employee_id}", response_model=schemas.EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee_update: schemas.EmployeeUpdate,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # 従業員の存在確認
    db_employee = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="従業員が見つかりません")
    
    # 権限チェック
    if current_user.role != "admin" and current_user.id != db_employee.id:
        raise HTTPException(status_code=403, detail="権限がありません")
    
    # パスワード更新の特別処理
    if employee_update.password:
        employee_update.password = auth.get_password_hash(employee_update.password)
    
    # 更新可能なフィールドを更新
    update_data = employee_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.post("/upload-icon/{employee_id}", response_model=schemas.EmployeeResponse)
async def upload_icon(
    employee_id: str,
    file: UploadFile = File(...),
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # アップロード先のディレクトリを作成
    upload_dir = "uploads/icons"
    os.makedirs(upload_dir, exist_ok=True)
    
    # ファイル名を生成
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{employee_id}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # ファイルを保存
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # データベースを更新
    db_employee = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    db_employee.icon_url = f"/icons/{file_name}"
    db.commit()
    db.refresh(db_employee)
    
    return db_employee

@app.post("/reset-password", response_model=schemas.Message)
async def reset_password(
    reset_data: schemas.PasswordReset,
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.email == reset_data.email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="メールアドレスが見つかりません")
    
    # 仮パスワードを生成
    temp_password = secrets.token_urlsafe(8)
    hashed_password = auth.get_password_hash(temp_password)
    
    # パスワードを更新
    employee.password = hashed_password
    db.commit()
    
    # メール送信
    await send_password_reset_email(employee.email, temp_password)
    
    return {"message": "仮パスワードを送信しました"}

@app.get("/test-db")
async def test_db_connection(db: Session = Depends(database.get_db)):
    try:
        # 明示的にtextを使用してSQLクエリを実行
        result = db.execute(text("SELECT 1"))
        result.scalar()  # 結果を取得
        return {"status": "success", "message": "Database connection successful"}
    except Exception as e:
        print(f"Database error: {str(e)}")  # エラーをログに出力
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

@app.put("/me/profile", response_model=schemas.EmployeeResponse)
async def update_profile(
    profile: schemas.EmployeeProfileUpdate,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.Employee).filter(models.Employee.id == current_user.id).first()
    if profile.department is not None:
        db_user.department = profile.department
    if profile.icon_url is not None:
        db_user.icon_url = profile.icon_url
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/me/password", response_model=schemas.Message)
async def change_password(
    password_change: schemas.PasswordChange,
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # 現在のパスワードを確認
    if not auth.verify_password(password_change.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="現在のパスワードが正しくありません"
        )
    
    # 新しいパスワードをハッシュ化
    hashed_password = auth.get_password_hash(password_change.new_password)
    
    # パスワードを更新
    current_user.password = hashed_password
    current_user.temp_password = None  # 仮パスワードをクリア
    
    db.commit()
    
    return {"message": "パスワードが正常に更新されました"}

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # ファイル拡張子の確認
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ['.jpg', '.jpeg', '.png', '.gif']:
        raise HTTPException(
            status_code=400,
            detail="サポートされていないファイル形式です。(.jpg, .jpeg, .png, .gif のみ許可されています)"
        )
    
    # ファイル名の生成（一意になるように）
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.employee_id}_{timestamp}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # ファイルの保存
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="ファイルの保存に失敗しました"
        )
    
    # ユーザーのicon_urlを更新
    file_url = f"http://localhost:8001/uploads/{filename}"
    db_user = db.query(models.Employee).filter(models.Employee.id == current_user.id).first()
    db_user.icon_url = file_url
    db.commit()
    db.refresh(db_user)
    
    return {"url": file_url} 