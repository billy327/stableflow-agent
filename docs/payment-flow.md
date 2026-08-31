# Payment Flow

StableFlow Agent models a simple stablecoin payment operations flow.

## 1. Merchant creates invoice

Merchant enters:

- Customer name
- Amount in USDC
- Memo / service description
- Optional treasury split rules

The system creates an invoice ID and payment URL.

## 2. Customer pays

Customer opens the payment link and sends USDC to the merchant settlement address.

In this MVP, the payment button only changes local UI state. In production, payment status should be detected from wallet activity, provider webhooks, or indexer events.

## 3. StableFlow tracks status

Invoice status moves from `unpaid` to `paid` after settlement is detected.

Useful production metadata:

- Transaction hash
- Chain
- Token contract
- Payer wallet
- Settlement wallet
- Confirmation count
- Timestamp

## 4. Treasury split preview

The MVP shows a split preview:

- Merchant wallet: 70%
- Savings vault: 20%
- Ops wallet: 10%

Production can execute this using a smart account, batch transfer, or scheduled treasury operation.

## 5. Cashflow summary

StableFlow can summarize invoice activity for operators:

- Paid vs unpaid invoices
- Expected monthly inflow
- Savings allocation
- Ops runway
- Unusual changes

## Safety note

Never move real funds in mock mode. Production settlement needs clear signing, simulation, limits, and recovery controls.
