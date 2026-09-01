from datetime import datetime
from typing import Dict, Any, List
from pydantic import BaseModel

class MetricsResponse(BaseModel):
    total_failures_processed: int
    total_mrr_at_risk_rupees: float
    total_mrr_recovered_rupees: float
    overall_recovery_rate_percent: float
    failures_by_class: Dict[str, int]
    failures_by_status: Dict[str, int]
    last_updated: datetime
    classification_method_breakdown: Dict[str, int]
    channel_breakdown: Dict[str, int]

class BatchRunRequest(BaseModel):
    count: int = 100

class BatchResult(BaseModel):
    total_processed: int
    total_mrr_at_risk: float
    total_mrr_recovered: float
    recovery_rate: float
    by_failure_class: Dict[str, Dict[str, Any]]
    by_action_type: Dict[str, int]
    by_channel: Dict[str, int]
    audit_entries_created: int
    processing_time_seconds: float
