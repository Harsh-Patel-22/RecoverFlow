import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Index
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RecoveryAction(Base):
    __tablename__ = "recovery_actions"
    __table_args__ = (
        Index("idx_action_failure_created", "failure_id", "created_at"),
        Index("idx_action_status_created", "status", "created_at"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    failure_id = Column(String, ForeignKey("subscription_failures.id"), index=True, nullable=False)
    failure_class = Column(String, nullable=False)
    classification_method = Column(String, nullable=False)
    classification_confidence = Column(Float, nullable=False)
    classification_reasoning = Column(String(500), nullable=False)
    retry_eligible = Column(Boolean, nullable=False)
    customer_action_required = Column(Boolean, nullable=False)
    customer_action_type = Column(String, nullable=True)
    action_type = Column(String, nullable=False)
    recovery_channel = Column(String, nullable=False)
    scheduled_retry_at = Column(DateTime(timezone=True), nullable=True)
    whatsapp_deep_link = Column(String, nullable=True)
    razorpay_payment_link = Column(String, nullable=True)
    message_subject = Column(String, nullable=True)
    message_body = Column(String, nullable=True)
    stopping_rule_max_attempts = Column(Integer, default=3, nullable=False)
    stopping_rule_deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="PENDING", nullable=False)
    outcome = Column(String, nullable=True)
    mrr_impact = Column(Float, default=0.0, nullable=False)
    is_vip = Column(Boolean, default=False, nullable=False)
    discount_applied_percent = Column(Integer, default=0, nullable=False)
    csm_status = Column(String, default="AUTOMATED", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
