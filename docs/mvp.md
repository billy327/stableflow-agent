# StableFlow Agent MVP

## Goal

Ship a simple public prototype that explains the product and demonstrates the core operator workflow.

## Included

- Landing section
- Invoice creator
- Mock payment page
- Paid / unpaid state toggle
- Treasury split preview
- Operator dashboard
- README and payment-flow docs

## Not included yet

- Real wallet connection
- Real USDC settlement
- Backend database
- Webhooks
- Smart contract execution
- Custody or key management

## Recommended next build step

Add persistence:

- `invoices.json` or SQLite for local prototype
- Create invoice endpoint
- Payment status endpoint
- Simple webhook endpoint for future payment provider integration

## Public positioning

StableFlow Agent helps creators and small businesses receive stablecoin payments and understand cashflow.

Avoid positioning around airdrops, farming, or speculative incentives.
