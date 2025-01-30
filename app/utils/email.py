from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr, BaseModel
from typing import List
import os
from dotenv import load_dotenv
from pathlib import Path

# .envファイルのパスを明示的に指定
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: str

# 環境変数の存在を確認
mail_config = {
    "MAIL_USERNAME": os.getenv("MAIL_USERNAME"),
    "MAIL_PASSWORD": os.getenv("MAIL_PASSWORD"),
    "MAIL_FROM": os.getenv("MAIL_FROM"),
    "MAIL_PORT": int(os.getenv("MAIL_PORT", "465")),
    "MAIL_SERVER": os.getenv("MAIL_SERVER"),
    "MAIL_STARTTLS": os.getenv("MAIL_STARTTLS", "False").lower() == "true",
    "MAIL_SSL_TLS": os.getenv("MAIL_SSL_TLS", "True").lower() == "true",
    "MAIL_FROM_NAME": "Employee Management System",
    "USE_CREDENTIALS": True,
    "VALIDATE_CERTS": True
}

# 設定値の確認
print("Mail config:", mail_config)

conf = ConnectionConfig(**mail_config)

fastmail = FastMail(conf)

async def send_email(email: EmailStr, subject: str, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype="html"
    )
    
    await fastmail.send_message(message)
    return True

async def send_welcome_email(email: EmailStr, username: str):
    subject = "Welcome to Employee Management System"
    body = f"""
    <html>
        <body>
            <h2>Welcome to Employee Management System!</h2>
            <p>Dear {username},</p>
            <p>Your account has been successfully created. You can now log in to the system.</p>
            <p>Best regards,<br>Employee Management System Team</p>
        </body>
    </html>
    """
    return await send_email(email, subject, body)

async def send_password_reset_email(email: EmailStr, reset_token: str):
    subject = "Password Reset Request"
    reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
    body = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best regards,<br>Employee Management System Team</p>
        </body>
    </html>
    """
    return await send_email(email, subject, body) 