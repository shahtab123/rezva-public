# Rezva

# Running locally is optional

### Rezva is already live. Prefer the website to test. It saves time and setup hassle.

| Start here | URL |
|---|---|
| **Website** | [https://www.rezva.xyz](https://www.rezva.xyz) |
| **Docs overview** | [https://www.rezva.xyz/docs/introduction/overview](https://www.rezva.xyz/docs/introduction/overview) |
| **Dashboard (Free API + Test Merchant)** | [https://www.rezva.xyz/dashboard/free-api](https://www.rezva.xyz/dashboard/free-api) |
| **Test wallet: Mobile (Expo / Android)** | [https://github.com/shahtab123/mobilewallet_rezva](https://github.com/shahtab123/mobilewallet_rezva) |
| **Test wallet: Rabby (Chrome)** | [https://github.com/shahtab123/rabby_chrome_rezva](https://github.com/shahtab123/rabby_chrome_rezva) |
| **Production API** | [https://universal-payment-api.sabrishahtab.workers.dev](https://universal-payment-api.sabrishahtab.workers.dev) |

You do **not** need Node, Neon, Privy, or a local Worker to evaluate the product. Use the live site, docs, Free API key, and shared Test Merchant first. Clone and run locally only if you want to inspect or modify the source.

### Product demo

[![Watch the Rezva product demo on YouTube](https://img.youtube.com/vi/zhbiL9q0wGo/maxresdefault.jpg)](https://youtu.be/zhbiL9q0wGo)

[Watch on YouTube](https://youtu.be/zhbiL9q0wGo)

---

**Pay people the way you already know them: phone, email, QR, a shop name, ENS, Base Names, SNS (`.sol`), or Unstoppable Domains. Compatible wallets turn that into a crypto payment.**

Rezva is a resolution layer. It does **not** hold funds or send transactions. A wallet asks Rezva who an identifier is (registry ID, provider namespace, or Universal Name Resolution), gets back a verified destination (network, asset, address), then pays on-chain as usual.

More detail: [Product overview](https://www.rezva.xyz/docs/introduction/overview) · [How it works](https://www.rezva.xyz/docs/introduction/how-it-works) · [Wallet quickstart](https://www.rezva.xyz/docs/for-wallets/quickstart)

## What it does

1. Someone shares a familiar identifier (phone, email, payment QR, shop name, ENS, and more).
2. A compatible wallet calls Rezva `POST /v1/resolve`.
3. Rezva returns status and payment options the wallet can show before signing.

### Identifiers Rezva can resolve

| Kind | Examples |
|---|---|
| Registry identifiers | Phone, email, national QR strings, merchant IDs, custom values |
| Provider namespaces | Names like `coffee.rabby` owned by a wallet provider |
| Universal Name Resolution | ENS (`.eth`), Base Names (`.base`), SNS (`.sol`), Unstoppable Domains |

### Who uses it

- **Businesses and users**: apply in the dashboard, claim a name, register identifiers and payment destinations.
- **Wallet providers**: integrate resolve (Free API for prototypes, approved provider key for production).
- **Operators**: review applications and enforce protocol rules in admin.

## Try it on the live site (recommended)

1. Open [docs overview](https://www.rezva.xyz/docs/introduction/overview).
2. Sign in at [dashboard Free API](https://www.rezva.xyz/dashboard/free-api), generate a key, and use the shared Test Merchant QR.
3. Test with a reference wallet (Send + QR resolve against the Free API / Test Merchant):
   - **Mobile wallet:** [github.com/shahtab123/mobilewallet_rezva](https://github.com/shahtab123/mobilewallet_rezva)
   - **Rabby (Chrome):** [github.com/shahtab123/rabby_chrome_rezva](https://github.com/shahtab123/rabby_chrome_rezva)
   - Docs list: [Test wallets](https://www.rezva.xyz/docs/reference/compatible-wallets)

## Resolve against production

```bash
curl -X POST https://universal-payment-api.sabrishahtab.workers.dev/v1/resolve \
  -H "Authorization: Bearer <free-or-provider-api-key>" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"custom\",\"value\":\"rezva-test-merchant\"}"
```

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

## Run locally (optional)

Only needed if you want a full local stack. Most reviewers can skip this section.

**Requirements:** Node.js 20+, npm, Neon Postgres, Privy app.

```bash
npm install
copy .env.example .env.local
# Fill DATABASE_URL, NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET (see .env.example)
npm run build
npm run db:migrate:neon
npm run dev
```

When both services are up you should see `✓ API ready` and `✓ Website ready`.

| URL | What you will see |
|---|---|
| http://127.0.0.1:8787 | Protocol API (registry + resolve) |
| http://localhost:3000 | Marketing site + product docs |
| http://localhost:3000/dashboard | Business / Users and Wallet Provider console |
| http://localhost:3000/admin | Operator console (default local login: `admin` / `admin`) |

`npm run dev` copies root `.env.local` into `registry/.dev.vars` for the Worker.

### Local commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API + website |
| `npm run build` | Build shared packages |
| `npm run typecheck` | Typecheck packages |
| `npm run db:migrate:neon` | Apply Postgres schema (once per database) |
| `npm run deploy:api` | Deploy the API Worker to Cloudflare |

### Environment (local only)

All local config lives in **one file**: copy `.env.example` → `.env.local`.

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | Neon Postgres (required) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Dashboard sign-in |
| `PRIVY_APP_SECRET` | Server-side session verification |
| `NEXT_PUBLIC_API_URL` | Website → API base URL (local default is fine) |

Local `dev-*` keys in `.env.example` are enough for demos. Production Workers need strong secrets and `ENVIRONMENT=production` (see comments in `.env.example`).

## Project layout

```text
website/            Next.js: marketing, docs, dashboard, admin
registry/           Cloudflare Worker: resolve + registry API
resolver/           Resolve package (same API surface)
protocol/           Shared types and contracts
identifier-types/   Normalize / validate identifier values
external-naming/    ENS, Base Names, SNS, Unstoppable Domains
sdk/                TypeScript client for wallets
scripts/            Local dev and migrate helpers
```

## License

Hackathon / public submission. Contact the repository owner for terms.
