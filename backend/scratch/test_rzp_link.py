import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.razorpay_client import rzp_client

async def test():
    print(f"Key ID: {rzp_client.key_id}")
    print(f"Key Secret: {rzp_client.key_secret[:4]}...")
    try:
        url = await rzp_client.create_payment_link(
            amount_rupees=17900.0,
            customer_name="Harsh Patel",
            customer_email="harsh@example.com",
            customer_phone="9104069628",
            description="RecoverFlow Subscription Renewal - Enterprise Plan",
            subscription_id="sub_test_17900",
            allowed_payment_methods=["card", "netbanking"]
        )
        print(f"GENERATED PAYMENT LINK: {url}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test())
