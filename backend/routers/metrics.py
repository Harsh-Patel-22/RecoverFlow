from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.subscription_failure import SubscriptionFailure
from models.recovery_action import RecoveryAction
from models.audit_log import AuditLog
from schemas.metrics import MetricsResponse

router = APIRouter(tags=["Metrics & Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(db: AsyncSession = Depends(get_db)):
    stmt = select(SubscriptionFailure, RecoveryAction).join(
        RecoveryAction, SubscriptionFailure.id == RecoveryAction.failure_id
    )
    res = await db.execute(stmt)
    rows = res.all()

    total_count = len(rows)
    mrr_at_risk = 0.0
    mrr_recovered = 0.0

    failures_by_class = {}
    failures_by_status = {}
    classification_method_breakdown = {"RULE_BASED": 0, "LLM": 0}
    channel_breakdown = {}

    for fail, act in rows:
        amount = fail.plan_amount or 0.0
        mrr_at_risk += amount

        f_cls = act.failure_class or "AMBIGUOUS"
        # Simulated recovery: 60% of SOFT_ classes
        if f_cls.startswith("SOFT_"):
            mrr_recovered += (amount * 0.60)

        failures_by_class[f_cls] = failures_by_class.get(f_cls, 0) + 1

        status = act.status or "PENDING"
        failures_by_status[status] = failures_by_status.get(status, 0) + 1

        method = act.classification_method or "RULE_BASED"
        classification_method_breakdown[method] = classification_method_breakdown.get(method, 0) + 1

        chan = act.recovery_channel or "NONE"
        channel_breakdown[chan] = channel_breakdown.get(chan, 0) + 1

    recovery_rate = (mrr_recovered / mrr_at_risk * 100.0) if mrr_at_risk > 0 else 0.0

    return MetricsResponse(
        total_failures_processed=total_count,
        total_mrr_at_risk_rupees=round(mrr_at_risk, 2),
        total_mrr_recovered_rupees=round(mrr_recovered, 2),
        overall_recovery_rate_percent=round(recovery_rate, 2),
        failures_by_class=failures_by_class,
        failures_by_status=failures_by_status,
        last_updated=datetime.now(timezone.utc),
        classification_method_breakdown=classification_method_breakdown,
        channel_breakdown=channel_breakdown
    )

@router.get("/audit/all")
async def get_all_audit_logs(limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(AuditLog)
        .order_by(AuditLog.event_timestamp.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return logs
