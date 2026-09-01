import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str
    ANTHROPIC_API_KEY: str = ""
    DEMO_PHONE_NUMBER: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./recoverflow.db"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
