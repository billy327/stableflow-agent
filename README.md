# StableFlow Agent

StableFlow Agent is a stablecoin-native payment-link and treasury assistant for creators and small businesses.

The MVP demonstrates a clean payment operations flow:

- Create a USDC invoice
- Generate a shareable payment link
- Track paid / unpaid state
- Preview treasury auto-splits
- Summarize basic cashflow status

This repository is intentionally positioned around useful stablecoin payment operations, not speculation or farming.

## MVP routes

The current static MVP renders these product surfaces in one React app:

- `/` — product landing / overview
- `#new` — invoice creator
- `#pay` — mock payment page
- `#dashboard` — operator dashboard and split preview

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is generated in `dist/`.

## Roadmap

- Wallet connection and merchant auth
- Persistent invoice storage
- USDC payment detection
- Webhook notifications
- Treasury split execution
- CSV/accounting export
- AI cashflow summary from real transactions

## Status

MVP prototype. Payment state is simulated and no real funds move in this version.
