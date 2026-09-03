from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.subscription_failure import SubscriptionFailure
from models.recovery_action import RecoveryAction
from models.audit_log import AuditLog
from schemas.failure import SubscriptionFailureResponse
from schemas.recovery import RecoveryActionResponse

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/failing")
async def get_failing_subscriptions(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SubscriptionFailure, RecoveryAction)
        .outerjoin(RecoveryAction, SubscriptionFailure.id == RecoveryAction.failure_id)
        .where(SubscriptionFailure.subscription_status.in_(["pending", "halted"]))
        .order_by(SubscriptionFailure.failure_timestamp.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for fail, act in rows:
        items.append({
            "failure": SubscriptionFailureResponse.model_validate(fail),
            "recovery_action": RecoveryActionResponse.model_validate(act) if act else None
        })
    return items

@router.get("/{failure_id}/audit")
async def get_failure_audit_logs(failure_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(AuditLog)
        .where(AuditLog.failure_id == failure_id)
        .order_by(AuditLog.event_timestamp.asc())
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs

@router.get("/{failure_id}")
async def get_subscription_failure(failure_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SubscriptionFailure, RecoveryAction)
        .outerjoin(RecoveryAction, SubscriptionFailure.id == RecoveryAction.failure_id)
        .where(SubscriptionFailure.id == failure_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription failure record not found")
    fail, act = row
    return {
        "failure": SubscriptionFailureResponse.model_validate(fail),
        "recovery_action": RecoveryActionResponse.model_validate(act) if act else None
    }

@router.post("/{failure_id}/assign-csm")
async def assign_csm_to_failure(failure_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(RecoveryAction).where(RecoveryAction.failure_id == failure_id)
    res = await db.execute(stmt)
    act = res.scalar_one_or_none()
    if not act:
        raise HTTPException(status_code=404, detail="Recovery action record not found")

    act.csm_status = "CSM_ASSIGNED"
    act.is_vip = True

    audit = AuditLog(
        failure_id=failure_id,
        event_type="CSM_ASSIGNED",
        actor="MERCHANT_USER",
        description="Assigned high-value account to Senior CSM for direct manual outreach",
        metadata_json={"csm_status": "CSM_ASSIGNED"}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(act)
    return {"status": "success", "csm_status": act.csm_status}
