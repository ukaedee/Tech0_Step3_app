from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    temp_password = Column(String(255), nullable=True)
    icon_url = Column(Text, nullable=True)
    department = Column(Text, nullable=True)
    role = Column(Enum('admin', 'employee', name='role_types'), default='employee')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now()) 