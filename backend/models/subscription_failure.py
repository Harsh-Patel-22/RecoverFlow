import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Index
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class SubscriptionFailure(Base):
    __tablename__ = "subscription_failures"
    __table_args__ = (
        Index("idx_sub_failure_lookup", "subscription_id", "created_at"),
        Index("idx_sub_status_created", "subscription_status", "created_at"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    subscription_id = Column(String, index=True, nullable=False)
    payment_id = Column(String, nullable=True)
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    plan_amount = Column(Float, nullable=False)
    billing_cycle = Column(String, nullable=False)
    failure_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    error_code = Column(String, nullable=False)
    error_reason = Column(String, nullable=False)
    error_source = Column(String, nullable=False)
    error_step = Column(String, nullable=False)
    error_description = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    upi_cap_amount = Column(Float, nullable=True)
    attempt_count = Column(Integer, default=1, nullable=False)
    subscription_status = Column(String, default="pending", nullable=False)
    raw_webhook_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
