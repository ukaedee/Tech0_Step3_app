from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では実際のフロントエンドのURLに変更
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 