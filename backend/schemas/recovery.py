from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ClassificationResult(BaseModel):
    failure_class: str
    classification_method: str
    confidence: float
    reasoning: str
    retry_eligible: bool
    customer_action_required: bool
    customer_action_type: Optional[str] = None

class RecoveryActionResponse(BaseModel):
    id: str
    failure_id: str
    failure_class: str
    classification_method: str
    classification_confidence: float
    classification_reasoning: str
    retry_eligible: bool
    customer_action_required: bool
    customer_action_type: Optional[str] = None
    action_type: str
    recovery_channel: str
    scheduled_retry_at: Optional[datetime] = None
    whatsapp_deep_link: Optional[str] = None
    razorpay_payment_link: Optional[str] = None
    message_subject: Optional[str] = None
    message_body: Optional[str] = None
    stopping_rule_max_attempts: int
    stopping_rule_deadline: Optional[datetime] = None
    status: str
    outcome: Optional[str] = None
    mrr_impact: float
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AgentResult(BaseModel):
    failure_id: str
    subscription_id: str
    failure_class: str
    action_taken: str
    whatsapp_link: Optional[str] = None
    payment_link: Optional[str] = None
    mrr_at_risk: float
    audit_trail_id: str
    processing_time_ms: int
