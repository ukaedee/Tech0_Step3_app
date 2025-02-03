from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EmployeeBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "employee"
    department: Optional[str] = None
    icon_url: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = None
    employee_id: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    icon_url: Optional[str] = None
    password: Optional[str] = None

class EmployeeResponse(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    department: Optional[str]
    icon_url: Optional[str]
    role: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        orm_mode = True

class EmployeeProfileUpdate(BaseModel):
    department: Optional[str] = None
    icon_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PasswordReset(BaseModel):
    email: EmailStr

class Message(BaseModel):
    message: str 