import asyncio
import time
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from models.subscription_failure import SubscriptionFailure
from models.recovery_action import RecoveryAction
from models.audit_log import AuditLog
from schemas.metrics import BatchResult
from agent.rescue_agent import rescue_agent
from batch.synthetic_generator import synthetic_generator
from database import AsyncSessionLocal

logger = logging.getLogger(__name__)

ALL_CLASSES = [
    "SOFT_INSUFFICIENT_FUNDS",
    "SOFT_BANK_BLOCKED",
    "SOFT_NETWORK",
    "HARD_EXPIRED_CARD",
    "HARD_MANDATE_CANCELLED",
    "HARD_UPI_CAP_EXCEEDED",
    "HARD_FRAUD_FLAGGED",
    "AMBIGUOUS"
]

class BatchRunner:
    async def run_batch(self, count: int = 100) -> BatchResult:
        start_time = time.time()
        raw_records = synthetic_generator.generate_batch(count=count)

        semaphore = asyncio.Semaphore(5)
        agent_results = []

        async def _process_single(rec: Dict[str, Any]):
            async with semaphore:
                async with AsyncSessionLocal() as session:
                    failure = SubscriptionFailure(**rec)
                    session.add(failure)
                    await session.commit()
                    await session.refresh(failure)

                    result = await rescue_agent.process(failure=failure, db=session)
                    return result

        tasks = [_process_single(rec) for rec in raw_records]
        agent_results = await asyncio.gather(*tasks, return_exceptions=False)

        # Aggregate stats across batch
        total_processed = len(agent_results)
        total_mrr_at_risk = 0.0
        total_mrr_recovered = 0.0

        by_failure_class: Dict[str, Dict[str, Any]] = {
            cls: {"count": 0, "mrr": 0.0, "recovered": 0.0} for cls in ALL_CLASSES
        }
        by_action_type = {
            "SCHEDULE_RETRY": 0,
            "SEND_WHATSAPP": 0,
            "HALT_AND_NOTIFY": 0,
            "NO_ACTION": 0
        }
        by_channel = {
            "WHATSAPP": 0,
            "EMAIL": 0,
            "BOTH": 0,
            "NONE": 0
        }

        # Query actions for these failures
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select, func
            failure_ids = [res.failure_id for res in agent_results]
            stmt = select(SubscriptionFailure, RecoveryAction).join(
                RecoveryAction, SubscriptionFailure.id == RecoveryAction.failure_id
            ).where(SubscriptionFailure.id.in_(failure_ids))

            res = await session.execute(stmt)
            rows = res.all()

            # Count audit logs
            audit_stmt = select(func.count(AuditLog.id)).where(AuditLog.failure_id.in_(failure_ids))
            audit_res = await session.execute(audit_stmt)
            audit_count = audit_res.scalar() or 0

        for fail, act in rows:
            amount = fail.plan_amount
            f_cls = act.failure_class if act.failure_class in by_failure_class else "AMBIGUOUS"

            total_mrr_at_risk += amount

            # Simulated recovery rate: 60% of SOFT_ class MRR is recovered
            recovered_amount = (amount * 0.60) if f_cls.startswith("SOFT_") else 0.0
            total_mrr_recovered += recovered_amount

            by_failure_class[f_cls]["count"] += 1
            by_failure_class[f_cls]["mrr"] += amount
            by_failure_class[f_cls]["recovered"] += recovered_amount

            act_type = act.action_type if act.action_type in by_action_type else "NO_ACTION"
            by_action_type[act_type] += 1

            chan = act.recovery_channel if act.recovery_channel in by_channel else "NONE"
            by_channel[chan] += 1

        rec_rate = (total_mrr_recovered / total_mrr_at_risk * 100.0) if total_mrr_at_risk > 0 else 0.0
        elapsed_sec = round(time.time() - start_time, 2)

        return BatchResult(
            total_processed=total_processed,
            total_mrr_at_risk=round(total_mrr_at_risk, 2),
            total_mrr_recovered=round(total_mrr_recovered, 2),
            recovery_rate=round(rec_rate, 2),
            by_failure_class=by_failure_class,
            by_action_type=by_action_type,
            by_channel=by_channel,
            audit_entries_created=audit_count,
            processing_time_seconds=elapsed_sec
        )

batch_runner = BatchRunner()
