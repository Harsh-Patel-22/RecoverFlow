import asyncio
import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from database import create_all_tables, AsyncSessionLocal
from batch.batch_runner import batch_runner
from services.classifier import ClassifierService
from models.subscription_failure import SubscriptionFailure
from datetime import datetime, timezone

async def test_all():
    print("Initializing database tables...")
    await create_all_tables()
    print("Database ready.")

    print("\n--- Testing Rule Classifier ---")
    classifier = ClassifierService()

    sf_insufficient = SubscriptionFailure(
        subscription_id="sub_test_001",
        customer_id="cust_001",
        customer_name="Arjun Sharma",
        customer_email="arjun@example.com",
        customer_phone="9876543210",
        plan_name="Pro Monthly",
        plan_amount=999.0,
        billing_cycle="monthly",
        error_code="BAD_REQUEST_ERROR",
        error_reason="insufficient_funds",
        error_source="customer",
        error_step="payment_authorization",
        error_description="The customer's account has insufficient balance.",
        payment_method="card",
        raw_webhook_payload={}
    )

    res1 = await classifier.classify(sf_insufficient)
    print(f"Result 1: class={res1.failure_class}, method={res1.classification_method}, confidence={res1.confidence}")
    assert res1.failure_class == "SOFT_INSUFFICIENT_FUNDS"

    print("\n--- Testing Batch Runner (10 Records) ---")
    batch_res = await batch_runner.run_batch(10)
    print(f"Batch processed: {batch_res.total_processed} items")
    print(f"MRR at risk: Rs.{batch_res.total_mrr_at_risk}")
    print(f"MRR recovered: Rs.{batch_res.total_mrr_recovered}")
    print(f"Recovery rate: {batch_res.recovery_rate}%")
    print(f"Audit logs created: {batch_res.audit_entries_created}")
    print(f"Processing time: {batch_res.processing_time_seconds}s")
    assert batch_res.total_processed == 10

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_all())
