import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import create_all_tables
from routers import webhooks_router, batch_router, subscriptions_router, metrics_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("recoverflow")

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite tables
    await create_all_tables()

    # 2. Start APScheduler
    if not scheduler.running:
        scheduler.start()

    logger.info("RecoverFlow Agent started. Database ready.")

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown()
    logger.info("RecoverFlow Agent shutdown complete.")

app = FastAPI(
    title="RecoverFlow — AI Subscription Rescue Agent API",
    version="1.0.0",
    description="Razorpay Buildathon 2026, Track 03: AI Revenue Recovery Agent",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request duration logging middleware
@app.middleware("http")
async def log_request_duration(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000.0
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)")
    return response

# Include Routers
app.include_router(webhooks_router)
app.include_router(batch_router)
app.include_router(subscriptions_router)
app.include_router(metrics_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
