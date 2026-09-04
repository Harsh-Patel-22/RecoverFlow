import json
import re
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, AsyncSessionLocal
from config import settings
from services.razorpay_client import rzp_client
from models.subscription_failure import SubscriptionFailure
from agent.rescue_agent import rescue_agent

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

def derive_customer_name(email: str) -> str:
    if not email or "@" not in email:
        return "Valued Customer"
    local_part = email.split("@")[0]
    # Remove numbers
    clean_part = re.sub(r'\d+', '', local_part)
    parts = clean_part.replace("_", ".").replace("-", ".").split(".")
    words = [p.capitalize() for p in parts if p]
    if words:
        return " ".join(words)
    return "Valued Customer"

async def _process_webhook_background(failure_id: str):
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        res = await session.execute(select(SubscriptionFailure).where(SubscriptionFailure.id == failure_id))
        failure = res.scalar_one_or_none()
        if failure:
            await rescue_agent.process(failure=failure, db=session)

@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    body_bytes = await request.body()

    # Webhook signature verification
    if settings.RAZORPAY_WEBHOOK_SECRET and not settings.RAZORPAY_WEBHOOK_SECRET.startswith("mock"):
        if not x_razorpay_signature:
            raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
        is_valid = await rzp_client.verify_webhook_signature(
            body=body_bytes,
            signature=x_razorpay_signature,
            secret=settings.RAZORPAY_WEBHOOK_SECRET
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload_dict = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Idempotency / Replay Attack Guard via Redis
    event_id = payload_dict.get("event_id") or request.headers.get("X-Razorpay-Event-Id")
    if event_id:
        from services.redis_client import redis_service
        is_new = await redis_service.check_and_set_idempotency(event_id=event_id, ttl_seconds=86400)
        if not is_new:
            return {"status": "duplicate_ignored", "event_id": event_id}

    event_type = payload_dict.get("event")
    
    # Handle payment success / completion webhooks
    if event_type in ["payment.captured", "subscription.charged"]:
        sub_entity = payload_dict.get("payload", {}).get("subscription", {}).get("entity", {})
        sub_id = sub_entity.get("id")
        if sub_id:
            from sqlalchemy import select, update
            from models.recovery_action import RecoveryAction
            from models.subscription_failure import SubscriptionFailure
            
            await db.execute(
                update(SubscriptionFailure)
                .where(SubscriptionFailure.subscription_id == sub_id)
                .values(subscription_status="active")
            )
            await db.execute(
                update(RecoveryAction)
                .where(RecoveryAction.failure_id.in_(
                    select(SubscriptionFailure.id).where(SubscriptionFailure.subscription_id == sub_id)
                ))
                .values(status="COMPLETED")
            )
            await db.commit()
            return {"status": "success_processed", "subscription_id": sub_id}
        return {"status": "success_received"}

    if event_type not in ["subscription.pending", "subscription.halted"]:
        return {"status": "ignored", "message": f"Event {event_type} ignored"}

    pay_entity = payload_dict.get("payload", {}).get("payment", {}).get("entity", {})
    sub_entity = payload_dict.get("payload", {}).get("subscription", {}).get("entity", {})

    sub_id = sub_entity.get("id") or "sub_unknown"
    pay_id = pay_entity.get("id")
    email = pay_entity.get("email") or "customer@example.com"
    contact = pay_entity.get("contact") or "+919876543210"
    clean_phone = contact.replace("+91", "").strip()
    cust_name = derive_customer_name(email)
    amount_rupees = (pay_entity.get("amount", 0) or 0) / 100.0

    raw_method = pay_entity.get("method", "card")
    method_map = {
        "card": "card",
        "upi": "upi_autopay",
        "emandate": "emandate",
        "netbanking": "netbanking"
    }
    payment_method = method_map.get(raw_method, raw_method)

    code = pay_entity.get("error_code") or "BAD_REQUEST_ERROR"
    reason = pay_entity.get("error_reason") or "payment_failed"
    source = pay_entity.get("error_source") or "bank"
    step = pay_entity.get("error_step") or "payment_authorization"
    desc = pay_entity.get("error_description") or "Payment failed"
    status = sub_entity.get("status") or "pending"
    attempts = sub_entity.get("auth_attempts", 1)

    failure = SubscriptionFailure(
        subscription_id=sub_id,
        payment_id=pay_id,
        customer_id=f"cust_{sub_id[:10]}",
        customer_name=cust_name,
        customer_email=email,
        customer_phone=clean_phone,
        plan_name="Pro Plan",
        plan_amount=amount_rupees,
        billing_cycle="monthly",
        failure_timestamp=datetime.now(timezone.utc),
        error_code=code,
        error_reason=reason,
        error_source=source,
        error_step=step,
        error_description=desc,
        payment_method=payment_method,
        upi_cap_amount=15000.0 if payment_method == "upi_autopay" and amount_rupees > 15000.0 else None,
        attempt_count=attempts,
        subscription_status=status,
        raw_webhook_payload=payload_dict
    )
    db.add(failure)
    await db.commit()
    await db.refresh(failure)

    # Process in background task without blocking response
    background_tasks.add_task(_process_webhook_background, failure.id)

    return {"status": "received", "failure_id": failure.id}
