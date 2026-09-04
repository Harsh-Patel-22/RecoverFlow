from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import SubscriptionFailure
from services.invoice_service import generate_gst_invoice_html

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("/{sub_id}/gst-invoice", response_class=HTMLResponse)
async def get_gst_invoice(
    sub_id: str,
    gstin: str = Query("27AAACB1234C1Z5"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SubscriptionFailure).where(
        (SubscriptionFailure.subscription_id == sub_id) | (SubscriptionFailure.id == sub_id)
    ).order_by(SubscriptionFailure.created_at.desc())
    res = await db.execute(stmt)
    failure = res.scalars().first()

    customer_name = failure.customer_name if failure else "Valued Customer"
    plan_name = failure.plan_name if failure else "Enterprise SaaS Plan"
    amount = failure.plan_amount if failure else 17900.0

    html_content = generate_gst_invoice_html(
        subscription_id=sub_id,
        customer_name=customer_name,
        plan_name=plan_name,
        amount=amount,
        gstin=gstin
    )
    return HTMLResponse(content=html_content)
