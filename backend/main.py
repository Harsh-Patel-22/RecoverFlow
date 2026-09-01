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

from fastapi.responses import HTMLResponse
import urllib.parse
from config import settings

@app.get("/checkout", response_class=HTMLResponse)
async def razorpay_checkout_page(amt: float, customer: str = "Customer", plan: str = "Subscription Renewal", sub: str = "sub_demo"):
    amount_paise = int(amt * 100)
    key_id = settings.RAZORPAY_KEY_ID

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Razorpay Payment Checkout — {plan}</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #07162C;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }}
        .card {{
            background: #0F172A;
            border: 1px solid #1E293B;
            border-radius: 16px;
            padding: 32px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }}
        .logo {{
            width: 48px;
            height: 48px;
            background: #0066FF;
            border-radius: 10px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .amount {{
            font-size: 32px;
            font-weight: 800;
            color: #38BDF8;
            margin: 12px 0;
        }}
        .btn {{
            background: #0066FF;
            color: #ffffff;
            font-weight: 700;
            font-size: 14px;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
            transition: background 0.2s;
        }}
        .btn:hover {{
            background: #0052CC;
        }}
        .badge {{
            background: rgba(245, 158, 11, 0.1);
            color: #FBBF24;
            border: 1px solid rgba(245, 158, 11, 0.3);
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12.5 2L4.5 22h4.5l2.5-6.5h6.5l1.5-4h-6.5l2.5-6.5h2.5z" />
            </svg>
        </div>
        <span class="badge">Razorpay Test Mode</span>
        <h2 style="margin: 16px 0 4px; font-size: 20px;">{plan}</h2>
        <p style="color: #94A3B8; font-size: 13px; margin: 0;">Customer: {customer}</p>
        <div class="amount">₹{amt:,.2f}</div>
        <button id="pay-btn" class="btn">Pay Now via Razorpay</button>
    </div>

    <script>
        var options = {{
            "key": "{key_id}",
            "amount": "{amount_paise}",
            "currency": "INR",
            "name": "RecoverFlow SaaS",
            "description": "{plan}",
            "handler": function (response){{
                alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            }},
            "prefill": {{
                "name": "{customer}",
                "email": "customer@example.com"
            }},
            "theme": {{
                "color": "#0066FF"
            }}
        }};
        var rzp1 = new Razorpay(options);
        document.getElementById('pay-btn').onclick = function(e){{
            rzp1.open();
            e.preventDefault();
        }}
        // Auto open on load
        window.onload = function() {{
            rzp1.open();
        }};
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)

# Include Routers
app.include_router(webhooks_router)
app.include_router(batch_router)
app.include_router(subscriptions_router)
app.include_router(metrics_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
