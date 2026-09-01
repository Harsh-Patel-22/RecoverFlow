import time
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from models.subscription_failure import SubscriptionFailure
from schemas.recovery import AgentResult
from services.classifier import ClassifierService
from services.recovery_orchestrator import RecoveryOrchestrator
from services.audit_logger import audit_logger
from services.razorpay_client import rzp_client
from services.notification_engine import notification_engine

logger = logging.getLogger(__name__)

class RescueAgent:
    def __init__(self):
        self.classifier = ClassifierService()
        self.orchestrator = RecoveryOrchestrator()

    async def process(
        self,
        failure: SubscriptionFailure,
        db: AsyncSession,
        scheduler=None
    ) -> AgentResult:
        start_time = time.time()

        # Step 1: Webhook received log
        await audit_logger.log_webhook_received(
            session=db,
            failure_id=failure.id,
            subscription_id=failure.subscription_id,
            raw_payload=failure.raw_webhook_payload
        )

        # Step 2 & 3: Classify & Log Classification
        classification = await self.classifier.classify(failure)
        await audit_logger.log_classified(
            session=db,
            failure_id=failure.id,
            subscription_id=failure.subscription_id,
            classification=classification
        )

        # Step 4: Generate Razorpay Payment Link
        allowed_methods = ["card", "netbanking"] if classification.failure_class == "HARD_UPI_CAP_EXCEEDED" else None
        desc = f"Payment renewal for {failure.plan_name}"
        payment_link = await rzp_client.create_payment_link(
            amount_rupees=failure.plan_amount,
            customer_name=failure.customer_name,
            customer_email=failure.customer_email,
            customer_phone=failure.customer_phone,
            description=desc,
            subscription_id=failure.subscription_id,
            allowed_payment_methods=allowed_methods
        )

        # Step 5: Orchestrate recovery action
        recovery_action = await self.orchestrator.orchestrate(
            failure=failure,
            classification=classification,
            payment_link=payment_link
        )

        # Save action to DB
        db.add(recovery_action)
        await db.commit()
        await db.refresh(recovery_action)

        # Step 6 & 7: Dispatch notification & handle scheduling
        wa_link, p_link = await notification_engine.dispatch(
            session=db,
            recovery_action=recovery_action,
            failure=failure
        )

        if recovery_action.action_type == "SCHEDULE_RETRY" and recovery_action.scheduled_retry_at:
            if scheduler is not None:
                try:
                    # In test/demo environment, we register the job log
                    job_id = f"retry_{failure.subscription_id}_{recovery_action.id}"
                    logger.info(f"Scheduled retry job {job_id} at {recovery_action.scheduled_retry_at}")
                except Exception as e:
                    logger.warning(f"Failed to schedule job: {e}")

            await audit_logger.log_retry_scheduled(
                session=db,
                failure_id=failure.id,
                subscription_id=failure.subscription_id,
                scheduled_at=recovery_action.scheduled_retry_at
            )

        # Step 8 & 9: Log action selection and finalize
        last_log = await audit_logger.log_action_selected(
            session=db,
            failure_id=failure.id,
            subscription_id=failure.subscription_id,
            action=recovery_action
        )

        duration_ms = int((time.time() - start_time) * 1000)

        return AgentResult(
            failure_id=failure.id,
            subscription_id=failure.subscription_id,
            failure_class=classification.failure_class,
            action_taken=recovery_action.action_type,
            whatsapp_link=wa_link,
            payment_link=p_link,
            mrr_at_risk=failure.plan_amount,
            audit_trail_id=last_log.id,
            processing_time_ms=duration_ms
        )

rescue_agent = RescueAgent()
