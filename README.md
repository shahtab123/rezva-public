# Rezva

**Pay people the way you already know them — phone, email, QR, or a name — and let wallets turn that into a crypto payment.**

Rezva is a resolution layer. It does **not** hold funds or send transactions. A wallet asks Rezva “who is this identifier?” and gets back a verified destination (network, asset, address). The wallet then pays on-chain as usual.

## What it does

1. Someone shares a familiar identifier (phone, email, payment QR, shop name, ENS, and more).
2. A compatible wallet calls Rezva `POST /v1/resolve`.
3. Rezva returns status + payment options the wallet can show before signing.

### Identifiers Rezva can resolve

| Kind | Examples |
|---|---|
| Registry identifiers | Phone, email, national QR strings, merchant IDs, custom values |
| Provider namespaces | Names like `coffee.rabby` owned by a wallet provider |
| Universal Name Resolution | ENS (`.eth`), Base Names (`.base`), SNS (`.sol`), Unstoppable Domains |

### Who uses it

- **Businesses & users** — apply in the dashboard, claim a name, register identifiers and payment destinations.
- **Wallet providers** — integrate resolve (Free API for prototypes, approved provider key for production).
- **Operators** — review applications and enforce protocol rules in admin.

## Demo

| | |
|---|---|
| Production API | https://universal-payment-api.sabrishahtab.workers.dev |
| Free API + Test Merchant | Dashboard → Free API (shared Base Sepolia USDC demo) |

## Run locally

**Requirements:** Node.js 20+, npm, a Neon Postgres database, and a Privy app for dashboard login.

```bash
npm install
copy .env.example .env.local
# Fill DATABASE_URL, NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET (see .env.example)
npm run build
npm run db:migrate:neon
npm run dev
```

When both services are up you should see `✓ API ready` and `✓ Website ready`.

| URL | What you’ll see |
|---|---|
| http://127.0.0.1:8787 | Protocol API (registry + resolve) |
| http://localhost:3000 | Marketing site + product docs |
| http://localhost:3000/dashboard | Business / Users and Wallet Provider console |
| http://localhost:3000/admin | Operator console (default local login: `admin` / `admin`) |

`npm run dev` copies root `.env.local` into `registry/.dev.vars` for the Worker.

## Project layout

```text
website/            Next.js — marketing, docs, dashboard, admin
registry/           Cloudflare Worker — resolve + registry API
resolver/           Resolve package (same API surface)
protocol/           Shared types and contracts
identifier-types/   Normalize / validate identifier values
external-naming/    ENS, Base Names, SNS, Unstoppable Domains
sdk/                TypeScript client for wallets
scripts/            Local dev and migrate helpers
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API + website |
| `npm run build` | Build shared packages |
| `npm run typecheck` | Typecheck packages |
| `npm run db:migrate:neon` | Apply Postgres schema (once per database) |
| `npm run deploy:api` | Deploy the API Worker to Cloudflare |

## Resolve in one call

```bash
curl -X POST https://universal-payment-api.sabrishahtab.workers.dev/v1/resolve \
  -H "Authorization: Bearer <free-or-provider-api-key>" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"custom\",\"value\":\"rezva-test-merchant\"}"
```

Or with the SDK:

```ts
import { ResolverClient } from "@universal-payment/sdk";

const resolver = new ResolverClient({
  baseUrl: "https://universal-payment-api.sabrishahtab.workers.dev",
  apiKey: process.env.REZVA_API_KEY!,
});

const result = await resolver.resolve({
  type: "custom",
  value: "rezva-test-merchant",
});
```

Only pay when `status === "active"` and a payment option has `payment_ready: true`.

## Environment

All local config lives in **one file**: copy `.env.example` → `.env.local`.

Minimum to run the dashboard + API:

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | Neon Postgres (required) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Dashboard sign-in |
| `PRIVY_APP_SECRET` | Server-side session verification |
| `NEXT_PUBLIC_API_URL` | Website → API base URL (local default is fine) |

Local `dev-*` keys in `.env.example` are enough for demos. For production Workers, use strong secrets and set `ENVIRONMENT=production` — details are commented in `.env.example`.

## License

Hackathon / public submission. Contact the repository owner for terms.
