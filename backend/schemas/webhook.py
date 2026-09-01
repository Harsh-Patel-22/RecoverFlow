from typing import Dict, Any, Optional
from pydantic import BaseModel

class WebhookResponse(BaseModel):
    status: str
    failure_id: Optional[str] = None
    message: Optional[str] = None
