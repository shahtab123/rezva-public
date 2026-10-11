# Rezva

Wallet-agnostic payment-identifier resolution into crypto payment destinations.

Resolve emails, phones, QR values, custom identifiers, ENS, Base Names, SNS (`.sol`), and Unstoppable Domains into verified payment options for compatible wallets.

## Quick start

```bash
npm install
copy .env.example .env.local
npm run build
npm run dev
```

| URL | Service |
|---|---|
| http://127.0.0.1:8787 | API (registry + resolve) |
| http://localhost:3000 | Website (marketing, docs, dashboard) |
| http://localhost:3000/dashboard | Business / Users + Wallet Provider console |
| http://localhost:3000/admin | Admin console |

`npm run dev` syncs `.env.local` into `registry/.dev.vars` and starts the API + website.

## Packages

```text
protocol/           Shared types / contracts
identifier-types/   Normalization & validation
external-naming/    ENS / SNS / Base Names / Unstoppable Domains
sdk/                Client library for wallets
registry/           Cloudflare Worker API
resolver/           Resolve surface (same worker in dev)
website/            Next.js marketing, docs, dashboard, admin
```

## Environment

Copy `.env.example` → `.env.local` and fill in:

- `DATABASE_URL` — Neon PostgreSQL
- `NEXT_PUBLIC_PRIVY_APP_ID` / `PRIVY_APP_SECRET` — dashboard auth
- `DEV_PROVIDER_KEY` / `DASHBOARD_SERVICE_KEY` / `OPERATOR_API_KEY` — local defaults work for demos
- Optional: Ethereum / Base / Polygon / Solana RPC URLs for Universal Name Resolution

See comments in `.env.example` for production Worker settings.

## Useful commands

| Command | Description |
|---|---|
| `npm run dev` | Start API + website |
| `npm run build` | Build shared packages |
| `npm run typecheck` | Typecheck packages |
| `npm run db:migrate:neon` | Apply Postgres schema |
| `npm run deploy:api` | Deploy Cloudflare Worker |

## API overview

| Endpoint | Purpose |
|---|---|
| `POST /v1/resolve` | Resolve identifier → payment options |
| `GET /v1/identifier-types` | Discover supported types |
| `POST /v1/identifiers` | Register identifier |
| `POST /v1/names` | Register native name |
| `GET /health` | Health check |

## License

Private / hackathon submission. See repository owner for terms.
