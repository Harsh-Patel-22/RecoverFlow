import logging
from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])
logger = logging.getLogger(__name__)

class CampaignSettingsRequest(BaseModel):
    campaign_tone: str # HINGLISH | FORMAL_ENGLISH
    discount_percent: int # 0, 5, 10, 15

@router.get("/campaign")
async def get_campaign_settings():
    return {
        "campaign_tone": settings.DEFAULT_CAMPAIGN_TONE,
        "discount_percent": settings.DEFAULT_DISCOUNT_PERCENT
    }

@router.post("/campaign")
async def update_campaign_settings(req: CampaignSettingsRequest):
    settings.DEFAULT_CAMPAIGN_TONE = req.campaign_tone
    settings.DEFAULT_DISCOUNT_PERCENT = req.discount_percent
    logger.info(f"Campaign settings updated: tone={req.campaign_tone}, discount={req.discount_percent}%")
    return {
        "status": "success",
        "campaign_tone": settings.DEFAULT_CAMPAIGN_TONE,
        "discount_percent": settings.DEFAULT_DISCOUNT_PERCENT
    }
