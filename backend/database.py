from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

from sqlalchemy import text

async def create_all_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration for existing SQLite database
        for col_def in [
            "ADD COLUMN is_vip BOOLEAN DEFAULT 0",
            "ADD COLUMN discount_applied_percent INTEGER DEFAULT 0",
            "ADD COLUMN csm_status VARCHAR DEFAULT 'AUTOMATED'"
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE recovery_actions {col_def}"))
            except Exception:
                pass
