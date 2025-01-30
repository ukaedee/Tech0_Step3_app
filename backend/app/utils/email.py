from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "465")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    MAIL_FROM_NAME="Employee Management System",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_password_reset_email(email: EmailStr, temp_password: str):
    message = MessageSchema(
        subject="パスワードリセット",
        recipients=[email],
        body=f"""
        パスワードがリセットされました。

        仮パスワード: {temp_password}

        セキュリティのため、ログイン後すぐにパスワードを変更してください。
        """,
        subtype="plain"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_welcome_email(email: EmailStr, name: str, temp_password: str):
    message = MessageSchema(
        subject="従業員管理システムへようこそ",
        recipients=[email],
        body=f"""
        {name}様

        従業員管理システムへのアカウントが作成されました。

        初期パスワード: {temp_password}

        セキュリティのため、初回ログイン後すぐにパスワードを変更してください。
        """,
        subtype="plain"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_invitation_email(to_email: EmailStr, name: str, invitation_url: str):
    message = MessageSchema(
        subject="従業員管理システムへの招待",
        recipients=[to_email],  # 任意のメールアドレスを指定可能
        body=f"""
        {name}様

        従業員管理システムへ招待されました。
        以下のURLからアカウントを作成してください：

        {invitation_url}

        このURLの有効期限は24時間です。
        """,
        subtype="plain"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message) 