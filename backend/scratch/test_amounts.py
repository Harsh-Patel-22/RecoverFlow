import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.razorpay_client import rzp_client

async def main():
    test_cases = [
        ("Starter Plan", 199.0),
        ("Pro Plan", 1499.0),
        ("Enterprise Plan", 17900.0),
        ("Growth Plan", 25000.0)
    ]

    for plan, amt in test_cases:
        url = await rzp_client.create_payment_link(
            amount_rupees=amt,
            customer_name="Test Customer",
            customer_email="test@example.com",
            customer_phone="9104069628",
            description=f"Renewal for {plan}",
            subscription_id=f"sub_{int(amt)}"
        )
        print(f"Plan: {plan:15s} | Amount: Rs.{amt:7.2f} | Link: {url}")

if __name__ == "__main__":
    asyncio.run(main())
