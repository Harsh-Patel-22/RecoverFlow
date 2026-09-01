from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class SubscriptionFailureBase(BaseModel):
    subscription_id: str
    payment_id: Optional[str] = None
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    plan_name: str
    plan_amount: float
    billing_cycle: str
    failure_timestamp: datetime
    error_code: str
    error_reason: str
    error_source: str
    error_step: str
    error_description: str
    payment_method: str
    upi_cap_amount: Optional[float] = None
    attempt_count: int = 1
    subscription_status: str = "pending"

class SubscriptionFailureCreate(SubscriptionFailureBase):
    raw_webhook_payload: Dict[str, Any]

class SubscriptionFailureResponse(SubscriptionFailureBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
