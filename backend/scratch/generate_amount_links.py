import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.razorpay_client import rzp_client

async def main():
    amounts = [199, 299, 499, 699, 999, 1499, 1999, 2999, 4999, 9999, 17900, 25000]
    links = {}
    for amt in amounts:
        url = await rzp_client.create_payment_link(
            amount_rupees=float(amt),
            customer_name="Sample Subscriber",
            customer_email="subscriber@example.com",
            customer_phone="9104069628",
            description=f"Subscription renewal for Rs.{amt}",
            subscription_id=f"sub_amt_{amt}"
        )
        links[amt] = url
        print(f"Amount Rs.{amt:5d} -> Link: {url}")

if __name__ == "__main__":
    asyncio.run(main())
