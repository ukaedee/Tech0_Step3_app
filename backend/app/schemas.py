from pydantic import BaseModel, EmailStr
from typing import Optional

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EmployeeCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    role: str = "employee"

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    icon_url: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class EmployeeResponse(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    department: Optional[str]
    icon_url: Optional[str]
    role: str

    class Config:
        orm_mode = True 