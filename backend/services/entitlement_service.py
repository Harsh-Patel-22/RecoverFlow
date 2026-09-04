from datetime import datetime, timezone

def compute_entitlement_status(failure_timestamp: datetime):
    """
    Computes 3-tier entitlement status based on days elapsed since payment failure:
    - Days 1-3: GRACE_PERIOD (Full app access + subtle notice)
    - Days 4-7: RESTRICTED_READ_ONLY (Data export / team invites disabled)
    - Day 8+: HARD_LOCKED (Account access blocked; forces payment checkout)
    """
    if not failure_timestamp:
        return {
            "tier": "GRACE_PERIOD",
            "days_elapsed": 0,
            "can_access_app": True,
            "restricted_features": [],
            "banner_text": "Payment pending — renewing automatically."
        }

    now = datetime.now(timezone.utc)
    if failure_timestamp.tzinfo is None:
        failure_timestamp = failure_timestamp.replace(tzinfo=timezone.utc)
        
    days_elapsed = max(0, (now - failure_timestamp).days)

    if days_elapsed <= 3:
        return {
            "tier": "GRACE_PERIOD",
            "days_elapsed": days_elapsed,
            "can_access_app": True,
            "restricted_features": [],
            "banner_text": f"Payment pending (Day {days_elapsed+1}/3) — your subscription is in Grace Period."
        }
    elif days_elapsed <= 7:
        return {
            "tier": "RESTRICTED_READ_ONLY",
            "days_elapsed": days_elapsed,
            "can_access_app": True,
            "restricted_features": ["data_export", "ai_queries", "team_invites"],
            "banner_text": "⚠️ Subscription Overdue (Day 4+) — Advanced features are restricted. Complete payment to restore full access."
        }
    else:
        return {
            "tier": "HARD_LOCKED",
            "days_elapsed": days_elapsed,
            "can_access_app": False,
            "restricted_features": ["all"],
            "banner_text": "🔒 Account Suspended — Complete your Razorpay renewal to unlock your account."
        }
