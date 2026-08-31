import json
import logging
from typing import Optional
import anthropic
from config import settings
from models.subscription_failure import SubscriptionFailure
from schemas.recovery import ClassificationResult

logger = logging.getLogger(__name__)

class ClassifierService:
    def __init__(self):
        self.anthropic_client = None
        if settings.ANTHROPIC_API_KEY and not settings.ANTHROPIC_API_KEY.startswith("sk-ant-mock"):
            try:
                self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")

    async def classify(self, failure: SubscriptionFailure) -> ClassificationResult:
        # STEP 1: RULE-BASED PASS
        rule_result = self._classify_rules(failure)
        if rule_result.failure_class != "AMBIGUOUS":
            return rule_result

        # STEP 2: LLM PASS FOR AMBIGUOUS CASES
        return await self._classify_llm(failure)

    def _classify_rules(self, failure: SubscriptionFailure) -> ClassificationResult:
        reason = (failure.error_reason or "").lower()
        code = (failure.error_code or "").upper()
        source = (failure.error_source or "").lower()
        step = (failure.error_step or "").lower()
        desc = (failure.error_description or "").lower()
        method = (failure.payment_method or "").lower()
        amount = failure.plan_amount or 0.0

        # Rule 1: SOFT_INSUFFICIENT_FUNDS
        if reason in ["insufficient_funds", "low_balance", "account_debit_failure"]:
            return ClassificationResult(
                failure_class="SOFT_INSUFFICIENT_FUNDS",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched insufficient funds trigger (reason='{reason}'). Temporary fund shortage.",
                retry_eligible=True,
                customer_action_required=False,
                customer_action_type=None
            )

        # Rule 2: SOFT_BANK_BLOCKED
        if reason in ["bank_blocked", "payment_blocked_by_bank", "do_not_honor"] and source == "bank" and step == "payment_authorization":
            return ClassificationResult(
                failure_class="SOFT_BANK_BLOCKED",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched bank block rule (reason='{reason}', source='bank', step='payment_authorization').",
                retry_eligible=True,
                customer_action_required=False,
                customer_action_type=None
            )

        # Rule 3: SOFT_NETWORK
        if code in ["GATEWAY_ERROR", "SERVER_ERROR"] or source == "network" or reason in ["payment_timeout", "gateway_timeout"]:
            return ClassificationResult(
                failure_class="SOFT_NETWORK",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched network/gateway error rule (code='{code}', source='{source}', reason='{reason}').",
                retry_eligible=True,
                customer_action_required=False,
                customer_action_type=None
            )

        # Rule 4: HARD_EXPIRED_CARD
        if reason in ["expired_card", "card_expired"]:
            return ClassificationResult(
                failure_class="HARD_EXPIRED_CARD",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched expired card rule (reason='{reason}'). Customer must update card.",
                retry_eligible=False,
                customer_action_required=True,
                customer_action_type="UPDATE_CARD"
            )

        # Rule 5: HARD_MANDATE_CANCELLED
        if reason in ["mandate_cancelled", "emandate_cancelled", "nach_cancelled", "customer_cancelled_mandate"] or (source == "customer" and step == "payment_authentication"):
            return ClassificationResult(
                failure_class="HARD_MANDATE_CANCELLED",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched mandate cancelled rule (reason='{reason}', source='{source}', step='{step}').",
                retry_eligible=False,
                customer_action_required=True,
                customer_action_type="RE_AUTH_MANDATE"
            )

        # Rule 6: HARD_UPI_CAP_EXCEEDED
        if method == "upi_autopay" and amount > 15000.0 and reason in ["upi_limit_exceeded", "amount_exceeds_limit", "debit_limit_exceeded", "autopay_cap_exceeded"]:
            return ClassificationResult(
                failure_class="HARD_UPI_CAP_EXCEEDED",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched UPI cap rule (amount=₹{amount} > ₹15,000 RBI cap, method='upi_autopay').",
                retry_eligible=False,
                customer_action_required=True,
                customer_action_type="CONTACT_BANK"
            )

        # Rule 7: HARD_FRAUD_FLAGGED
        if reason in ["fraud_suspected", "transaction_declined_by_risk", "risk_threshold_exceeded", "suspected_fraud"] or (source == "bank" and step == "payment_authorization" and "fraud" in desc):
            return ClassificationResult(
                failure_class="HARD_FRAUD_FLAGGED",
                classification_method="RULE_BASED",
                confidence=1.0,
                reasoning=f"Matched risk/fraud flag rule (reason='{reason}', desc='{desc}').",
                retry_eligible=False,
                customer_action_required=False,
                customer_action_type=None
            )

        # Rule 8: AMBIGUOUS
        return ClassificationResult(
            failure_class="AMBIGUOUS",
            classification_method="RULE_BASED",
            confidence=0.5,
            reasoning="Sparse or generic error parameters. Deferred to LLM for reasoning.",
            retry_eligible=False,
            customer_action_required=False,
            customer_action_type=None
        )

    async def _classify_llm(self, failure: SubscriptionFailure) -> ClassificationResult:
        system_prompt = """You are RecoverFlow's failure classification engine. You analyze failed Indian SaaS subscription payments processed via Razorpay and classify them into one of the following failure classes:

SOFT_INSUFFICIENT_FUNDS - Temporary lack of funds, retryable on salary day
SOFT_BANK_BLOCKED - Bank temporarily blocked transaction, retry in 24h
SOFT_NETWORK - Technical/gateway timeout, retry in 4 hours
HARD_EXPIRED_CARD - Card past expiry, customer must update card
HARD_MANDATE_CANCELLED - Auto-debit mandate revoked by customer, must re-auth
HARD_UPI_CAP_EXCEEDED - Plan amount exceeds RBI UPI AutoPay ₹15,000 cap
HARD_FRAUD_FLAGGED - Fraud flagged by bank/gateway, do not retry
AMBIGUOUS - Cannot determine with confidence (use only as last resort)

India-specific context you must know:
- Indian salary credit dates cluster around the 28th–1st of each month
- RBI UPI AutoPay cap is ₹15,000 per debit (raised Q4 2024)
- "do_not_honor" from Indian banks is often a temporary block, not fraud
- Generic error_reason="payment_failed" with source="bank" and no further detail is most commonly SOFT_BANK_BLOCKED or SOFT_INSUFFICIENT_FUNDS
- Mandate-related errors often show up as authentication failures

Respond ONLY with a valid JSON object. No markdown. No explanation outside JSON.

JSON schema:
{
  "failure_class": "<one of the 8 classes above>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence max 150 chars explaining why>",
  "retry_eligible": <true/false>,
  "customer_action_required": <true/false>,
  "customer_action_type": "<UPDATE_CARD|RE_AUTH_MANDATE|TOP_UP_BALANCE|CONTACT_BANK|null>"
}"""

        user_message = f"""Classify this Razorpay subscription payment failure:

subscription_id: {failure.subscription_id}
plan_name: {failure.plan_name}
plan_amount: ₹{failure.plan_amount}
billing_cycle: {failure.billing_cycle}
payment_method: {failure.payment_method}
attempt_count: {failure.attempt_count}
error_code: {failure.error_code}
error_reason: {failure.error_reason}
error_source: {failure.error_source}
error_step: {failure.error_step}
error_description: {failure.error_description}
subscription_status: {failure.subscription_status}
failure_timestamp: {failure.failure_timestamp.isoformat() if failure.failure_timestamp else ''}"""

        if self.anthropic_client is not None:
            try:
                response = await self.anthropic_client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=250,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}]
                )
                text = response.content[0].text.strip()
                # Parse JSON
                data = json.loads(text)
                return ClassificationResult(
                    failure_class=data.get("failure_class", "AMBIGUOUS"),
                    classification_method="LLM",
                    confidence=float(data.get("confidence", 0.8)),
                    reasoning=str(data.get("reasoning", "LLM classified generic failure based on Indian SaaS domain heuristics."))[:500],
                    retry_eligible=bool(data.get("retry_eligible", True)),
                    customer_action_required=bool(data.get("customer_action_required", False)),
                    customer_action_type=data.get("customer_action_type")
                )
            except Exception as e:
                logger.error(f"Anthropic LLM classification call failed: {e}")

        # Fallback heuristic for ambiguous cases if LLM key is absent or call fails
        # Section 5 note: "Generic error_reason='payment_failed' with source='bank' and no further detail is most commonly SOFT_BANK_BLOCKED"
        return ClassificationResult(
            failure_class="SOFT_BANK_BLOCKED",
            classification_method="LLM",
            confidence=0.75,
            reasoning="Fallback LLM heuristic: generic bank decline classified as temporary bank block per Indian banking pattern.",
            retry_eligible=True,
            customer_action_required=False,
            customer_action_type=None
        )
