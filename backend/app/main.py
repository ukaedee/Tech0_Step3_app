from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from . import models, schemas, database, auth
from .database import engine
from typing import List

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Employee Management API"}

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.Employee).filter(models.Employee.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password):
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
    
    # 仮パスワードを生成（実際のアプリケーションでは、メールで送信する）
    temp_password = "temppass123"
    hashed_password = auth.get_password_hash(temp_password)
    
    db_employee = models.Employee(
        employee_id=employee.employee_id,
        name=employee.name,
        email=employee.email,
        password=hashed_password,
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
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.EmployeeCreate)
async def read_users_me(current_user: models.Employee = Depends(auth.get_current_user)):
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
    db_employee = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="従業員が見つかりません")
    
    # 一般従業員は自分のデータのみ更新可能
    if current_user.role != "admin" and current_user.id != db_employee.id:
        raise HTTPException(status_code=403, detail="権限がありません")
    
    for key, value in employee_update.dict(exclude_unset=True).items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.post("/upload-icon")
async def upload_icon(
    file: UploadFile = File(...),
    current_user: models.Employee = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # TODO: ファイルをクラウドストレージにアップロード
    # この例では、ファイル名のみを返します
    file_location = f"icons/{current_user.employee_id}_{file.filename}"
    return {"icon_url": file_location} 