import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Index
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_sub_created", "subscription_id", "created_at"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    failure_id = Column(String, ForeignKey("subscription_failures.id"), index=True, nullable=False)
    subscription_id = Column(String, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    event_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    actor = Column(String, default="RecoverFlow Agent v1.0", nullable=False)
    event_detail = Column(JSON, nullable=False)
    agent_reasoning = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
