# @universal-payment/external-naming

Universal Name Resolution layer for Rezva-compatible wallets.

Resolves external blockchain names (ENS, SNS, Base Names, Unstoppable Domains)
**without** storing ownership in Rezva. Routing is by namespace/TLD rules, not
individual names.

## Providers

| Provider | Namespaces |
|---|---|
| `ens` | `.eth` |
| `sns` | `.sol` |
| `basenames` | `.base` |
| `unstoppable` | `.crypto`, `.wallet`, `.nft`, `.x`, … (UNS TLD list) |

## Local test

```bash
npm run build -w @universal-payment/external-naming
node --test tests/external-naming.test.mjs
```

Optional env (see root `.env.example`):

- `ETHEREUM_RPC_URL` — ENS + Base Names (CCIP)
- `SOLANA_RPC_URL` / `SNS_RESOLVE_URL` — `.sol`
- `UNSTOPPABLE_API_KEY` — Unstoppable Resolution API

## Extending

Register another `NameResolver` on `NameResolverRegistry` and add a rule to
`EXTERNAL_NAMESPACE_RULES`. Core resolve flow stays unchanged.
