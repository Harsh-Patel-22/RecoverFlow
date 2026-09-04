from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import SubscriptionFailure
from services.entitlement_service import compute_entitlement_status

router = APIRouter(prefix="/entitlements", tags=["entitlements"])

@router.get("/{sub_id}/status")
async def get_entitlement_status(sub_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(SubscriptionFailure).where(
        (SubscriptionFailure.subscription_id == sub_id) | (SubscriptionFailure.id == sub_id)
    ).order_by(SubscriptionFailure.created_at.desc())
    res = await db.execute(stmt)
    failure = res.scalars().first()

    if not failure:
        # Fallback for demo sub IDs
        return {
            "subscription_id": sub_id,
            "tier": "RESTRICTED_READ_ONLY",
            "days_elapsed": 5,
            "can_access_app": True,
            "restricted_features": ["data_export", "ai_queries", "team_invites"],
            "banner_text": "⚠️ Subscription Overdue (Day 5/7) — Advanced features are restricted.",
            "customer_name": "Demo Account",
            "plan_name": "Pro Monthly",
            "plan_amount": 4999.0
        }

    status = compute_entitlement_status(failure.failure_timestamp)
    status.update({
        "subscription_id": failure.subscription_id,
        "customer_name": failure.customer_name,
        "plan_name": failure.plan_name,
        "plan_amount": failure.plan_amount
    })
    return status
