import random
import string
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

INDIAN_NAMES = [
    "Arjun Sharma", "Priya Patel", "Rahul Gupta", "Sneha Iyer",
    "Vikram Nair", "Ananya Singh", "Rohit Verma", "Kavita Joshi",
    "Aditya Kumar", "Pooja Mehta", "Saurabh Mishra", "Divya Reddy",
    "Nikhil Bhatia", "Swati Chauhan", "Kunal Shah", "Meera Pillai",
    "Deepak Agarwal", "Neha Saxena", "Suresh Pandey", "Ritu Nayak"
]

PLANS = [
    "Starter Monthly", "Pro Monthly", "Business Monthly",
    "Starter Quarterly", "Pro Quarterly", "Enterprise Monthly",
    "Team Plan Monthly", "Growth Plan Quarterly"
]

AMOUNTS = [199, 299, 499, 699, 999, 1499, 1999, 2999, 4999, 9999]

def random_string(prefix: str, length: int) -> str:
    chars = string.ascii_letters + string.digits
    return prefix + ''.join(random.choices(chars, k=length))

def generate_random_phone() -> str:
    return "9" + ''.join(random.choices(string.digits, k=9))

class SyntheticGenerator:
    def generate_batch(self, count: int = 100) -> List[Dict[str, Any]]:
        # Calculate class distribution
        ratios = {
            "SOFT_INSUFFICIENT_FUNDS": 0.35,
            "HARD_EXPIRED_CARD": 0.18,
            "HARD_MANDATE_CANCELLED": 0.15,
            "SOFT_BANK_BLOCKED": 0.12,
            "HARD_UPI_CAP_EXCEEDED": 0.08,
            "SOFT_NETWORK": 0.07,
            "HARD_FRAUD_FLAGGED": 0.03,
            "AMBIGUOUS": 0.02
        }

        records_to_generate = []
        for f_class, ratio in ratios.items():
            num = int(round(count * ratio))
            for _ in range(num):
                records_to_generate.append(f_class)

        # Fill remaining or truncate to reach exact count
        while len(records_to_generate) < count:
            records_to_generate.append("SOFT_INSUFFICIENT_FUNDS")
        records_to_generate = records_to_generate[:count]
        random.shuffle(records_to_generate)

        batch = []
        now = datetime.now(timezone.utc)

        for target_class in records_to_generate:
            name = random.choice(INDIAN_NAMES)
            parts = name.lower().split()
            digits = random.randint(10, 99)
            email = f"{parts[0]}.{parts[1]}{digits}@gmail.com"
            phone = generate_random_phone()
            plan = random.choice(PLANS)
            billing_cycle = "quarterly" if "Quarterly" in plan else "monthly"

            if target_class == "HARD_UPI_CAP_EXCEEDED":
                amount = float(random.randint(155, 500) * 100)
            else:
                amount = float(random.choice(AMOUNTS))

            sub_id = random_string("sub_", 14)
            pay_id = random_string("pay_", 14)
            cust_id = random_string("cust_", 10)
            days_ago = random.randint(0, 30)
            fail_time = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            attempts = random.randint(1, 3)
            sub_status = "pending" if attempts <= 2 else "halted"

            # Set parameters based on class specs
            if target_class == "SOFT_INSUFFICIENT_FUNDS":
                code = "BAD_REQUEST_ERROR"
                reason = "insufficient_funds"
                source = "customer"
                step = "payment_authorization"
                desc = "The customer's account has insufficient balance."
                method = random.choice(["upi_autopay", "card", "emandate"])
            elif target_class == "HARD_EXPIRED_CARD":
                code = "BAD_REQUEST_ERROR"
                reason = "expired_card"
                source = "customer"
                step = "payment_initiation"
                desc = "The payment could not be completed because the customer's card is expired."
                method = "card"
            elif target_class == "HARD_MANDATE_CANCELLED":
                code = "BAD_REQUEST_ERROR"
                reason = "mandate_cancelled"
                source = "customer"
                step = "payment_authentication"
                desc = "The customer has cancelled the mandate from their end."
                method = random.choice(["upi_autopay", "emandate"])
            elif target_class == "SOFT_BANK_BLOCKED":
                code = "GATEWAY_ERROR"
                reason = "do_not_honor"
                source = "bank"
                step = "payment_authorization"
                desc = "The payment was declined by the customer's bank."
                method = random.choice(["card", "netbanking"])
            elif target_class == "HARD_UPI_CAP_EXCEEDED":
                code = "BAD_REQUEST_ERROR"
                reason = "upi_limit_exceeded"
                source = "customer"
                step = "payment_authorization"
                desc = "The amount exceeds the UPI AutoPay limit."
                method = "upi_autopay"
            elif target_class == "SOFT_NETWORK":
                code = "GATEWAY_ERROR"
                reason = "payment_timeout"
                source = "network"
                step = "payment_initiation"
                desc = "There was a downtime on our partner bank."
                method = random.choice(["upi_autopay", "card"])
            elif target_class == "HARD_FRAUD_FLAGGED":
                code = "BAD_REQUEST_ERROR"
                reason = "fraud_suspected"
                source = "bank"
                step = "payment_authorization"
                desc = "The payment was declined by the customer's bank due to suspected fraud."
                method = "card"
            else: # AMBIGUOUS
                code = "BAD_REQUEST_ERROR"
                reason = "payment_failed"
                source = "bank"
                step = "payment_authorization"
                desc = "Payment failed."
                method = random.choice(["card", "upi_autopay"])

            # Map method string to Razorpay webhook method format
            rzp_method_map = {
                "upi_autopay": "upi",
                "card": "card",
                "emandate": "emandate",
                "netbanking": "netbanking"
            }

            raw_webhook = {
                "entity": "event",
                "account_id": "acc_test123",
                "event": f"subscription.{sub_status}",
                "contains": ["payment", "subscription"],
                "payload": {
                    "payment": {
                        "entity": {
                            "id": pay_id,
                            "entity": "payment",
                            "amount": int(amount * 100),
                            "currency": "INR",
                            "status": "failed",
                            "order_id": None,
                            "invoice_id": random_string("inv_", 14),
                            "international": False,
                            "method": rzp_method_map.get(method, "card"),
                            "error_code": code,
                            "error_description": desc,
                            "error_source": source,
                            "error_step": step,
                            "error_reason": reason,
                            "recurring": True,
                            "recurring_token": random_string("token_", 14),
                            "contact": f"+91{phone}",
                            "email": email,
                            "created_at": int(fail_time.timestamp())
                        }
                    },
                    "subscription": {
                        "entity": {
                            "id": sub_id,
                            "entity": "subscription",
                            "plan_id": random_string("plan_", 14),
                            "status": sub_status,
                            "current_start": int((fail_time - timedelta(days=30)).timestamp()),
                            "current_end": int(fail_time.timestamp()),
                            "ended_at": None,
                            "quantity": 1,
                            "notes": {},
                            "charge_at": int(fail_time.timestamp()),
                            "start_at": int((fail_time - timedelta(days=60)).timestamp()),
                            "end_at": None,
                            "auth_attempts": attempts,
                            "total_count": 12,
                            "paid_count": 3,
                            "customer_notify": 1,
                            "created_at": int((fail_time - timedelta(days=60)).timestamp()),
                            "expire_by": None,
                            "short_url": None,
                            "has_scheduled_changes": False,
                            "change_scheduled_at": None,
                            "remaining_count": 9
                        }
                    }
                },
                "created_at": int(fail_time.timestamp())
            }

            rec = {
                "subscription_id": sub_id,
                "payment_id": pay_id,
                "customer_id": cust_id,
                "customer_name": name,
                "customer_email": email,
                "customer_phone": phone,
                "plan_name": plan,
                "plan_amount": amount,
                "billing_cycle": billing_cycle,
                "failure_timestamp": fail_time,
                "error_code": code,
                "error_reason": reason,
                "error_source": source,
                "error_step": step,
                "error_description": desc,
                "payment_method": method,
                "upi_cap_amount": 15000.0 if method == "upi_autopay" and amount > 15000.0 else None,
                "attempt_count": attempts,
                "subscription_status": sub_status,
                "raw_webhook_payload": raw_webhook
            }
            batch.append(rec)

        return batch

synthetic_generator = SyntheticGenerator()
