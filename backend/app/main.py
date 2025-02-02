from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

print(f"PORT環境変数: {os.environ.get('PORT')}")

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # ローカル開発環境
        "http://localhost:8080",  # ローカルバックエンド
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://tech0step3app-production.up.railway.app/",  # Railway.app上の全てのサービス
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"} 