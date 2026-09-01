from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from models.subscription_failure import SubscriptionFailure
from models.recovery_action import RecoveryAction
from schemas.recovery import ClassificationResult

def compute_salary_day_retry(base_dt: datetime) -> datetime:
    if base_dt is None:
        base_dt = datetime.now(timezone.utc)
    # Convert to UTC naive or aware
    day = base_dt.day
    if day <= 25:
        # 28th of current month
        target = base_dt.replace(day=28, hour=10, minute=0, second=0, microsecond=0)
    else:
        # 1st of next month
        if base_dt.month == 12:
            target = base_dt.replace(year=base_dt.year + 1, month=1, day=1, hour=10, minute=0, second=0, microsecond=0)
        else:
            target = base_dt.replace(month=base_dt.month + 1, day=1, hour=10, minute=0, second=0, microsecond=0)
    return target

class RecoveryOrchestrator:
    async def orchestrate(
        self,
        failure: SubscriptionFailure,
        classification: ClassificationResult,
        payment_link: str = "https://rzp.io/l/demo_pay"
    ) -> RecoveryAction:
        f_class = classification.failure_class
        base_time = failure.failure_timestamp or datetime.now(timezone.utc)

        # Handle AMBIGUOUS low confidence case
        if f_class == "AMBIGUOUS" and classification.confidence < 0.5:
            return RecoveryAction(
                failure_id=failure.id,
                failure_class="AMBIGUOUS",
                classification_method=classification.classification_method,
                classification_confidence=classification.confidence,
                classification_reasoning=classification.reasoning,
                retry_eligible=False,
                customer_action_required=False,
                customer_action_type=None,
                action_type="HALT_AND_NOTIFY",
                recovery_channel="EMAIL",
                scheduled_retry_at=None,
                whatsapp_deep_link=None,
                razorpay_payment_link=None,
                message_subject=f"[ALERT] Unclassified Subscription Failure: {failure.subscription_id}",
                message_body=f"Could not classify failure for sub {failure.subscription_id}. Manual review needed.\nError: {failure.error_description}",
                stopping_rule_max_attempts=0,
                stopping_rule_deadline=None,
                status="PENDING",
                outcome="MERCHANT_ESCALATED",
                mrr_impact=0.0
            )

        # Default properties based on failure class
        if f_class == "SOFT_INSUFFICIENT_FUNDS":
            retry_at = compute_salary_day_retry(base_time)
            max_attempts = 3
            deadline = base_time + timedelta(days=7)
            action_type = "SCHEDULE_RETRY"
            channel = "WHATSAPP"
            subject = None
            msg = (f"Hii {failure.customer_name}! 😊 Aapki {failure.plan_name} subscription ka ₹{failure.plan_amount:.0f} "
                   f"renewal pending hai. Account mein balance add karke is link se payment complete karein: {payment_link}. "
                   f"Koi problem ho toh reply karein! 🙏")

        elif f_class == "SOFT_BANK_BLOCKED":
            retry_at = base_time + timedelta(hours=24)
            max_attempts = 2
            deadline = base_time + timedelta(days=3)
            action_type = "SCHEDULE_RETRY"
            channel = "WHATSAPP"
            subject = None
            msg = (f"Hi {failure.customer_name}, aapke bank ne temporarily {failure.plan_name} ka payment block kiya hai. "
                   f"Hum kal dobara try karenge. Agar aap khud pay karna chahte hain: {payment_link}")

        elif f_class == "SOFT_NETWORK":
            retry_at = base_time + timedelta(hours=4)
            max_attempts = 1
            deadline = base_time + timedelta(hours=8)
            action_type = "SCHEDULE_RETRY"
            channel = "NONE"
            subject = None
            msg = None

        elif f_class == "HARD_EXPIRED_CARD":
            retry_at = None
            max_attempts = 0
            deadline = base_time + timedelta(days=5)
            action_type = "SEND_WHATSAPP"
            channel = "BOTH"
            card_update_link = f"{payment_link}#update-card"
            msg = (f"Hi {failure.customer_name}! Aapka {failure.plan_name} subscription renew nahi hua kyunki card expire ho gaya hai. "
                   f"Naya card add karein: {card_update_link}\nYa is link se directly pay karein: {payment_link} 🙏")
            subject = f"Action Required: Update your card for {failure.plan_name}"

        elif f_class == "HARD_MANDATE_CANCELLED":
            retry_at = None
            max_attempts = 0
            deadline = base_time + timedelta(days=3)
            action_type = "SEND_WHATSAPP"
            channel = "BOTH"
            msg = (f"Hi {failure.customer_name}, aapka {failure.plan_name} auto-pay mandate cancel ho gaya hai. "
                   f"Service continue rakhne ke liye dobara authorize karein ya is link se pay karein: {payment_link}")
            subject = f"Action Required: Re-authorize your subscription for {failure.plan_name}"

        elif f_class == "HARD_UPI_CAP_EXCEEDED":
            retry_at = None
            max_attempts = 0
            deadline = base_time + timedelta(days=2)
            action_type = "SEND_WHATSAPP"
            channel = "WHATSAPP"
            msg = (f"Hi {failure.customer_name}! ₹{failure.plan_amount:.0f} ki payment UPI se nahi ho sakti "
                   f"(RBI limit ₹15,000 hai). Card ya NetBanking se pay karein: {payment_link} ✅")
            subject = None

        elif f_class == "HARD_FRAUD_FLAGGED":
            retry_at = None
            max_attempts = 0
            deadline = None
            action_type = "HALT_AND_NOTIFY"
            channel = "EMAIL"
            msg = f"Fraud flagged on subscription {failure.subscription_id}.\nCustomer: {failure.customer_name} ({failure.customer_email})\nReason: {failure.error_description}\nAction: Immediate manual review recommended."
            subject = f"[ALERT] Fraud flag on subscription {failure.subscription_id}"

        else: # AMBIGUOUS or unhandled
            retry_at = None
            max_attempts = 0
            deadline = None
            action_type = "HALT_AND_NOTIFY"
            channel = "EMAIL"
            msg = f"Could not classify failure for sub {failure.subscription_id}. Manual review needed."
            subject = f"[ALERT] Subscription Failure Review: {failure.subscription_id}"

        return RecoveryAction(
            failure_id=failure.id,
            failure_class=f_class,
            classification_method=classification.classification_method,
            classification_confidence=classification.confidence,
            classification_reasoning=classification.reasoning,
            retry_eligible=classification.retry_eligible,
            customer_action_required=classification.customer_action_required,
            customer_action_type=classification.customer_action_type,
            action_type=action_type,
            recovery_channel=channel,
            scheduled_retry_at=retry_at,
            whatsapp_deep_link=None,
            razorpay_payment_link=payment_link,
            message_subject=subject,
            message_body=msg,
            stopping_rule_max_attempts=max_attempts,
            stopping_rule_deadline=deadline,
            status="PENDING",
            outcome=None,
            mrr_impact=failure.plan_amount if f_class.startswith("SOFT_") else 0.0
        )
