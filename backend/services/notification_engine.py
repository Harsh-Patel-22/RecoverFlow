import urllib.parse
import logging
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from models.recovery_action import RecoveryAction
from models.subscription_failure import SubscriptionFailure
from services.audit_logger import audit_logger

from config import settings

logger = logging.getLogger(__name__)

class NotificationEngine:
    async def dispatch(
        self,
        session: AsyncSession,
        recovery_action: RecoveryAction,
        failure: SubscriptionFailure
    ) -> Tuple[Optional[str], Optional[str]]:
        raw_phone = (failure.customer_phone or "").replace("+91", "").strip()
        target_phone = settings.DEMO_PHONE_NUMBER.strip() if settings.DEMO_PHONE_NUMBER else f"91{raw_phone}"
        if target_phone and not target_phone.startswith("91") and len(target_phone) == 10:
            target_phone = f"91{target_phone}"

        email = failure.customer_email
        payment_link = recovery_action.razorpay_payment_link

        whatsapp_link: Optional[str] = None

        # Build WhatsApp deep link if channel is WHATSAPP or BOTH and message body exists
        if recovery_action.recovery_channel in ["WHATSAPP", "BOTH"] and recovery_action.message_body:
            encoded_msg = urllib.parse.quote(recovery_action.message_body, safe='')
            whatsapp_link = f"https://wa.me/{target_phone}?text={encoded_msg}"
            recovery_action.whatsapp_deep_link = whatsapp_link

        # Handle Mock Email printing if channel is EMAIL or BOTH
        if recovery_action.recovery_channel in ["EMAIL", "BOTH"]:
            subject = recovery_action.message_subject or f"Subscription Alert for {failure.plan_name}"
            body = recovery_action.message_body or f"Your subscription {failure.subscription_id} requires attention."
            safe_text = f"\n[EMAIL MOCK] To: {email}\nSubject: {subject}\n\n{body}\n".encode("ascii", errors="replace").decode("ascii")
            print(safe_text)

        # Update action status
        recovery_action.status = "SENT"
        await session.commit()

        # Audit log notification
        await audit_logger.log_notification_sent(
            session=session,
            failure_id=failure.id,
            subscription_id=failure.subscription_id,
            channel=recovery_action.recovery_channel,
            whatsapp_link=whatsapp_link,
            payment_link=payment_link
        )

        return whatsapp_link, payment_link

notification_engine = NotificationEngine()
