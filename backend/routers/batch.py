import logging
from fastapi import APIRouter, HTTPException
from schemas.metrics import BatchRunRequest, BatchResult
from batch.batch_runner import batch_runner

router = APIRouter(prefix="/batch", tags=["Batch"])
logger = logging.getLogger(__name__)

_latest_batch_result: BatchResult = None

@router.post("/run", response_model=BatchResult)
async def run_synthetic_batch(req: BatchRunRequest):
    global _latest_batch_result
    count = req.count
    if count < 1 or count > 200:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 200")

    result = await batch_runner.run_batch(count=count)
    _latest_batch_result = result
    return result

@router.get("/results")
async def get_latest_batch_results():
    global _latest_batch_result
    if _latest_batch_result is None:
        # Run default batch of 100 if none run yet
        _latest_batch_result = await batch_runner.run_batch(count=100)
    return _latest_batch_result

from pydantic import BaseModel
from database import AsyncSessionLocal
from models.subscription_failure import SubscriptionFailure
from agent.rescue_agent import rescue_agent
import random, string

class SingleSimulateRequest(BaseModel):
    failure_class: str = "HARD_EXPIRED_CARD"
    customer_name: str = "Arjun Sharma"
    plan_name: str = "Pro Monthly"
    plan_amount: float = 1499.0

@router.post("/simulate-single")
async def simulate_single_event(req: SingleSimulateRequest):
    async with AsyncSessionLocal() as session:
        sub_id = "sub_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))
        inv_id = "inv_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))
        phone = "919104069628"

        descriptions = {
            "SOFT_INSUFFICIENT_FUNDS": "Insufficient funds in bank account",
            "HARD_EXPIRED_CARD": "Credit card expired on 08/26",
            "HARD_MANDATE_CANCELLED": "Auto-pay mandate cancelled by user bank",
            "SOFT_BANK_BLOCKED": "Bank temporary technical decline",
            "HARD_UPI_CAP_EXCEEDED": "Transaction amount exceeds RBI UPI AutoPay limit of Rs. 15,000",
            "SOFT_NETWORK": "Bank network gateway timeout",
            "HARD_FRAUD_FLAGGED": "High risk fraud pattern detected",
            "AMBIGUOUS": "Generic decline code 99"
        }

        rec = {
            "subscription_id": sub_id,
            "payment_id": f"pay_{sub_id[:10]}",
            "customer_id": f"cust_{sub_id[:8]}",
            "customer_name": req.customer_name,
            "customer_email": f"{req.customer_name.lower().replace(' ', '.')}@example.com",
            "customer_phone": phone,
            "plan_name": req.plan_name,
            "plan_amount": req.plan_amount,
            "billing_cycle": "monthly",
            "error_code": req.failure_class.lower(),
            "error_reason": req.failure_class.lower(),
            "error_source": "customer",
            "error_step": "payment_authentication",
            "error_description": descriptions.get(req.failure_class, "Decline code 99"),
            "payment_method": "upi" if req.failure_class == "HARD_UPI_CAP_EXCEEDED" else "card",
            "upi_cap_amount": 15000.0 if req.failure_class == "HARD_UPI_CAP_EXCEEDED" else None,
            "attempt_count": 1,
            "subscription_status": "pending",
            "raw_webhook_payload": {"event": "subscription.halted", "simulated": True}
        }

        failure = SubscriptionFailure(**rec)
        session.add(failure)
        await session.commit()
        await session.refresh(failure)

        result = await rescue_agent.process(failure=failure, db=session)
        return {
            "status": "success",
            "failure_id": failure.id,
            "failure_class": req.failure_class,
            "action_type": result.action_taken,
            "recovery_channel": "WHATSAPP" if result.whatsapp_link else "EMAIL",
            "razorpay_payment_link": result.payment_link,
            "is_vip": failure.plan_amount >= 20000.0,
            "csm_status": "MANUAL_CALL_REQUIRED" if failure.plan_amount >= 20000.0 else "AUTOMATED"
        }
