from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 開発環境
        "https://tech0-step3-app.vercel.app",  # 本番環境
        "https://tech0-step3-app-git-main-ukaedee.vercel.app"  # プレビュー環境
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"} 