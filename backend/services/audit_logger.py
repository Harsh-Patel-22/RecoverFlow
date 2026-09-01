from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from models.audit_log import AuditLog
from schemas.recovery import ClassificationResult
from models.recovery_action import RecoveryAction

class AuditLogger:
    async def _save_log(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        event_type: str,
        event_detail: Dict[str, Any],
        agent_reasoning: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            failure_id=failure_id,
            subscription_id=subscription_id,
            event_type=event_type,
            event_timestamp=datetime.now(timezone.utc),
            actor="RecoverFlow Agent v1.0",
            event_detail=event_detail,
            agent_reasoning=agent_reasoning
        )
        session.add(log_entry)
        await session.commit()
        await session.refresh(log_entry)
        return log_entry

    async def log_webhook_received(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        raw_payload: Dict[str, Any]
    ) -> AuditLog:
        event = raw_payload.get("event", "subscription.pending")
        payment_payload = raw_payload.get("payload", {}).get("payment", {}).get("entity", {})
        sub_payload = raw_payload.get("payload", {}).get("subscription", {}).get("entity", {})
        amount = (payment_payload.get("amount", 0) or 0) / 100.0
        attempts = sub_payload.get("auth_attempts", 1)

        detail = {
            "event": event,
            "subscription_id": subscription_id,
            "payment_id": payment_payload.get("id"),
            "plan_amount": amount,
            "attempt_count": attempts
        }
        return await self._save_log(session, failure_id, subscription_id, "WEBHOOK_RECEIVED", detail)

    async def log_classified(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        classification: ClassificationResult
    ) -> AuditLog:
        detail = {
            "failure_class": classification.failure_class,
            "method": classification.classification_method,
            "confidence": classification.confidence,
            "reasoning": classification.reasoning,
            "retry_eligible": classification.retry_eligible,
            "customer_action_required": classification.customer_action_required
        }
        agent_reasoning = classification.reasoning if classification.classification_method == "LLM" else None
        return await self._save_log(session, failure_id, subscription_id, "CLASSIFIED", detail, agent_reasoning)

    async def log_action_selected(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        action: RecoveryAction
    ) -> AuditLog:
        detail = {
            "action_type": action.action_type,
            "channel": action.recovery_channel,
            "scheduled_at": action.scheduled_retry_at.isoformat() if action.scheduled_retry_at else None,
            "stopping_rule": {
                "max_attempts": action.stopping_rule_max_attempts,
                "deadline": action.stopping_rule_deadline.isoformat() if action.stopping_rule_deadline else None
            },
            "payment_link_generated": bool(action.razorpay_payment_link)
        }
        return await self._save_log(session, failure_id, subscription_id, "ACTION_SELECTED", detail)

    async def log_notification_sent(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        channel: str,
        whatsapp_link: Optional[str] = None,
        payment_link: Optional[str] = None
    ) -> AuditLog:
        detail = {
            "channel": channel,
            "whatsapp_link": whatsapp_link,
            "payment_link": payment_link
        }
        return await self._save_log(session, failure_id, subscription_id, "NOTIFICATION_SENT", detail)

    async def log_retry_scheduled(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        scheduled_at: datetime
    ) -> AuditLog:
        detail = {
            "scheduled_retry_at": scheduled_at.isoformat() if scheduled_at else None
        }
        return await self._save_log(session, failure_id, subscription_id, "RETRY_SCHEDULED", detail)

    async def log_retry_executed(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        attempt_count: int,
        outcome: str,
        razorpay_payment_id: Optional[str] = None
    ) -> AuditLog:
        detail = {
            "attempt_number": attempt_count,
            "razorpay_api_called": True,
            "result": outcome,
            "razorpay_payment_id": razorpay_payment_id
        }
        return await self._save_log(session, failure_id, subscription_id, "RETRY_EXECUTED", detail)

    async def log_outcome_recorded(
        self,
        session: AsyncSession,
        failure_id: str,
        subscription_id: str,
        outcome: str,
        mrr_impact: float,
        total_attempts: int = 1
    ) -> AuditLog:
        detail = {
            "outcome": outcome,
            "mrr_impact_rupees": mrr_impact,
            "total_attempts_made": total_attempts
        }
        return await self._save_log(session, failure_id, subscription_id, "OUTCOME_RECORDED", detail)

audit_logger = AuditLogger()
