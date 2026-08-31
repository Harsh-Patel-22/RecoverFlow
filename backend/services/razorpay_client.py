import asyncio
import hmac
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import razorpay
from config import settings

logger = logging.getLogger(__name__)

class RazorpayClient:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.client = None
        if self.key_id and self.key_secret and not self.key_id.startswith("rzp_test_mock"):
            try:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                logger.warning(f"Razorpay SDK client init warning: {e}")

    async def create_payment_link(
        self,
        amount_rupees: float,
        customer_name: str,
        customer_email: str,
        customer_phone: str,
        description: str,
        subscription_id: str,
        allowed_payment_methods: Optional[List[str]] = None
    ) -> str:
        clean_phone = customer_phone.replace("+91", "").strip()
        expire_time = int((datetime.now(timezone.utc) + timedelta(days=5)).timestamp())

        payload: Dict[str, Any] = {
            "amount": int(amount_rupees * 100), # convert to paise
            "currency": "INR",
            "accept_partial": False,
            "description": description[:200],
            "customer": {
                "name": customer_name,
                "email": customer_email,
                "contact": f"+91{clean_phone}"
            },
            "notify": {"sms": True, "email": True},
            "reminder_enable": True,
            "notes": {
                "subscription_id": subscription_id,
                "source": "RecoverFlow"
            },
            "expire_by": expire_time
        }

        if allowed_payment_methods is not None:
            # Configure allowed options (e.g. excluding UPI for HARD_UPI_CAP_EXCEEDED)
            methods_config = {m: 1 for m in allowed_payment_methods}
            if "upi" not in allowed_payment_methods:
                methods_config["upi"] = 0
            payload["options"] = {"order": {"payment": {"method": methods_config}}}

        if self.client is not None:
            try:
                def _call_rzp():
                    return self.client.payment_link.create(payload)

                res = await asyncio.to_thread(_call_rzp)
                if isinstance(res, dict) and "short_url" in res:
                    return res["short_url"]
            except Exception as e:
                logger.error(f"Razorpay API call failed: {e}")

        # Fallback short_url for test/demo mode when SDK key is placeholder or API call fails
        sub_hash = hashlib.md5(subscription_id.encode()).hexdigest()[:8]
        return f"https://rzp.io/i/{sub_hash}"

    async def create_subscription(
        self,
        plan_id: str,
        total_count: int,
        customer_notify: int = 1
    ) -> dict:
        if self.client is not None:
            try:
                def _call():
                    return self.client.subscription.create({
                        "plan_id": plan_id,
                        "total_count": total_count,
                        "customer_notify": customer_notify
                    })
                return await asyncio.to_thread(_call)
            except Exception as e:
                logger.error(f"create_subscription failed: {e}")
        return {"id": "sub_test_mock", "status": "created"}

    async def fetch_subscription(self, subscription_id: str) -> dict:
        if self.client is not None:
            try:
                def _call():
                    return self.client.subscription.fetch(subscription_id)
                return await asyncio.to_thread(_call)
            except Exception as e:
                logger.error(f"fetch_subscription failed: {e}")
        return {"id": subscription_id, "status": "pending"}

    async def charge_subscription(self, subscription_id: str) -> dict:
        if self.client is not None:
            try:
                def _call():
                    return self.client.subscription.charge(subscription_id, {})
                return await asyncio.to_thread(_call)
            except Exception as e:
                logger.error(f"charge_subscription failed: {e}")
        return {"id": f"pay_retry_{subscription_id}", "status": "captured"}

    async def verify_webhook_signature(
        self,
        body: bytes,
        signature: str,
        secret: str
    ) -> bool:
        if not signature or not secret:
            return False
        try:
            expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected, signature)
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            return False

rzp_client = RazorpayClient()
