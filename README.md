# RecoverFlow — AI Subscription Rescue Agent

> Submission for **Razorpay AI Buildathon 2026**  
> **Track 03:** AI Revenue Recovery Agent

---

## Problem

Indian B2B and consumer SaaS companies operating on Razorpay face alarming subscription failure rates between **8% and 15%** on recurring debits—nearly triple the 3%–6% global baseline seen on Stripe. This high friction drains SaaS monthly recurring revenue (MRR) and creates unnecessary churn for otherwise healthy customer accounts.

The root causes stem from India's unique financial ecosystem regulations: RBI e-mandate AFA (Additional Factor of Authentication) requirements, bank-side risk throttling, and the strict **₹15,000 debit cap on UPI AutoPay**. When recurring debits fail, traditional dunning systems treat all failures identically—sending generic email reminders that are ignored or blindly retrying payments at random intervals.

Existing global dunning platforms (Chargebee, Baremetrics) are architected for Western credit card infrastructure and completely lack modeling for Indian payment rails, salary credit cycles, and RBI cap overflows. Over **₹7.34 lakh crore** remains locked in delayed Indian B2B receivables. RecoverFlow bridges this critical gap with an intelligent, India-first revenue recovery agent.

---

## Solution

RecoverFlow is an autonomous AI agent that ingests real-time Razorpay subscription failure webhooks, classifies each event into one of **8 India-specific failure classes**, and executes tailored recovery strategies.

By pairing deterministic business rules for clear error codes with **Claude `claude-sonnet-4-6`** for ambiguous failures, RecoverFlow computes optimal retry timings (aligned with Indian salary credit dates on the 28th/1st), dispatches localized Hinglish WhatsApp deep links, excludes UPI for debits above ₹15,000, and records a complete, audit-logged decision trail.

---

## Ecosystem Placement & Architecture

RecoverFlow is positioned as **Razorpay Smart Recovery Suite**—a native, turn-key AI recovery plugin for the Razorpay Subscriptions ecosystem.

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                            RAZORPAY ECOSYSTEM                             │
 ├───────────────────────────────────────┬───────────────────────────────────┤
 │        RAZORPAY CORE ENGINE           │      RECOVERFLOW AI SUITE         │
 │                                       │                                   │
 │  • Subscriptions & Mandates Engine    │  • Classifier Engine (Hybrid AI)  │
 │  • Razorpay Webhooks Service ─────────┼──► Ingestion Pipeline (Webhook)   │
 │  • Merchant Dashboard (RazorpayX)     │  • Smart Retry Scheduler          │
 │  • Customer Database (Vault & CRM)    │  • RecoverFlow DB (State Machine) │
 └───────────────────────────────────────┴───────────────────────────────────┘
```

### How RecoverFlow Integrates into Razorpay:
* **Zero Database Migration for Merchants**: Merchants do not manage external DBs. RecoverFlow sits inside the merchant's RazorpayX dashboard as a 1-click extension.
* **Operational State Machine DB**: The RecoverFlow DB tracks recovery campaign states, grace-period entitlement tiers, and compliance audit logs without replacing Razorpay's core ledger.
* **Native Contact Ingestion**: Customer email, phone number (`+91`), and subscription details are automatically extracted from Razorpay `subscription.halted` webhook payloads — requiring zero manual customer data imports.

---

## AI vs. Rule Engine Justification

RecoverFlow utilizes a **Hybrid Dual-Engine Architecture** to achieve high performance, cost efficiency, and maximum recovery throughput.

1. **Deterministic Rule Engine (High Velocity / 95%+ of Failures)**:
   - Evaluates standard bank failure codes (`HARD_EXPIRED_CARD`, `HARD_MANDATE_CANCELLED`, `HARD_UPI_CAP_EXCEEDED`) in `< 1ms` at ₹0 cost with 100% auditable predictability.
2. **AI Classifier Engine (Claude `claude-sonnet-4-6` for Ambiguity & Personalization)**:
   - **Error Disambiguation**: Ingests raw, unstructured bank decline strings (`transaction_decline_99`, `do_not_honor`) from 100+ Indian issuing banks to infer the true failure root cause.
   - **Dynamic Messaging & Tone**: Formulates tailored Hinglish/English recovery notices, adjusts discount incentives (0%–15%), and handles VIP contract escalations (> ₹20k).
   - **Smart Retry Timing**: Calculates salary-cycle retry windows (28th / 1st) and excludes incompatible payment methods (e.g. stripping UPI for debits > ₹15,000).

---

## Data Flow & Notification Delivery

```
[Customer Subscription Failure]
             │
             ▼
[Razorpay Webhook Event: subscription.halted] ──► (Contains customer name, email, phone & sub_id)
             │
             ▼
[RecoverFlow AI Engine] ──► (Classifies failure, calculates salary timing & dynamic discount)
             │
             ▼
[Omnichannel Recovery Notice] ──► WhatsApp Deep Link (wa.me) & Email
             │
             ▼
[Customer Billing Portal / Razorpay Checkout] ──► Self-serve e-mandate re-authorization & GST invoice
```

---

## Key Enterprise Features (v2.0 & v3.0 Merchant Suite)

- **⚡ Webhook Sandbox Drawer ("Simulate 1 Event")**: Test isolated real-time failure scenarios (`HARD_EXPIRED_CARD`, `HARD_UPI_CAP_EXCEEDED`, etc.) in 1 click and observe real-time intake in < 200ms.
- **⚙️ Campaign & Dunning Settings**: Customize recovery messaging tone (*Hinglish Conversational* vs *Formal English B2B*) and toggle 1-click dynamic **Discount Incentives** (*0%, 5%, 10%, 15% OFF*) automatically appended to checkout links.
- **⭐️ VIP Account Routing & CSM Escalation**: High-value contracts ($\ge$ ₹20,000) or ambiguous declines are flagged with a **`★ VIP`** badge and an interactive **"Assign to CSM"** button for direct manual outreach.
- **🌊 Omnichannel Escalation Waterfall**: Visual step-by-step timeline visualizer showing the exact escalation schedule (*T+0h WhatsApp → T+24h Email → Salary Day Auto-Debit Retry*).
- **🔒 Smart Grace Period & Entitlement Throttling (`/entitlements/[id]`)**: 3-Tier access lifecycle (Days 1–3 `GRACE_PERIOD`, Days 4–7 `RESTRICTED_READ_ONLY`, Day 8+ `HARD_LOCKED`) with live SaaS app in-app warning banners.
- **📄 Customer Self-Serve Mandate Portal (`/portal/[id]`)**: White-labeled customer portal for subscribers to view decline explanations, 1-click re-authorize Razorpay e-mandates, update cards, and download GST tax invoices.
- **💬 Real-Time Slack Revenue Alerts**: Webhook alerts (`🟢 [RECOVERED]` and `🔴 [VIP DECLINE]`) dispatched directly into `#finance-alerts` Slack channels.
- **💳 Adaptive Down-sell Recovery**: High-ticket annual plans ($\ge$ ₹15,000) automatically present a 1-tap down-sell fallback (*"Switch to Monthly billing at ₹2,499/mo"*).
- **📑 Indian B2B GSTIN & Tax Invoice Generator**: Generates 100% GST-compliant B2B invoices (SAC Code `998313`, 18% CGST/SGST/IGST breakdown, 15-digit GSTIN ITC claim compliance).

---

## Failure Classification

| Failure Class | Trigger Conditions | Retry Eligible? | Action Required | Recovery Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **`SOFT_INSUFFICIENT_FUNDS`** | `error_reason` in `insufficient_funds`, `low_balance`, `account_debit_failure` | **YES** | No | Schedule retry on salary day (28th or 1st) + Hinglish WhatsApp link |
| **`SOFT_BANK_BLOCKED`** | `error_reason` in `bank_blocked`, `do_not_honor` + Bank Auth step | **YES** | Optional | Schedule 24h retry + WhatsApp payment link |
| **`SOFT_NETWORK`** | `error_code` = `GATEWAY_ERROR` / `SERVER_ERROR` or source = `network` | **YES** | No | Silent retry in 4 hours (No customer notification) |
| **`HARD_EXPIRED_CARD`** | `error_reason` in `expired_card`, `card_expired` | **NO** | Update Card | Immediate WhatsApp + Email alert with payment & card update link |
| **`HARD_MANDATE_CANCELLED`**| `error_reason` in `mandate_cancelled`, `nach_cancelled` | **NO** | Re-Auth Mandate | WhatsApp + Email alert to re-authorize mandate or pay manually |
| **`HARD_UPI_CAP_EXCEEDED`** | Method = `upi_autopay` AND Amount > ₹15,000 + limit error | **NO** | Switch Method | WhatsApp alert + Razorpay Payment Link excluding UPI (Cards/NetBanking only) |
| **`HARD_FRAUD_FLAGGED`** | `error_reason` in `fraud_suspected`, `risk_threshold_exceeded` | **NO** | Merchant Review | Immediate halt; alert merchant via email for manual review |
| **`AMBIGUOUS`** | Sparse or non-deterministic error details (`payment_failed`) | **LLM Decides** | LLM Decides | Evaluated via Claude `claude-sonnet-4-6` with full payload context |

---

## Recovery Logic Matrix

| Failure Class | Action Type | Channel | Timing / Schedule | Stopping Rules |
| :--- | :--- | :--- | :--- | :--- |
| **`SOFT_INSUFFICIENT_FUNDS`** | `SCHEDULE_RETRY` | `WHATSAPP` | Next occurrence of 28th (if ≤ 25th) or 1st of next month | Max 3 attempts, 7-day deadline |
| **`SOFT_BANK_BLOCKED`** | `SCHEDULE_RETRY` | `WHATSAPP` | `failure_timestamp + 24 hours` | Max 2 attempts, 3-day deadline |
| **`SOFT_NETWORK`** | `SCHEDULE_RETRY` | `NONE` | `failure_timestamp + 4 hours` | Max 1 attempt, 8-hour deadline |
| **`HARD_EXPIRED_CARD`** | `SEND_WHATSAPP` | `BOTH` | Immediate (No automated retry) | Max 0 attempts, 5-day deadline |
| **`HARD_MANDATE_CANCELLED`**| `SEND_WHATSAPP` | `BOTH` | Immediate (No automated retry) | Max 0 attempts, 3-day deadline |
| **`HARD_UPI_CAP_EXCEEDED`** | `SEND_WHATSAPP` | `WHATSAPP` | Immediate (No automated retry) | Max 0 attempts, 2-day deadline |
| **`HARD_FRAUD_FLAGGED`** | `HALT_AND_NOTIFY` | `EMAIL` | Immediate (No automated retry) | Max 0 attempts, immediate merchant flag |
| **`AMBIGUOUS`** | Dynamic / `HALT_AND_NOTIFY` | `EMAIL` | Dynamic based on LLM confidence | Merchant escalation if confidence < 0.5 |

---

## AI Judgment Architecture

RecoverFlow intentionally uses **Claude `claude-sonnet-4-6`** *only* when deterministic classification returns `AMBIGUOUS`.

1. **Why not use LLMs for all failures?**  
   Deterministic rules for known error codes (like `expired_card` or `insufficient_funds`) run in under 1ms, cost ₹0.00, and produce 100% predictable, auditable actions.
2. **Where LLM excels:**  
   When Indian banks return generic decline codes (`payment_failed` with no sub-code), Claude analyzes contextual signals (billing cycle, attempt number, transaction amount vs RBI caps, step in payment flow) to infer the true failure cause.

---

## What Broke & How We Got Out

- **Razorpay Sandbox Limitation**: Razorpay's test-mode subscription failure webhooks return binary success/failure flags rather than full production error codes (e.g. `upi_limit_exceeded` or `mandate_cancelled`).
  - *Solution*: Developed a synthetic batch generator mirroring real production Razorpay JSON payloads across all 8 failure classes while executing actual test-mode payment link generation via the Razorpay SDK.
- **Razorpay Test Mode Payment Link API Cap (30 Links Limit)**:
  - *Challenge*: During high-throughput batch testing (100 synthetic failures), Razorpay's Test Mode API enforced a strict sandbox quota limit (`BAD_REQUEST_ERROR: test mode limit of 30 reached for payment_link`), which initially caused API rate-limit errors and static link fallbacks.
  - *Engineering Growth & Solution*: Rather than compromising the live demo experience, we implemented a zero-quota, dynamic hosted checkout handler (`GET /checkout`) powered by official Razorpay Checkout JS (`checkout.js`). This handler dynamically encodes the customer's name, plan description, and exact plan amount (from ₹199 to ₹25,000) down to the rupee. Additionally, we introduced `asyncio.Semaphore(2)` concurrency throttling in the batch orchestrator to respect API quotas while maintaining 100% checkout availability across Sandbox and Production modes.
- **LLM Concurrency & Rate Limit Management**: Executing 100 parallel LLM calls during batch simulations risks API rate limits.
  - *Solution*: Implemented an `asyncio.Semaphore(2)` lock inside the batch runner to bound concurrent LLM calls while keeping throughput high.
- **UPI AutoPay ₹15,000 RBI Cap Handling**: High-value subscription plans (> ₹15,000) failed repeatedly if customers attempted payment via UPI deep links.
  - *Solution*: Built dynamic method filtering in `razorpay_client.py` to strip UPI from generated Razorpay payment link options for high-ticket plans, directing customers to Card or NetBanking.

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional, for containerized run)

### Step-by-Step

1. **Clone the Repository & Environment Configuration:**
   ```bash
   git clone <repo-url>
   cd RecoverFlow
   cp .env.example .env
   ```

2. **Fill Credentials in `.env`:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
   DATABASE_URL=sqlite+aiosqlite:///./recoverflow.db
   BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access Dashboard:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Click **"Run Batch (100)"** to simulate 100 subscription failures and view real-time recovery metrics.

---

## Metrics (Demo Run)

Below are representative metrics from a benchmark 100-failure synthetic batch run:

- **Total Subscriptions Processed:** `100`
- **Total MRR at Risk:** `₹2,84,500`
- **Total MRR Recovered:** `₹1,56,800`
- **Overall Recovery Rate:** `55.1%`
- **Rule-Based Classifications:** `98`
- **LLM Classifications:** `2`
- **Audit Entries Created:** `500`
- **Batch Processing Duration:** `~3.2 seconds`
