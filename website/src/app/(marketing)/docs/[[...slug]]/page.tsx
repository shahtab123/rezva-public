import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CompatibleWalletsList } from "@/components/docs/CompatibleWalletsList";
import { HowItWorksPage } from "@/components/docs/HowItWorksPage";
import { docsNav } from "@/components/docs/docs-nav";
import { ProductDemo } from "@/components/ProductDemo";

type DocsPageProps = {
  params: Promise<{ slug?: string[] }>;
};

function getDocMeta(slug: string[] | undefined) {
  if (!slug?.length) {
    return { title: "Docs" };
  }

  const href = `/docs/${slug.join("/")}`;
  for (const section of docsNav) {
    const item = section.items.find((entry) => entry.href === href);
    if (item) {
      return { title: item.title, href };
    }
  }

  return null;
}

function IntroductionOverview() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Rezva overview</h1>
      <p className="docs-page-lede">
        Rezva is a wallet-agnostic payment resolution layer. It lets a wallet
        turn an identifier people already recognize into verified crypto
        payment options without replacing the wallet’s existing payment rails.
      </p>

      <nav className="docs-page-toc" aria-label="On this page">
        <strong>On this page</strong>
        <a href="#demo-video">Product demo</a>
        <a href="#core-idea">Core idea</a>
        <a href="#what-rezva-does">What Rezva does</a>
        <a href="#same-qr">The same QR, another payment rail</a>
        <a href="#responsibilities">Who does what</a>
        <a href="#start-building">Start building</a>
      </nav>

      <section className="docs-page-section" id="demo-video">
        <h2>Product demo</h2>
        <p>
          Watch a short walkthrough of identifier resolve and payment in a
          compatible wallet.{" "}
          <a
            href="https://youtu.be/zhbiL9q0wGo"
            target="_blank"
            rel="noreferrer"
          >
            Open on YouTube
          </a>
          .
        </p>
        <div className="docs-demo-video">
          <ProductDemo />
        </div>
      </section>

      <section className="docs-page-section" id="core-idea">
        <h2>Core idea</h2>
        <p>
          Every request combines an identifier type and value. The resolver
          normalizes that value, finds the authoritative mapping, and returns
          payment destinations that the requesting wallet can use.
        </p>
        <pre>{`Identifier type + value
          ↓
       Resolver
          ↓
Crypto payment options
          ↓
Existing wallet payment flow`}</pre>
        <p>
          Examples include phone numbers, email addresses, existing payment
          QR values, merchant IDs, custom identifiers, and protocol-native
          names.
        </p>
      </section>

      <section className="docs-page-section" id="what-rezva-does">
        <h2>What Rezva does</h2>
        <ul>
          <li>Accepts a typed identifier from QR input or manual entry.</li>
          <li>Applies type-specific normalization and validation.</li>
          <li>Resolves protocol-owned identifiers through the registry.</li>
          <li>Uses Universal Name Resolution for supported external crypto names (same <code>/v1/resolve</code> endpoint; no wallet client update).</li>
          <li>Returns lifecycle status, trust timestamps, and payment options.</li>
        </ul>
      </section>

      <section className="docs-page-section" id="same-qr">
        <h2>The same QR, another payment rail</h2>
        <p>
          A merchant can keep using an existing QR code. A traditional payment
          application interprets it through its own network, while a compatible
          crypto wallet extracts the identifier and asks Rezva for a crypto
          destination.
        </p>
        <pre>{`Existing QR
   ├─ Traditional app → existing payment network
   └─ Crypto wallet   → Rezva → blockchain payment`}</pre>
        <p>
          Rezva does not need the original payment provider to process or
          settle the crypto transaction. The transaction goes directly from
          the user’s wallet to the resolved destination.
        </p>
      </section>

      <section className="docs-page-section" id="responsibilities">
        <h2>Who does what</h2>
        <ul>
          <li><strong>Rezva</strong> resolves identifiers and reports safety state.</li>
          <li><strong>Registry</strong> stores controller-owned mappings and audit events.</li>
          <li><strong>Wallet</strong> displays options, gets user confirmation, and executes payment.</li>
          <li><strong>Controller</strong> authorizes registration and destination changes.</li>
          <li><strong>Provider</strong> integrates the resolver and receives scoped access.</li>
        </ul>
        <p>
          Rezva is not a wallet, payment processor, exchange, blockchain, or
          custody service. It does not initiate, sign, broadcast, or settle
          transactions.
        </p>
      </section>

      <section className="docs-page-section" id="start-building">
        <h2>Start building</h2>
        <ol>
          <li>Read <Link href="/docs/introduction/how-it-works">How It Works</Link> for the complete flow.</li>
          <li>Use the <Link href="/docs/for-wallets/quickstart">wallet quickstart</Link> to add resolver support.</li>
          <li>Use the <Link href="/docs/dashboard/free-api">Free API</Link> and shared Test Merchant for prototypes.</li>
          <li>
            Try a reference wallet:{" "}
            <strong>Mobile wallet</strong>{" "}
            <a
              href="https://github.com/shahtab123/mobilewallet_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/mobilewallet_rezva
            </a>
            {" · "}
            <strong>Rabby (Chrome)</strong>{" "}
            <a
              href="https://github.com/shahtab123/rabby_chrome_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/rabby_chrome_rezva
            </a>
            .
          </li>
          <li>Apply as a provider before sending production resolver traffic.</li>
        </ol>
        <p>
          The <a href="/openapi.json">OpenAPI specification</a> and{" "}
          <a href="/llms-full.txt">full LLM reference</a> provide machine-readable
          request details and copy-paste integration guidance.
        </p>
      </section>

      <div className="docs-page-note">
        <p>
          Production resolver access is permissioned and rate-limited. A Free
          API key is for prototypes and resolver testing only; it cannot mutate
          registry state.
        </p>
      </div>
    </div>
  );
}

function UserExperienceDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>User experience</h1>
      <p className="docs-page-lede">
        The user should be able to scan or enter an identifier, review a safe
        destination, and pay in the wallet they already use.
      </p>

      <h2>Recommended payment flow</h2>
      <ol>
        <li>Scan a QR code or enter an identifier.</li>
        <li>Resolve the typed value through the wallet’s configured resolver.</li>
        <li>Display the profile, identifier, status, and payment options.</li>
        <li>Warn when the mapping is pending, recently changed, or unavailable.</li>
        <li>Let the user select an option and confirm the transaction.</li>
        <li>Build, sign, broadcast, and show the wallet’s transaction result.</li>
      </ol>

      <h2>Confirmation screen</h2>
      <pre>{`Pay 10.00 USDC
Network: Base mainnet
Recipient: 0x…
Token contract: 0x…

[Cancel] [Confirm payment]`}</pre>
      <p>
        Populate the confirmation screen from the selected resolver option, not
        from user-provided or cached address data. If the option has amount
        limits, a fixed amount, memo, reference, or expiration, enforce and
        display those constraints.
      </p>

      <h2>Safety presentation</h2>
      <ul>
        <li>Require both <code>status</code> and <code>payment_ready</code>.</li>
        <li>Show chain, asset, token contract, and destination before confirmation.</li>
        <li>Do not present suspended, removed, or pending mappings as payable.</li>
        <li>Keep the resolver’s trust timestamps visible in detail views.</li>
      </ul>
    </div>
  );
}

function WalletIntegrationDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Wallet integration</h1>
      <p className="docs-page-lede">
        Add Rezva as a resolver step beside the wallet’s existing QR scanner,
        transaction builder, signer, and confirmation screen.
      </p>

      <h2>Integration contract</h2>
      <p>
        Rezva accepts a typed identifier and returns lifecycle state plus
        compatible payment destinations. It does not hold keys or execute a
        transaction.
      </p>
      <pre>{`QR or typed input
       ↓
parse { resolver_url, type, value }
       ↓
POST resolver_url/v1/resolve
       ↓
validate status + payment_ready
       ↓
show destination and ask for confirmation
       ↓
wallet signs and broadcasts`}</pre>

      <h2>Minimum implementation</h2>
      <ol>
        <li>Extract and validate <code>resolver_url</code>, <code>type</code>, and <code>value</code>.</li>
        <li>POST <code>{`{ type, value }`}</code> to the resolver URL with an approved provider key or prototype Free API key.</li>
        <li>Require <code>status === &quot;active&quot;</code> and <code>payment_ready === true</code>.</li>
        <li>Filter <code>payment_options</code> by a chain and asset supported by the wallet.</li>
        <li>Display destination, chain, asset, token contract, and constraints before confirmation.</li>
        <li>Build, sign, broadcast, and monitor the transaction using wallet code.</li>
      </ol>

      <h2>QR parsing</h2>
      <pre>{`type RezvaQrPayload = {
  resolver_url: string;
  type: string;
  value: string;
};

function parseRezvaQr(raw: string): RezvaQrPayload {
  const payload = JSON.parse(raw) as Partial<RezvaQrPayload>;
  if (
    typeof payload.resolver_url !== "string" ||
    typeof payload.type !== "string" ||
    typeof payload.value !== "string"
  ) {
    throw new Error("Unsupported Rezva QR payload");
  }
  return payload as RezvaQrPayload;
}`}</pre>

      <h2>Resolve and gate payment</h2>
      <pre>{`const qr = parseRezvaQr(scannedText);
const response = await fetch(qr.resolver_url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: \`Bearer \${providerApiKey}\`,
  },
  body: JSON.stringify({ type: qr.type, value: qr.value }),
});

if (!response.ok) throw new Error(\`Resolver HTTP \${response.status}\`);
const result = await response.json();

if (result.status !== "active" || result.payment_ready !== true) {
  showUnavailableState(result.status);
  return;
}

const payable = result.payment_options.filter(
  (option: { chain: string; asset: string; payment_ready: boolean }) =>
    option.payment_ready,
);
showPaymentOptions(payable);`}</pre>

      <h2>Do not delegate to Rezva</h2>
      <ul>
        <li>Private-key custody or transaction signing</li>
        <li>Final amount selection without user confirmation</li>
        <li>Blockchain settlement or payment guarantees</li>
        <li>Registry mutations without controller authorization</li>
      </ul>

      <h2>Optional feature filters</h2>
      <p>
        Integrators who only want Universal Name Resolution, only registry
        identifiers, or a custom blocklist can filter locally and/or ask an
        operator to set provider <code>resolve_policy</code>. Filtering is
        optional; the default remains open. Details:{" "}
        <Link href="/docs/for-wallets/api-reference">API Reference</Link> and{" "}
        <Link href="/docs/for-wallets/sdks">SDKs</Link>.
      </p>

      <div className="docs-page-note">
        <p>
          Use the <Link href="/docs/for-wallets/authentication">Authentication</Link>{" "}
          page for credential boundaries and the{" "}
          <Link href="/docs/for-wallets/api-reference">API Reference</Link>{" "}
          for field definitions and error responses.
        </p>
      </div>
    </div>
  );
}

function WalletAuthenticationDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Wallet authentication</h1>
      <p className="docs-page-lede">
        Authentication and authorization are separate. A provider credential
        identifies the integration; a controller authorization proves that a
        wallet may mutate a controller-owned mapping.
      </p>

      <h2>Resolver requests: provider or Free API key</h2>
      <p>
        Two different dashboard credentials can authorize{" "}
        <code>POST /v1/resolve</code>. They are not the same product:
      </p>
      <ul>
        <li>
          <strong>Provider API key</strong> — create under{" "}
          <Link href="/dashboard/provider/api-keys">Wallet Provider → API keys</Link>{" "}
          after approval. Use for production wallets. Higher rate limits. Also
          required for mutation and namespace routes (with controller auth where
          applicable).
        </li>
        <li>
          <strong>Free API key</strong> — create under{" "}
          <Link href="/dashboard/free-api">Free API</Link> with no approval.
          Prototypes and testing only. Accepted <em>only</em> by{" "}
          <code>POST /v1/resolve</code>. Lower limits. Cannot mutate the
          registry or manage namespaces.
        </li>
      </ul>
      <pre>{`Authorization: Bearer <provider-or-free-api-key>
Content-Type: application/json`}</pre>
      <ul>
        <li>Approved provider keys: 120 resolver requests per minute per provider.</li>
        <li>Free API keys: 10 requests per minute and 100 per UTC day.</li>
        <li>HTTP <code>401</code> means the credential is absent, invalid, revoked, or not approved.</li>
        <li>HTTP <code>429</code> includes <code>Retry-After</code> when a limit is reached.</li>
      </ul>
      <p>
        Dashboard map:{" "}
        <Link href="/docs/dashboard/console-overview#api-keys">
          Which API key do I use?
        </Link>
        .
      </p>

      <h2>Controller authorization for mutations</h2>
      <p>
        Registration, updates, suspension, removal, and native-name management
        require an approved provider plus controller authorization. A provider
        key is not proof of ownership, and a controller wallet is not a
        provider credential.
      </p>
      <pre>{`Authorization: Bearer <approved-provider-key>
X-Controller-Wallet: 0xController…
X-Controller-Authorization: <signed authorization payload>
Idempotency-Key: register-request-123`}</pre>
      <p>
        The exact controller authorization payload depends on the configured
        authorization mode. Keep it in the wallet signing flow; never ask the
        user to paste a private key into the integration.
      </p>

      <div className="docs-page-note">
        <p>
          Never expose provider or Free API keys in a public QR payload, URL,
          repository, or untrusted client bundle. A wallet may keep a provider
          key in its secure backend or protected runtime.
        </p>
      </div>
    </div>
  );
}

function WalletApiReferenceDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Wallet API reference</h1>
      <p className="docs-page-lede">
        The resolver is the only operation needed for a read-only wallet
        integration: send one typed identifier and consume a structured
        resolution response.
      </p>

      <h2><code>POST /v1/resolve</code></h2>
      <pre>{`POST /v1/resolve
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "type": "custom",
  "value": "rezva-test-merchant"
}`}</pre>
      <p>
        <code>type</code> is an active, resolution-eligible identifier type.
        It may be omitted when the value is a full EMV / Bangla QR payload -
        the resolver classifies that as <code>bangla_qr</code>.{" "}
        <code>value</code> is normalized by the resolver according to that
        type. Every identifier value is capped at 700 characters.
      </p>
      <pre>{`POST /v1/resolve
{
  "type": "bangla_qr",
  "value": "00020101021126…6304B3C2"
}`}</pre>
      <p>
        For <code>bangla_qr</code>, paste the full QR text and resolve that
        exact string. Do not rewrite it into a merchant ID or chain address
        before calling the resolver.
      </p>

      <h2>Response</h2>
      <pre>{`{
  "protocol_version": "1",
  "status": "active",
  "payment_ready": true,
  "identifier": {
    "type": "email",
    "value": "pay@example.com",
    "normalized_value": "pay@example.com"
  },
  "registration": {
    "registered_at": "2026-08-29T12:00:00.000Z",
    "activated_at": "2026-08-29T13:00:00.000Z",
    "last_updated": "2026-08-29T12:00:00.000Z",
    "last_payment_update": null
  },
  "payment_options": [
    {
      "chain": "base",
      "asset": "USDC",
      "address": "0x…",
      "token_contract": "0x…",
      "network_identifier": "eip155:8453",
      "payment_ready": true
    }
  ]
}`}</pre>
      <h3>Payment decision</h3>
      <pre>{`const canPay =
  result.status === "active" &&
  result.payment_ready === true &&
  result.payment_options.some((option) => option.payment_ready === true);`}</pre>
      <ul>
        <li><code>status</code> is the registry lifecycle state.</li>
        <li><code>payment_ready</code> is the top-level payability signal.</li>
        <li><code>payment_options</code> contains chain, asset, address, token contract, and constraints.</li>
        <li><code>registration</code> timestamps support trust and warning UX.</li>
        <li><code>trust.warnings</code>, when present, must be shown before confirmation.</li>
      </ul>

      <h2>Discovery and error handling</h2>
      <ul>
        <li><code>GET /v1/identifier-types</code> - discover active types and capabilities.</li>
        <li><code>GET /health</code> - check service health; it does not authenticate.</li>
        <li><code>401</code> - authentication or provider approval failure.</li>
        <li><code>400</code> - invalid identifier or unsupported type.</li>
        <li><code>403</code> <code>RESOLVE_POLICY_DENIED</code> - provider resolve policy blocked this value or module.</li>
        <li><code>404</code> - no payment destination found for the normalized identifier.</li>
        <li><code>429</code> - retry after the response’s <code>Retry-After</code> value.</li>
      </ul>

      <h2>Optional provider resolve policy</h2>
      <p>
        By default a provider key can resolve everything. Operators may attach
        an optional <code>resolve_policy</code> to a provider so the API enforces
        module and blocklist rules. Omit the policy (or leave fields unset) to
        keep open behavior.
      </p>
      <pre>{`{
  "unr": true,
  "registry": true,
  "allow_namespaces": [".eth", ".base"],
  "deny_namespaces": [".sol"],
  "deny_types": ["phone"],
  "blocklist": ["spam.eth", "blocked@example.com"]
}`}</pre>
      <ul>
        <li><code>unr: false</code> - disable Universal Name Resolution.</li>
        <li><code>registry: false</code> - disable Rezva registry identifiers (email, QR, namespaces, …).</li>
        <li><code>allow_namespaces</code> / <code>deny_namespaces</code> - filter external TLDs when UNR is on.</li>
        <li><code>deny_types</code> - block registry types even if listed in <code>allowed_identifier_types</code>.</li>
        <li><code>blocklist</code> - reject exact identifier values (case-insensitive).</li>
      </ul>
      <p>
        Wallets can mirror the same rules client-side with{" "}
        <code>shouldAcceptPaste</code> before calling resolve. See{" "}
        <Link href="/docs/for-wallets/sdks">SDKs and integration recipes</Link>.
      </p>
      <p>
        See the <a href="/openapi.json">OpenAPI specification</a> for the
        machine-readable contract. Free API keys cannot call registry mutation
        endpoints.
      </p>
    </div>
  );
}

function WalletMerchantSetupDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Merchant setup</h1>
      <p className="docs-page-lede">
        Merchant setup is an optional provider capability. It helps a
        controller (business or individual user) register identifiers and
        destinations while the controller remains the owner of the mapping.
      </p>

      <h2>When to use it</h2>
      <p>
        Merchant Setup is for an approved provider that helps a controller
        register or manage mappings from inside a wallet. It is not needed for
        resolver-only integrations or Free API prototypes. Controllers can
        alternatively self-serve on the{" "}
        <Link href="/docs/dashboard/business-track">Business / Users dashboard</Link>{" "}
        (capped at 2 identifiers).
      </p>

      <h2>Provider-owned identifier limits</h2>
      <p>
        When registering through your provider API, <strong>you define how many
        identifiers each controller may hold</strong> and how upgrades work.
        Enforce that in your product UI and backend. The official dashboard’s
        2-identifier cap applies only to dashboard registrations, not to your
        Merchant Setup API traffic.
      </p>

      <h2>Setup sequence</h2>
      <ol>
        <li>Authenticate the approved provider.</li>
        <li>Connect the controller wallet and obtain its authorization signature.</li>
        <li>Discover an active identifier type and check availability.</li>
        <li>Enforce your per-controller identifier limit before create.</li>
        <li>Submit the identifier and one or more validated payment destinations.</li>
        <li>Show pending activation and any safety period.</li>
        <li>Refresh until the mapping is active before displaying it as payable.</li>
      </ol>

      <h2>Request example</h2>
      <pre>{`POST /v1/identifiers
Authorization: Bearer <approved-provider-key>
X-Controller-Wallet: 0xController…
X-Controller-Authorization: <signed payload>
Idempotency-Key: create-identifier-123

{
  "type": "email",
  "value": "pay@example.com",
  "payment_options": [{
    "chain": "base",
    "asset": "USDC",
    "address": "0xRecipient…",
    "network_identifier": "eip155:8453"
  }]
}`}</pre>

      <h2>Provider boundary</h2>
      <p>
        A provider may facilitate the UI and send authenticated requests, but
        cannot silently transfer ownership, bypass safety periods, or change a
        controller’s destination without authorization.
      </p>
      <p>
        Use <Link href="/docs/for-merchants/register-an-identifier">Register an Identifier</Link>
        {" "}for the controller-facing checklist.
      </p>
    </div>
  );
}

function MerchantRegisterIdentifierDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Register an identifier</h1>
      <p className="docs-page-lede">
        A controller registers a typed value together with at least one
        payment destination. Registration is a management operation, not a
        resolver operation. After registration, compatible wallets that
        integrate Rezva resolve can look the identifier up.
      </p>

      <h2>Limits by registration path</h2>
      <ul>
        <li>
          <strong>Official dashboard (Business / Users):</strong> max{" "}
          <strong>2 identifiers</strong> per controller. Existing identifiers
          already on an account remain active; new dashboard registrations are
          blocked once the account is at or above the limit.
        </li>
        <li>
          <strong>Approved wallet providers (Merchant Setup API):</strong> each
          provider sets its own per-controller identifier limits and product
          rules. Document those limits in your wallet UX. The dashboard cap does
          not override provider API policy.
        </li>
      </ul>

      <h2>Before you call the API</h2>
      <ol>
        <li>Complete Business / Users approval or use an approved wallet with Merchant Setup.</li>
        <li>Call <code>GET /v1/identifier-types</code> and choose an active, registration-eligible type.</li>
        <li>Check availability for the exact typed value.</li>
        <li>Validate each chain, asset, contract, and address combination.</li>
      </ol>

      <h2>Authentication headers</h2>
      <pre>{`Authorization: Bearer <approved-provider-key>
X-Controller-Wallet: 0xController…
X-Controller-Authorization: <signed authorization payload>
Idempotency-Key: unique-register-operation`}</pre>

      <h2>Check availability</h2>
      <pre>{`GET /v1/identifiers/email/pay%40example.com/availability`}</pre>
      <pre>{`{ "available": true, "type": "email" }`}</pre>

      <h2>Register</h2>
      <pre>{`POST /v1/identifiers
{
  "type": "email",
  "value": "pay@example.com",
  "payment_options": [
    {
      "chain": "base",
      "asset": "USDC",
      "address": "0xRecipient…",
      "token_contract": "0xBaseUsdc…",
      "network_identifier": "eip155:8453"
    }
  ]
}`}</pre>

      <p>
        A successful response is <code>201</code> and normally starts in{" "}
        <code>pending</code>. The configured safety period must elapse before
        the identifier becomes payable.
      </p>
      <pre>{`{
  "id": "identifier_123",
  "type": "email",
  "value": "pay@example.com",
  "status": "pending",
  "controller": "controller_123",
  "registered_at": "2026-08-30T00:00:00.000Z",
  "activated_at": null,
  "payment_options": [{ "chain": "base", "asset": "USDC", "address": "0x…" }]
}`}</pre>
      <div className="docs-page-note">
        <p>
          Poll the identifier or resolve it again after activation. Do not
          display a pending mapping as payable.
        </p>
      </div>
    </div>
  );
}

function MerchantManageIdentifiersDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Manage identifiers</h1>
      <p className="docs-page-lede">
        Use the identifier resource to inspect, update, suspend, or remove a
        controller-owned mapping while preserving its audit history.
      </p>

      <h2>Required headers</h2>
      <pre>{`Authorization: Bearer <approved-provider-key>
X-Controller-Wallet: 0xController…
X-Controller-Authorization: <signed authorization payload>`}</pre>

      <h2>Read current state</h2>
      <pre>{`GET /v1/identifiers/:id`}</pre>

      <h2>Update destinations</h2>
      <pre>{`PATCH /v1/identifiers/:id
{
  "payment_options": [
    {
      "chain": "base",
      "asset": "USDC",
      "address": "0xNewRecipient…",
      "network_identifier": "eip155:8453"
    }
  ]
}`}</pre>
      <p>
        A changed destination enters <code>update_pending</code>. Resolve the
        identifier again only after the new destination is active.
      </p>

      <h2>Common operations</h2>
      <ul>
        <li><code>GET /v1/identifiers/:id</code> - read current state</li>
        <li><code>PATCH /v1/identifiers/:id</code> - update metadata or destinations</li>
        <li><code>DELETE /v1/identifiers/:id</code> - remove with cooldown</li>
        <li><code>GET /v1/identifiers/:id/history</code> - inspect registry events</li>
        <li><code>POST /v1/identifiers/:id/emergency-suspend</code> - stop payment immediately</li>
      </ul>

      <h2>Important state rules</h2>
      <ul>
        <li>Destination changes enter <code>update_pending</code> during the safety period.</li>
        <li>Removed mappings may become available only after <code>available_at</code>.</li>
        <li>Suspended and revoked mappings are not payable.</li>
        <li>Registry events must remain auditable after changes.</li>
      </ul>

      <div className="docs-page-note">
        <p>
          Emergency suspension is for suspected compromise or abuse. It does
          not replace the normal controller-authorized update flow.
        </p>
      </div>
    </div>
  );
}

function MerchantPaymentDestinationsDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Payment destinations</h1>
      <p className="docs-page-lede">
        A destination tells a wallet where and how a payment can be made. It
        is payment-critical data and receives stronger validation and safety
        handling than ordinary profile metadata.
      </p>

      <h2>Destination fields</h2>
      <pre>{`{
  "chain": "base",
  "asset": "USDC",
  "address": "0xRecipient…",
  "token_contract": "0xUsdcContract…",
  "network_identifier": "eip155:8453",
  "minimum_amount": "1.00",
  "maximum_amount": "10000.00",
  "fixed_amount": "10.00",
  "expiration": "2026-12-31T00:00:00.000Z"
}`}</pre>
      <ul>
        <li><code>chain</code>, <code>asset</code>, and <code>address</code> are required.</li>
        <li><code>token_contract</code> is required for token payments.</li>
        <li><code>network_identifier</code> disambiguates networks, such as EIP-155 chain IDs.</li>
        <li>Optional memo, payment reference, amount limits, fixed amount, or expiration are payment constraints.</li>
      </ul>

      <h2>Safe update flow</h2>
      <ol>
        <li>Validate the address and asset combination.</li>
        <li>Authorize the update as the controller.</li>
        <li>Show <code>update_pending</code> and stop normal payment actions.</li>
        <li>After activation, resolve again and display the new payable option.</li>
      </ol>

      <p>
        The resolver never signs or sends funds. Wallets must show the final
        destination and network immediately before the user confirms payment.
      </p>
    </div>
  );
}

function ProtocolSpecificationDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Protocol specification</h1>
      <p className="docs-page-lede">
        The protocol separates identifier resolution from registry management
        and keeps payment execution inside the user’s wallet.
      </p>

      <h2>Request and response model</h2>
      <pre>{`identifier + type
        ↓
normalization
        ↓
registry or authoritative resolver
        ↓
status + trust metadata + payment options
        ↓
wallet transaction flow`}</pre>
      <pre>{`POST /v1/resolve
{ "type": "email", "value": "pay@example.com" }

→ {
    "status": "active",
    "payment_ready": true,
    "payment_options": [...]
  }`}</pre>

      <h2>Normative rules</h2>
      <ul>
        <li>Identifier types are explicit; a value without a type is ambiguous.</li>
        <li>
          Client type inference must classify free-form URLs and{" "}
          <code>$handles</code> as <code>custom</code>, not{" "}
          <code>merchant_id</code>.
        </li>
        <li>Only active, payment-ready mappings are immediately payable.</li>
        <li>Pending and changed destinations must fail closed.</li>
        <li>Resolution must not mutate registry state.</li>
        <li>Protocol infrastructure does not custody or settle funds.</li>
      </ul>
      <h2>Implementation checklist</h2>
      <ol>
        <li>Keep the identifier type next to the value at every boundary.</li>
        <li>Normalize and validate input before displaying a resolver result.</li>
        <li>Check both top-level and option-level payment readiness.</li>
        <li>Show chain, asset, contract, recipient, and amount constraints.</li>
        <li>Re-resolve after a meaningful delay or state transition.</li>
        <li>Let the wallet sign and broadcast only after user confirmation.</li>
      </ol>
    </div>
  );
}

function IdentifierRegistryDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Identifier registry</h1>
      <p className="docs-page-lede">
        The registry owns protocol mappings, controller references, lifecycle
        state, payment destinations, and auditable events.
      </p>

      <h2>Registry lifecycle</h2>
      <pre>{`availability → register → pending → active
                           ↓
                  update_pending → active
                           ↓
                 removed → cooldown → available`}</pre>
      <ol>
        <li>Check availability for the exact typed value.</li>
        <li>Register with controller authorization and payment options.</li>
        <li>Activate after the configured safety period.</li>
        <li>Update metadata or destinations through authorized mutations.</li>
        <li>Remove, suspend, revoke, or reclaim only through the permitted workflow.</li>
      </ol>

      <h2>Uniqueness</h2>
      <p>
        Uniqueness is evaluated on the normalized value within its identifier
        type. Similar-looking values are not automatically conflicts, while an
        exact normalized match cannot be registered twice.
      </p>

      <div className="docs-page-note">
        <p>
          External crypto names (<code>.eth</code>, <code>.sol</code>,{" "}
          <code>.base</code>, Unstoppable TLDs) resolve on the same{" "}
          <code>POST /v1/resolve</code> API via authoritative systems; they are
          never registered here. Raw blockchain addresses are destinations, not
          registry identifiers.
        </p>
        <p>
          Use <Link href="/docs/for-merchants/register-an-identifier">Register an identifier</Link>{" "}
          for the request sequence and{" "}
          <Link href="/docs/reference/statuses">Statuses</Link> before allowing
          a payment.
        </p>
      </div>
    </div>
  );
}

function IdentifierTypesDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Identifier types</h1>
      <p className="docs-page-lede">
        Types define how values are normalized, validated, registered, and
        resolved. Integrations should discover active types instead of
        hard-coding assumptions.
      </p>

      <h2>Initial types</h2>
      <ul>
        <li><code>phone</code> - normalized telephone number</li>
        <li><code>email</code> - normalized email value</li>
        <li><code>bangla_qr</code> - full Bangla / EMV QR text (exact string match, max 700 characters)</li>
        <li><code>paypal</code>, <code>bkash</code>, or merchant IDs where enabled</li>
        <li><code>custom</code> - free-form values (shop codes, handles, payment URLs, or any other label). Not a restricted slug charset; exact-string resolve after normalization.</li>
        <li><code>provider_name</code> - provider namespace names such as <code>alice.redotpay</code></li>
      </ul>

      <h2>Discovery</h2>
      <pre>{`GET /v1/identifier-types

{
  "types": [
    {
      "name": "email",
      "status": "active",
      "registration_eligible": true,
      "resolution_eligible": true
    }
  ]
}`}</pre>

      <p>
        A QR may already be the identifier value. For Bangla / EMV payment
        QR codes, send the full scanned or pasted text as{" "}
        <code>bangla_qr</code> (or omit <code>type</code> and let the
        resolver detect it). Other QR formats may still need the wallet to
        extract a typed identifier first.
      </p>
      <h2>Integration rule</h2>
      <pre>{`const supported = await fetch("/v1/identifier-types").then((r) => r.json());
const type = supported.types.find(
  (item) =>
    item.name === input.type &&
    item.status === "active" &&
    item.resolution_eligible,
);
if (!type) throw new Error("Identifier type cannot be resolved");`}</pre>
      <p>
        Keep type discovery server-driven because the set of active types and
        their registration eligibility can change independently of a wallet
        release.
      </p>
    </div>
  );
}

function SecurityDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Security</h1>
      <p className="docs-page-lede">
        Rezva uses scoped credentials, controller authorization, safety periods,
        fail-closed statuses, and audit events to protect payment mappings.
      </p>

      <h2>Integration requirements</h2>
      <ul>
        <li>Keep provider and Free API keys on a trusted server or secure wallet runtime.</li>
        <li>Validate response status and payment readiness before payment.</li>
        <li>Warn on pending, recently changed, suspended, and removed mappings.</li>
        <li>Never infer ownership from a provider credential.</li>
        <li>Do not cache transitional or payment-critical state for long periods.</li>
      </ul>

      <h2>Threat controls</h2>
      <p>
        Resolver traffic is authenticated, rate-limited, monitored for
        enumeration, and separated from registry mutations. Complaints create
        review work; they do not silently change registry state. Privileged
        actions and ownership decisions must be auditable.
      </p>
      <h2>Request handling checklist</h2>
      <ol>
        <li>Keep API keys in a server-side secret store or protected wallet runtime.</li>
        <li>Redact <code>Authorization</code> and controller headers from logs.</li>
        <li>Use TLS and set a bounded request timeout.</li>
        <li>Honor <code>Retry-After</code> instead of retrying a 429 in a tight loop.</li>
        <li>Do not cache pending, suspended, removed, or update-pending results as payable.</li>
        <li>Verify the chain receipt and token transfer before showing payment received.</li>
      </ol>

      <div className="docs-page-note">
        <p>
          For production deployment, also review secret storage, key rotation,
          RPC reliability, database access, logging redaction, and incident
          response procedures.
        </p>
      </div>
    </div>
  );
}

function ErrorsDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Errors</h1>
      <p className="docs-page-lede">
        Errors use a stable machine-readable code with a human-readable
        message. Wallets should provide a useful recovery action rather than
        treating every error as a generic failure.
      </p>

      <h2>Example</h2>
      <pre>{`{
  "error": {
    "code": "IDENTIFIER_UPDATE_PENDING",
    "message": "Payment destination update is still in its safety period."
  }
}`}</pre>

      <h2>Common codes</h2>
      <ul>
        <li><code>IDENTIFIER_NOT_FOUND</code>, <code>IDENTIFIER_INVALID</code></li>
        <li><code>IDENTIFIER_PENDING</code>, <code>IDENTIFIER_UPDATE_PENDING</code></li>
        <li><code>IDENTIFIER_SUSPENDED</code>, <code>IDENTIFIER_REMOVED</code></li>
        <li><code>TYPE_NOT_SUPPORTED</code>, <code>DESTINATION_UNAVAILABLE</code></li>
        <li><code>PROVIDER_NOT_APPROVED</code>, <code>UNAUTHORIZED</code>, <code>FORBIDDEN</code></li>
        <li><code>RATE_LIMITED</code> and <code>FREE_API_RATE_LIMITED</code></li>
      </ul>

      <p>
        HTTP 401 and 403 indicate an authentication or authorization problem;
        HTTP 429 indicates retryable rate limiting. Preserve the error code in
        logs and client telemetry.
      </p>
      <h2>Client recovery</h2>
      <pre>{`if (response.status === 429) {
  const seconds = Number(response.headers.get("Retry-After") ?? 60);
  scheduleRetry(seconds);
} else if (response.status === 401) {
  requestNewCredential();
} else if (response.status === 404) {
  showIdentifierNotFound();
} else {
  showResolverError();
}`}</pre>
      <p>
        Never retry invalid input, revoked identifiers, or authorization errors
        indefinitely. Preserve the machine-readable <code>error.code</code> for
        telemetry and user-facing recovery.
      </p>
    </div>
  );
}

function StatusesDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Statuses</h1>
      <p className="docs-page-lede">
        Mapping status and payment readiness are separate signals. A wallet
        must inspect both before allowing payment.
      </p>

      <ul>
        <li><strong>pending</strong> - registered but not activated; not payable.</li>
        <li><strong>active</strong> - usable when <code>payment_ready</code> is true.</li>
        <li><strong>update_pending</strong> - destination changed; pause payment until safe.</li>
        <li><strong>suspended</strong> - temporarily blocked; do not pay.</li>
        <li><strong>removed</strong> - controller removed it; cooldown may expose <code>available_at</code>.</li>
        <li><strong>revoked</strong> - permanent operator action; not re-registerable.</li>
      </ul>

      <h2>Wallet decision rule</h2>
      <pre>{`if (response.status === "active" && response.payment_ready) {
  showPaymentOptions(response.payment_options);
} else {
  blockPaymentAndExplain(response.status);
}`}</pre>

      <p>
        Keep transitional responses fresh. Do not serve a stale active result
        after a destination update or suspension.
      </p>
      <h2>Display behavior</h2>
      <pre>{`switch (response.status) {
  case "active":
    enablePaymentOnlyIf(response.payment_ready);
    break;
  case "pending":
  case "update_pending":
    disablePayment("Waiting for activation");
    break;
  case "suspended":
  case "removed":
  case "revoked":
    disablePayment("Identifier is unavailable");
    break;
}`}</pre>
    </div>
  );
}

function DashboardConsoleOverview() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Console overview</h1>
      <p className="docs-page-lede">
        The official Rezva dashboard is a shared console for businesses and
        wallet providers. Both enter through the same UI; each track unlocks
        only after that track’s application is approved. Free API is separate
        from those tracks: it is always available after sign-in for prototypes.
      </p>

      <h2>Entry</h2>
      <p>
        Open <Link href="/dashboard">/dashboard</Link> from the site header or
        marketing CTAs.
      </p>

      <h2 id="api-keys">Which API key do I use?</h2>
      <p>
        The dashboard shows more than one credential path. They are not
        interchangeable. Pick the key that matches what you are building:
      </p>
      <ul>
        <li>
          <strong>Free API key</strong> (
          <Link href="/dashboard/free-api">/dashboard/free-api</Link>) — for
          learning, prototypes, and resolver testing. No provider approval.
          Works only with <code>POST /v1/resolve</code>. Lower rate limits.
          Pairs with the shared Test Merchant. Not for production wallets.
        </li>
        <li>
          <strong>Provider API key</strong> (
          <Link href="/dashboard/provider/api-keys">/dashboard/provider/api-keys</Link>
          ) — for production wallet integrations after the Wallet Provider
          track is approved. Higher limits. Required for production resolve
          traffic, namespaces, and merchant-setup APIs. Free API keys never
          unlock these routes.
        </li>
        <li>
          <strong>Business track</strong> (
          <Link href="/dashboard/business/apply">/dashboard/business/apply</Link>
          ) — not an API key for wallets. Merchants use it to register their
          own identifiers and payment destinations in the UI after approval.
        </li>
      </ul>
      <pre>{`Free API key      → resolve only, prototypes / testing
Provider API key  → resolve (+ optional setup) after approval, production
Business track    → manage your own identifiers in the dashboard UI`}</pre>
      <p>
        Full Free API walkthrough:{" "}
        <Link href="/docs/dashboard/free-api">Free API and Test Merchant</Link>.
        Production wallet auth:{" "}
        <Link href="/docs/for-wallets/authentication">Authentication</Link>.
      </p>

      <h2>Which track do I need?</h2>
      <ul>
        <li>
          <strong>Free API</strong> — prototype resolver integration and shared
          Test Merchant testing (no approval).
        </li>
        <li>
          <strong>Business</strong> — own identifiers and payment destinations
          (application required).
        </li>
        <li>
          <strong>Wallet Provider</strong> — production resolver access and
          optional merchant setup (application required).
        </li>
        <li>
          <strong>Operator</strong> — review providers, complaints, names, and
          safety actions (operator credentials).
        </li>
      </ul>

      <h2>Navigation</h2>
      <ul>
        <li>
          <strong>Overview</strong> - shared entry and status for both tracks
        </li>
        <li>
          <strong>Business</strong> - apply, then manage profile, identifiers,
          destinations, activity, complaints, settings
        </li>
        <li>
          <strong>Wallet Provider</strong> - apply, then overview, integration,
          API keys, usage, webhooks, sandbox, namespaces, settings
        </li>
        <li>
          <strong>Free API</strong> - resolver-only testing key and Test Merchant
          QR flow, available without provider approval
        </li>
        <li>
          <strong>Developers</strong> - docs, SDKs, sandbox references
        </li>
        <li>
          <strong>Support</strong> - help channels
        </li>
      </ul>

      <h2>Application states</h2>
      <p>
        Not applied → submitted → under review → approved (track unlocked) or
        rejected (reason + reapply). Free API does not use this application
        flow.
      </p>
      <h2>Operational rule</h2>
      <p>
        Dashboard access does not grant blockchain custody or transaction
        authority. The dashboard configures registry data and credentials; the
        user’s wallet remains responsible for signing and broadcasting payments.
      </p>

      <div className="docs-page-note">
        <p>
          Authentication, application review, registry wiring, and provider
          namespace APIs are connected. Production deployments still require
          configured backend credentials and a durable database.
        </p>
        <Link className="docs-wallets-link" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}

function FreeApiDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Free API and Test Merchant</h1>
      <p className="docs-page-lede">
        A complete, approval-free path for integrating identifier resolution
        into a prototype wallet. You will generate a key, read the shared Test
        Merchant QR, resolve it, and send a real Base Sepolia USDC payment from
        your wallet.
      </p>

      <section className="docs-page-section" id="not-provider">
        <h2>Free API is not the provider API</h2>
        <p>
          In the dashboard, <strong>Free API</strong> and{" "}
          <strong>Wallet Provider → API keys</strong> look similar but serve
          different purposes. Do not use a Free API key for a production wallet.
        </p>
        <ul>
          <li>
            <strong>Free API</strong> (
            <Link href="/dashboard/free-api">/dashboard/free-api</Link>) —
            available as soon as you sign in. Resolve-only. Rate-limited for
            prototypes and the shared Test Merchant. Cannot register
            identifiers, manage namespaces, or call other provider routes.
          </li>
          <li>
            <strong>Provider API key</strong> (
            <Link href="/dashboard/provider/api-keys">
              /dashboard/provider/api-keys
            </Link>
            ) — unlocked only after your Wallet Provider application is
            approved. Use this for production resolve traffic and optional
            merchant-setup or namespace APIs.
          </li>
        </ul>
        <p>
          See{" "}
          <Link href="/docs/dashboard/console-overview#api-keys">
            Which API key do I use?
          </Link>{" "}
          and{" "}
          <Link href="/docs/for-wallets/authentication">Authentication</Link>.
        </p>
      </section>

      <nav className="docs-page-toc" aria-label="On this page">
        <strong>On this page</strong>
        <a href="#not-provider">Free API vs provider API</a>
        <a href="#requirements">Requirements</a>
        <a href="#try-wallets">Try with a reference wallet</a>
        <a href="#get-key">1. Get a Free API key</a>
        <a href="#read-qr">2. Read the Test Merchant QR</a>
        <a href="#resolve">3. Resolve the identifier</a>
        <a href="#choose-option">4. Choose the payment option</a>
        <a href="#execute">5. Execute and verify payment</a>
        <a href="#errors">Errors and limits</a>
        <a href="#more-tests">More test identifiers</a>
      </nav>

      <section className="docs-page-section" id="requirements">
        <h2>Requirements</h2>
        <ul>
          <li>A Rezva dashboard account at <Link href="/dashboard">/dashboard</Link>.</li>
          <li>An active Free API key from <Link href="/dashboard/free-api">/dashboard/free-api</Link>.</li>
          <li>A wallet that can send Base Sepolia USDC.</li>
          <li>A configured Rezva resolver URL. Use the URL in the QR payload.</li>
        </ul>
        <p className="docs-page-note">
          The Test Merchant is a protocol demo merchant. It is not a real
          merchant and must only receive testnet funds.
        </p>
      </section>

      <section className="docs-page-section" id="try-wallets">
        <h2>Try with a reference wallet</h2>
        <p>
          Clone one of these open-source clients to exercise resolve + payment
          against the live Free API without writing a wallet from scratch:
        </p>
        <ul>
          <li>
            <strong>Mobile wallet:</strong>{" "}
            <a
              href="https://github.com/shahtab123/mobilewallet_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/mobilewallet_rezva
            </a>{" "}
            (Expo / Android - Send tab, identifier entry, QR scan)
          </li>
          <li>
            <strong>Rabby (Chrome):</strong>{" "}
            <a
              href="https://github.com/shahtab123/rabby_chrome_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/rabby_chrome_rezva
            </a>{" "}
            (Rabby clone - unpacked build, resolve in Send)
          </li>
        </ul>
        <p>
          Each README covers install, Free/Provider key setup, and local vs
          production API base URL. Also listed under{" "}
          <Link href="/docs/reference/compatible-wallets">Compatible wallets</Link>.
        </p>
      </section>

      <section className="docs-page-section" id="get-key">
        <h2>1. Get a Free API key</h2>
      <p>
          Open the Free API dashboard and select <strong>Generate key</strong>.
          The complete plaintext key is shown only at that moment. Store it in
          a server-side environment variable; do not commit it or put it in a
          browser bundle.
        </p>
        <pre>{`# .env.local (never commit this file)
REZVA_FREE_API_KEY=rzva_free_…
REZVA_API_BASE_URL=https://api.example.com`}</pre>
        <p>
          Regeneration revokes the previous key. If a key is exposed, revoke it
          immediately from the dashboard and generate a replacement.
        </p>
      </section>

      <section className="docs-page-section" id="read-qr">
        <h2>2. Read the Test Merchant QR</h2>
        <p>
          Open <strong>Test Merchant</strong> in the Free API dashboard. The
          same persistent merchant identifier, wallet, and QR payload are used
          by every developer in the environment. A QR scanner should parse the
          JSON rather than treating the entire QR text as an address.
        </p>
        <pre>{`{
  "resolver_url": "https://api.example.com/v1/resolve",
  "type": "custom",
  "value": "rezva-test-merchant"
}`}</pre>
        <p>
          Save <code>resolver_url</code>, <code>type</code>, and{" "}
          <code>value</code>. The wallet sends only <code>type</code> and{" "}
          <code>value</code> to the resolver.
        </p>
      </section>

      <section className="docs-page-section" id="resolve">
        <h2>3. Resolve the identifier</h2>
        <p>
          Make an authenticated <code>POST</code> request to the QR’s resolver
          URL. The key is valid for this resolver operation only.
        </p>
        <h3>TypeScript</h3>
        <pre>{`const response = await fetch(
  "https://api.example.com/v1/resolve",
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: \`Bearer \${process.env.REZVA_FREE_API_KEY}\`,
    },
    body: JSON.stringify({
      type: "custom",
      value: "rezva-test-merchant",
    }),
  },
);

if (!response.ok) {
  throw new Error(\`Resolve failed: \${response.status} \${await response.text()}\`);
}

const resolved = await response.json();`}</pre>
        <h3>Python</h3>
        <pre>{`import os
import requests

response = requests.post(
    "https://api.example.com/v1/resolve",
    headers={
        "content-type": "application/json",
        "authorization": f"Bearer {os.environ['REZVA_FREE_API_KEY']}",
    },
    json={"type": "custom", "value": "rezva-test-merchant"},
    timeout=10,
)
response.raise_for_status()
resolved = response.json()`}</pre>
        <p>
          A successful response includes lifecycle state and one or more
          payment options. The resolver does not create, sign, broadcast, or
          confirm the blockchain transaction.
        </p>
        <pre>{`{
  "protocol_version": "1",
  "status": "active",
  "payment_ready": true,
  "identifier": {
    "type": "custom",
    "value": "rezva-test-merchant",
    "normalized_value": "rezva-test-merchant"
  },
  "payment_options": [
    {
      "chain": "base",
      "asset": "USDC",
      "address": "0xMerchantWallet",
      "token_contract": "0xBaseSepoliaUsdc",
      "network_identifier": "eip155:84532",
      "payment_ready": true
    }
  ]
}`}</pre>
      </section>

      <section className="docs-page-section" id="choose-option">
        <h2>4. Choose the payment option safely</h2>
        <p>
          Never select the first array item blindly. Filter by the chain and
          asset your wallet supports, then require both readiness flags.
        </p>
        <pre>{`const option = resolved.payment_options.find(
  (candidate) =>
    candidate.chain === "base" &&
    candidate.asset === "USDC" &&
    candidate.network_identifier === "eip155:84532" &&
    candidate.payment_ready === true,
);

if (resolved.status !== "active" || !resolved.payment_ready || !option) {
  throw new Error("The destination is not ready for Base Sepolia USDC payment");
}

// Show these values and get explicit user confirmation:
console.log({
  chain: option.chain,
  network: option.network_identifier,
  asset: option.asset,
  tokenContract: option.token_contract,
  recipient: option.address,
});`}</pre>
        <ul>
          <li><code>address</code> is the recipient for the token transfer.</li>
          <li><code>token_contract</code> identifies the USDC contract to call.</li>
          <li><code>network_identifier</code> <code>eip155:84532</code> is Base Sepolia.</li>
          <li>Respect <code>minimum_amount</code>, <code>maximum_amount</code>, <code>fixed_amount</code>, and <code>expiration</code> when present.</li>
        </ul>
      </section>

      <section className="docs-page-section" id="execute">
        <h2>5. Execute and verify the payment</h2>
        <ol>
          <li>Switch the wallet to Base Sepolia (chain ID 84532).</li>
          <li>Show the token contract and recipient to the user.</li>
          <li>Ask for the amount and explicit confirmation.</li>
          <li>Use the wallet’s own signer to call the USDC <code>transfer</code> function.</li>
          <li>Wait for the transaction receipt and require a successful status.</li>
          <li>Verify the recipient and amount in the USDC <code>Transfer</code> event.</li>
        </ol>
        <pre>{`// The wallet owns this step. Rezva never receives private keys.
const txHash = await wallet.sendUsdc({
  chainId: 84532,
  token: option.token_contract,
  recipient: option.address,
  amount: "0.01",
});

const receipt = await wallet.waitForTransaction(txHash);
if (receipt.status !== "success") {
  throw new Error("Base Sepolia transaction failed");
}`}</pre>
        <p>
          For the demo flow, verify the real transaction independently at{" "}
          <a href="https://sepolia.basescan.org/" target="_blank" rel="noreferrer">
            https://sepolia.basescan.org/
          </a>
          {" "}by searching the transaction hash or the shared merchant wallet.
          The dashboard’s Detected payments table also shows the confirmed
          transaction after its ledger scan.
        </p>
      </section>

      <section className="docs-page-section" id="errors">
        <h2>Errors and limits</h2>
        <ul>
          <li><code>401</code> - missing, invalid, revoked, or misplaced key.</li>
          <li><code>404</code> - the typed identifier was not found.</li>
          <li><code>400</code> - unsupported type or invalid identifier value.</li>
          <li><code>429</code> - the Free API limit was reached; honor <code>Retry-After</code>.</li>
        </ul>
        <p>
          Each Free API key allows 10 resolver requests per minute and 100
          resolver requests per UTC day. It cannot register, update, suspend,
          remove identifiers, manage namespaces, or access operator data.
        </p>
        <pre>{`if (response.status === 429) {
  const retryAfter = Number(response.headers.get("retry-after") ?? "60");
  await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
}`}</pre>
        <div className="docs-page-note">
          <p>
            Continue with the <Link href="/docs/for-wallets/api-reference">API Reference</Link>{" "}
            for field definitions, or use the{" "}
            <a href="/openapi.json">OpenAPI specification</a> to generate a
            client.
          </p>
          <Link className="docs-wallets-link" href="/dashboard/free-api">
            Open Free API testing
          </Link>
        </div>
      </section>

      <section className="docs-page-section" id="more-tests">
        <h2>More test identifiers</h2>
        <p>
          After the Test Merchant path works, use the{" "}
          <Link href="/docs/dashboard/testing-guide">Testing guide</Link> for
          live email, namespace, QR, and Universal Name Resolution fixtures
          (ENS, Base Names, SNS, Unstoppable).
        </p>
      </section>
    </div>
  );
}

function TestingGuideDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Testing guide</h1>
      <p className="docs-page-lede">
        Exercise resolve against live registry fixtures and Universal Name
        Resolution using the open-source reference wallets. Values below are
        active in the production registry (or public naming systems) and are
        safe for Free API / provider-key resolve tests.
      </p>

      <nav className="docs-page-toc" aria-label="On this page">
        <strong>On this page</strong>
        <a href="#wallets">Reference wallets</a>
        <a href="#auth">Auth and base URL</a>
        <a href="#qr">QR / Test Merchant</a>
        <a href="#email">Email</a>
        <a href="#namespace">Namespace name</a>
        <a href="#unr">Blockchain name resolution</a>
        <a href="#checklist">Wallet checklist</a>
      </nav>

      <section className="docs-page-section" id="wallets">
        <h2>Reference wallets</h2>
        <p>
          Clone either client, put your Free API (or approved provider) key in
          the wallet env, and point the resolver base URL at production or local
          as described in each README.
        </p>
        <ul>
          <li>
            <strong>Mobile wallet:</strong>{" "}
            <a
              href="https://github.com/shahtab123/mobilewallet_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/mobilewallet_rezva
            </a>{" "}
            - Expo / Android. Send tab, paste identifiers, scan QR.
          </li>
          <li>
            <strong>Rabby (Chrome):</strong>{" "}
            <a
              href="https://github.com/shahtab123/rabby_chrome_rezva"
              target="_blank"
              rel="noreferrer"
            >
              github.com/shahtab123/rabby_chrome_rezva
            </a>{" "}
            - unpacked Chrome MV3 build. Paste into Send; resolve before pay.
          </li>
        </ul>
        <p>
          Also listed under{" "}
          <Link href="/docs/reference/compatible-wallets">Compatible wallets</Link>.
        </p>
      </section>

      <section className="docs-page-section" id="auth">
        <h2>Auth and base URL</h2>
        <pre>{`POST /v1/resolve
Authorization: Bearer <free-or-provider-key>
Content-Type: application/json

# Production Worker (example)
https://universal-payment-api.sabrishahtab.workers.dev/v1/resolve`}</pre>
        <p>
          Generate a Free API key at{" "}
          <Link href="/dashboard/free-api">/dashboard/free-api</Link>. Prefer
          sending <code>{`{ "value": "…" }`}</code> for name-like pastes; typed
          registry identifiers may include <code>type</code>.
        </p>
      </section>

      <section className="docs-page-section" id="qr">
        <h2>QR / Test Merchant</h2>
        <p>
          Shared Test Merchant (from <code>shared_test_merchant</code> /
          active <code>custom</code> identifier):
        </p>
        <pre>{`{
  "resolver_url": "https://universal-payment-api.sabrishahtab.workers.dev/v1/resolve",
  "type": "custom",
  "value": "rezva-test-merchant"
}`}</pre>
        <ul>
          <li>
            Resolve body:{" "}
            <code>{`{ "type": "custom", "value": "rezva-test-merchant" }`}</code>
          </li>
          <li>
            Expected: <code>status: active</code>, Base Sepolia USDC destination
            (shared merchant wallet).
          </li>
          <li>
            In the mobile wallet: scan the QR from the Free API dashboard Test
            Merchant panel. In Rabby: paste the <code>value</code> or the JSON
            payload if your build accepts QR JSON.
          </li>
        </ul>
        <p className="docs-page-note">
          An active <code>bangla_qr</code> EMV string is also registered in the
          production DB and resolves with{" "}
          <code>{`{ "type": "bangla_qr", "value": "<emv-payload>" }`}</code>. Prefer
          the Test Merchant QR for the standard payment demo; use bangla_qr only
          when testing that identifier type.
        </p>
      </section>

      <section className="docs-page-section" id="email">
        <h2>Email</h2>
        <p>Active registry emails you can paste into Send:</p>
        <pre>{`{ "type": "email", "value": "test@test.com" }

# Also active (same resolve shape):
# prod-test-536563835@example.com
# probe-real2-ee6b4399@example.com`}</pre>
        <p>
          Expect <code>status: active</code> and at least one payment option.
          <code>test@test.com</code> maps to a Base Sepolia USDC destination in
          the live registry.
        </p>
      </section>

      <section className="docs-page-section" id="namespace">
        <h2>Namespace name</h2>
        <p>
          Active provider namespace name from <code>namespace_names</code>:
        </p>
        <pre>{`{ "value": "shahtab.rabby" }

# Typed form (inferred automatically from value):
{ "type": "provider_name", "value": "shahtab.rabby" }`}</pre>
        <ul>
          <li>Namespace slug: <code>rabby</code></li>
          <li>Destination: Base Sepolia USDC</li>
          <li>
            Expect <code>status: active</code> and{" "}
            <code>payment_ready: true</code>
          </li>
        </ul>
      </section>

      <section className="docs-page-section" id="unr">
        <h2>Blockchain name resolution</h2>
        <p>
          Universal Name Resolution uses the same <code>POST /v1/resolve</code>.
          Send only the name string. Do not register these in the Identifier
          Registry. Verified live samples (five per provider):
        </p>

        <h3>ENS (<code>.eth</code>)</h3>
        <pre>{`vitalik.eth
nick.eth
ens.eth
brantly.eth
luc.eth`}</pre>

        <h3>Base Names (<code>.base</code>)</h3>
        <pre>{`jesse.base
todd.base
colin.base
jacob.base
wilson.base`}</pre>

        <h3>Solana Name Service (<code>.sol</code>)</h3>
        <pre>{`bonfida.sol
solana.sol
serum.sol
mango.sol
dexlab.sol`}</pre>
        <p className="docs-page-note">
          SNS returns a Solana address. EVM-only Send UIs (for example Rabby)
          should show the resolved address and skip Pay when no compatible EVM
          option exists.
        </p>

        <h3>Unstoppable Domains</h3>
        <pre>{`brad.crypto
sandy.crypto
bitcoin.crypto
myetherwallet.crypto
sandy.nft`}</pre>

        <p>Example request:</p>
        <pre>{`curl -sS -X POST "$API/v1/resolve" \\
  -H "authorization: Bearer $REZVA_FREE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"value":"jesse.base"}'`}</pre>
        <p>
          Success responses include{" "}
          <code>trust.external_resolver.{"{ provider, namespace }"}</code> (optional
          for wallets) plus normal <code>payment_options</code>. See{" "}
          <Link href="/docs/for-wallets/api-reference">API Reference</Link>.
        </p>
      </section>

      <section className="docs-page-section" id="checklist">
        <h2>Wallet checklist</h2>
        <ol>
          <li>Paste or scan each fixture above.</li>
          <li>
            Confirm the wallet calls Rezva <code>/v1/resolve</code> for name-like
            pastes (not a local-only ENS short-circuit for payment).
          </li>
          <li>
            Show chain, asset, and recipient before signing. For Test Merchant /
            email / namespace, complete a small Base Sepolia USDC transfer if your
            build supports it.
          </li>
          <li>
            Treat 404 as “no payment destination”, 429 as rate limit, 502 as upstream naming
            RPC failure (retry later).
          </li>
        </ol>
        <div className="docs-page-note">
          <p>
            Full Free API payment walkthrough:{" "}
            <Link href="/docs/dashboard/free-api">Free API and Test Merchant</Link>.
          </p>
          <Link className="docs-wallets-link" href="/dashboard/free-api">
            Open Free API testing
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardBusinessTrack() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Business / Users track</h1>
      <p className="docs-page-lede">
        For merchants, operators, individual users, and organizations that need
        to register protocol identifiers and payment destinations.
      </p>

      <h2>Apply</h2>
      <p>
        Open <Link href="/dashboard/business/apply">/dashboard/business/apply</Link>{" "}
        and submit the application. Businesses and normal users use the same
        track. The application is associated with the authenticated dashboard
        user and is reviewed by an operator.
      </p>

      <h2>Lifecycle</h2>
      <pre>{`not applied → submitted → under review → approved
                                      ↘ rejected → reapply`}</pre>
      <p>
        Before approval, management routes remain locked. After approval,
        claim one Profile / Name, then register identifiers and destinations.
        Compatible wallets that integrate Rezva resolve can look those
        identifiers up and pay the destinations you set.
      </p>

      <h2>Identifier limit (dashboard)</h2>
      <ul>
        <li>
          Dashboard Business / Users accounts can register up to{" "}
          <strong>2 identifiers</strong>.
        </li>
        <li>
          Identifiers already registered before this limit stay active (they are
          not deleted). New dashboard registrations stop once the account is at
          or above the limit.
        </li>
        <li>
          Wallet providers that offer Merchant Setup set their own
          per-controller identifier limits when registering through their API —
          see{" "}
          <Link href="/docs/for-merchants/register-an-identifier">
            Register an identifier
          </Link>
          .
        </li>
      </ul>

      <h2>Available after approval</h2>
      <ul>
        <li>Profile / Name</li>
        <li>Identifiers</li>
        <li>Payment Destinations</li>
        <li>Activity</li>
        <li>Complaints</li>
        <li>Settings</li>
      </ul>

      <div className="docs-page-note">
        <p>
          Controllers may also register through an approved wallet with Resolver
          + Merchant Setup. Dashboard complaints route to the durable operator queue.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/business/apply">
          Business / Users application
        </Link>
      </div>
    </div>
  );
}

function DashboardProviderTrack() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Wallet provider track</h1>
      <p className="docs-page-lede">
        For wallets and platforms that want production resolution access.
        Companies, individual developers, and organizations can apply.
      </p>

      <h2>Apply and approval</h2>
      <p>
        <Link href="/dashboard/provider/apply">/dashboard/provider/apply</Link>{" "}
        is the application entry point. Provider API keys, namespaces, and
        production tooling stay locked until operator approval.
      </p>
      <pre>{`submitted → under review → approved
                     ↘ rejected → reapply`}</pre>

      <h2>Provider workflow</h2>
      <ol>
        <li>Submit the provider application and describe your wallet integration.</li>
        <li>
          After approval, create a <strong>provider API key</strong> under{" "}
          <Link href="/dashboard/provider/api-keys">API keys</Link> — not a Free
          API key from <Link href="/dashboard/free-api">/dashboard/free-api</Link>.
        </li>
        <li>Use the key for resolver traffic from your protected runtime.</li>
        <li>
          Choose resolver-only or resolver-plus-merchant-setup integration. If
          you offer Merchant Setup, document and enforce your own
          per-controller identifier limits (independent of the dashboard’s
          2-identifier cap).
        </li>
        <li>Use namespaces only for names owned by your provider.</li>
      </ol>

      <h2>Dashboard modules</h2>
      <ul>
        <li>Overview</li>
        <li>Integration</li>
        <li>API Keys</li>
        <li>API Usage</li>
        <li>Webhooks</li>
        <li>Sandbox</li>
        <li>Namespaces</li>
        <li>Settings</li>
      </ul>

      <div className="docs-page-note">
        <p>
          Provider credentials authorize resolution and optional merchant-setup
          facilitation. Approved providers can also manage their own namespaces;
          they never replace controller authorization for registry mutations.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/provider/apply">
          Provider application
        </Link>
      </div>
    </div>
  );
}

function ProviderNamespacesDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Provider namespaces</h1>
      <p className="docs-page-lede">
        Approved wallet providers can operate a namespace such as{" "}
        <code>.redotpay</code> and register names like{" "}
        <code>alice.redotpay</code>.
      </p>

      <h2>Example</h2>
      <pre>{`namespace: redotpay
name:      alice.redotpay
resolver:  { type: "provider_name", value: "alice.redotpay" }`}</pre>

      <h2>What Rezva stores</h2>
      <ul>
        <li>Namespace slug, status, description, and registration policy</li>
        <li>Names, payment destinations, authorization references, and status history</li>
        <li>Aggregate usage metrics, never provider customer records</li>
      </ul>

      <h2>Provider workflow</h2>
      <ol>
        <li>Apply from the provider dashboard.</li>
        <li>Wait for operator approval.</li>
        <li>Submit a namespace and wait for its activation.</li>
        <li>Check label availability, then register and manage names.</li>
        <li>Resolve names through the normal provider-authorized resolver.</li>
      </ol>

      <div className="docs-page-note">
        <p>
          Providers own checkout, pricing, accounts, and customer data. Rezva
          supplies registry metadata, authorization boundaries, and resolution.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/provider/namespaces">
          Open provider namespaces
        </Link>
      </div>
    </div>
  );
}

function NamespaceApiDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Namespace API</h1>
      <p className="docs-page-lede">
        Namespace management requires an approved provider API key. Name
        mutations remain scoped to the authenticated provider’s namespace.
      </p>

      <h2>Authentication</h2>
      <pre>{`Authorization: Bearer <approved-provider-key>
Content-Type: application/json`}</pre>
      <p>
        Free API keys cannot create or manage namespaces. The provider must be
        approved before namespace requests are accepted.
      </p>

      <h2>Submit a namespace</h2>
      <pre>{`POST /v1/namespaces

{
  "slug": "redotpay",
  "description": "RedotPay wallet names",
  "registration_policy": "provider_managed",
  "reserved_names": ["support", "admin"]
}`}</pre>
      <pre>{`{
  "slug": "redotpay",
  "provider_id": "provider_123",
  "status": "submitted",
  "registration_policy": "provider_managed",
  "reserved_names": ["support", "admin"]
}`}</pre>

      <h2>Register and resolve a name</h2>
      <pre>{`POST /v1/namespaces/redotpay/names

{
  "label": "alice",
  "controller_ref": "customer_42",
  "chain": "base",
  "asset": "USDC",
  "address": "0xRecipient…"
}`}</pre>
      <p>
        The namespace must be <code>active</code>. Check availability before
        registering a label and treat a <code>409</code> response as a conflict.
        The full name is resolved through the normal resolver:
      </p>
      <pre>{`POST /v1/resolve
Authorization: Bearer <approved-provider-key>

{ "type": "provider_name", "value": "alice.redotpay" }`}</pre>

      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /v1/namespaces</code> - list your namespaces</li>
        <li><code>POST /v1/namespaces</code> - submit a namespace</li>
        <li><code>GET /v1/namespaces/:namespace</code> - read namespace names and usage</li>
        <li><code>GET /v1/namespaces/:namespace/usage</code> - read aggregate usage</li>
        <li><code>GET /v1/namespaces/:namespace/names/:label/availability</code> - check a label</li>
        <li><code>POST /v1/namespaces/:namespace/names</code> - register a name</li>
        <li><code>GET/PATCH/DELETE /v1/namespaces/:namespace/names/:label</code> - manage a name</li>
      </ul>

      <h2>Update and remove</h2>
      <pre>{`PATCH /v1/namespaces/redotpay/names/alice

{
  "chain": "base",
  "asset": "USDC",
  "address": "0xNewRecipient…"
}`}</pre>
      <p>
        Use <code>DELETE</code> to mark a name removed. Keep provider customer
        records outside Rezva; the API stores registry metadata and aggregate
        usage, not wallet account data.
      </p>

      <h2>Resolution behavior</h2>
      <p>
        A successful provider-name resolution returns an active,
        payment-ready response when the name has a usable destination. Missing,
        removed, or destination-less names return an error or no payable
        option. Always apply the same wallet gating rules as other identifiers.
      </p>

      <div className="docs-page-note">
        <p>Use the SDK for request formatting and consistent API error handling.</p>
        <Link className="docs-wallets-link" href="/docs/for-wallets/integration">
          Wallet integration
        </Link>
      </div>
    </div>
  );
}

function MerchantComplaintsDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Complaints</h1>
      <p className="docs-page-lede">
        Approved businesses can report impersonation, unauthorized identifiers,
        payment-destination abuse, or trademark disputes.
      </p>

      <h2>API request</h2>
      <pre>{`POST /v1/complaints
Authorization: Bearer <approved-provider-key>
Content-Type: application/json

{
  "target_type": "phone",
  "target_value": "+15551234567",
  "reason": "impersonation",
  "description": "This identifier is being used to impersonate our business.",
  "evidence": ["https://example.com/evidence"]
}`}</pre>
      <p>
        The API returns <code>201</code> with a complaint record. A complaint
        must identify an existing mapping and the description must contain
        enough detail for review.
      </p>
      <h2>Dashboard workflow</h2>
      <ol>
        <li>Open Business → Complaints after business approval.</li>
        <li>Enter a target as <code>type:value</code>.</li>
        <li>Provide a concise reason, description, and relevant evidence.</li>
        <li>Track <code>SUBMITTED</code>, <code>UNDER_REVIEW</code>, <code>RESOLVED</code>, or <code>REJECTED</code>.</li>
      </ol>

      <div className="docs-page-note">
        <p>
          Complaints are stored durably in the registry and routed to the
          operator review queue. Reporter history is scoped to the authenticated
          dashboard user.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/business/complaints">
          Open complaints
        </Link>
      </div>
    </div>
  );
}

function MerchantGettingStarted() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Getting started</h1>
      <p className="docs-page-lede">
        Controllers (businesses or individual users) register identifiers through
        the official dashboard Business / Users track or through an approved
        partner wallet that offers Merchant Setup. Once registered, any
        compatible wallet that integrates Rezva resolve can look up those
        identifiers.
      </p>

      <h2>Dashboard path</h2>
      <ol>
        <li>Open <Link href="/dashboard">/dashboard</Link> and connect the controller wallet.</li>
        <li>Apply under Business / Users at <Link href="/dashboard/business/apply">/dashboard/business/apply</Link>.</li>
        <li>Wait for application approval.</li>
        <li>Claim one Profile / Name.</li>
        <li>Register up to 2 identifiers and payment destinations.</li>
        <li>Wait for activation before accepting payment.</li>
      </ol>

      <h2>API path (approved wallet providers)</h2>
      <p>
        An approved provider wallet can perform the same controller-owned
        operations through the Registry API. It must send both provider
        authentication and controller authorization. Providers that offer this
        feature define their own rules for how many identifiers a controller may
        register (the dashboard 2-identifier cap does not apply to provider API
        flows).
      </p>
      <pre>{`GET  /v1/identifier-types
GET  /v1/identifiers/:type/:value/availability
POST /v1/identifiers
GET  /v1/identifiers/:id
PATCH /v1/identifiers/:id
DELETE /v1/identifiers/:id`}</pre>
      <div className="docs-page-note">
        <p>
          Application submission and Privy wallet authentication are connected.
          Registry mutations unlock after Business / Users approval.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/business/apply">
          Open Business / Users apply
        </Link>
      </div>
    </div>
  );
}

function WalletQuickstart() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>Quickstart</h1>
      <p className="docs-page-lede">
        Build the smallest working wallet integration: scan a QR, resolve its
        identifier, show a verified destination, and hand payment execution to
        the wallet.
      </p>

      <h2>1. Choose credentials</h2>
      <ul>
        <li>Prototype: generate a Free API key at <Link href="/dashboard/free-api">/dashboard/free-api</Link>.</li>
        <li>Production: apply as a provider at <Link href="/dashboard/provider/apply">/dashboard/provider/apply</Link> and wait for approval.</li>
        <li>
          Or try a ready client:{" "}
          <strong>Mobile wallet</strong>{" "}
          <a
            href="https://github.com/shahtab123/mobilewallet_rezva"
            target="_blank"
            rel="noreferrer"
          >
            github.com/shahtab123/mobilewallet_rezva
          </a>
          {" · "}
          <strong>Rabby (Chrome)</strong>{" "}
          <a
            href="https://github.com/shahtab123/rabby_chrome_rezva"
            target="_blank"
            rel="noreferrer"
          >
            github.com/shahtab123/rabby_chrome_rezva
          </a>
          .
        </li>
      </ul>
      <pre>{`npm install @universal-payment/sdk`}</pre>

      <h2>2. Resolve a test identifier</h2>
      <pre>{`import { ResolverClient } from "@universal-payment/sdk";

const resolver = new ResolverClient({
  baseUrl: process.env.REZVA_API_BASE_URL!,
  apiKey: process.env.REZVA_FREE_API_KEY!,
});

const result = await resolver.resolve({
  type: "custom",
  value: "rezva-test-merchant",
});

if (result.status !== "active" || !result.payment_ready) {
  throw new Error(\`Identifier is not payable: \${result.status}\`);
}`}</pre>

      <h2>3. Select and display a destination</h2>
      <pre>{`const option = result.payment_options.find(
  (item) =>
    item.chain === "base" &&
    item.asset === "USDC" &&
    item.network_identifier === "eip155:84532" &&
    item.payment_ready,
);

if (!option) throw new Error("No Base Sepolia USDC option");
renderConfirmation({
  chain: option.chain,
  asset: option.asset,
  tokenContract: option.token_contract,
  recipient: option.address,
});`}</pre>

      <h2>4. Execute in the wallet</h2>
      <ol>
        <li>Ask the user to confirm chain, asset, amount, and recipient.</li>
        <li>Call the wallet’s existing ERC-20 transfer flow.</li>
        <li>Wait for the receipt and show the transaction hash.</li>
        <li>Never mark a payment successful from an unconfirmed client event.</li>
      </ol>
      <div className="docs-page-note">
        <p>
          Continue with <Link href="/docs/for-wallets/integration">Integration</Link>{" "}
          for QR parsing and production behavior, or{" "}
          <Link href="/docs/dashboard/free-api">run the shared Test Merchant flow</Link>{" "}
          with real Base Sepolia testnet funds.
        </p>
      </div>
    </div>
  );
}

function WalletSdkDocs() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>SDKs and integration recipes</h1>
      <p className="docs-page-lede">
        The workspace SDK wraps the same HTTP contract used by the resolver and
        registry. Use it for typed TypeScript calls; Python integrations can
        use the stable HTTP API directly.
      </p>

      <h2>Install</h2>
      <pre>{`npm install @universal-payment/sdk`}</pre>

      <h2>TypeScript resolver</h2>
      <pre>{`import { ProtocolApiError, ResolverClient } from "@universal-payment/sdk";

const resolver = new ResolverClient({
  baseUrl: process.env.REZVA_API_BASE_URL!,
  apiKey: process.env.REZVA_FREE_API_KEY!,
});

try {
  const result = await resolver.resolve({
    type: "custom",
    value: "rezva-test-merchant",
  });
  const destination = result.payment_options.find((option) => option.payment_ready);
  if (result.status !== "active" || !destination) {
    throw new Error("No payable destination");
  }
} catch (error) {
  if (error instanceof ProtocolApiError && error.status === 429) {
    // Retry after the server's Retry-After interval.
  }
  throw error;
}`}</pre>

      <h2>TypeScript registry client</h2>
      <pre>{`import { RegistryClient } from "@universal-payment/sdk";

const registry = new RegistryClient({
  baseUrl: process.env.REZVA_API_BASE_URL!,
  apiKey: process.env.REZVA_PROVIDER_API_KEY!,
  controllerWallet: process.env.CONTROLLER_WALLET!,
  controllerAuthorization: process.env.CONTROLLER_AUTHORIZATION!,
});

const availability = await registry.getIdentifierAvailability(
  "email",
  "pay@example.com",
);
if (availability.available) {
  await registry.registerIdentifier({
    type: "email",
    value: "pay@example.com",
    payment_options: [{
      chain: "base",
      asset: "USDC",
      address: "0xRecipient…",
      network_identifier: "eip155:8453",
    }],
  });
}`}</pre>

      <h2>Python / HTTP resolver</h2>
      <pre>{`import os, requests

response = requests.post(
    f"{os.environ['REZVA_API_BASE_URL']}/v1/resolve",
    headers={
        "content-type": "application/json",
        "authorization": f"Bearer {os.environ['REZVA_FREE_API_KEY']}",
    },
    json={"type": "custom", "value": "rezva-test-merchant"},
    timeout=10,
)
response.raise_for_status()
resolved = response.json()`}</pre>

      <h2>Python validation</h2>
      <pre>{`if resolved["status"] != "active" or not resolved["payment_ready"]:
    raise RuntimeError("Destination is not payment-ready")

option = next(
    item for item in resolved["payment_options"]
    if item["payment_ready"] and item["network_identifier"] == "eip155:84532"
)`}</pre>

      <h2>Optional resolve filters</h2>
      <p>
        Use these helpers when a wallet wants UNR only, registry only, TLD
        allowlists, or a local blocklist before calling the API. Omit the
        filter to keep open behavior.
      </p>
      <pre>{`import {
  ResolverClient,
  shouldAcceptPaste,
  evaluatePasteFilter,
  resolvePaste,
} from "@universal-payment/sdk";

const client = new ResolverClient({
  baseUrl: process.env.REZVA_API_BASE_URL!,
  apiKey: process.env.REZVA_PROVIDER_API_KEY!,
});

const filter = {
  unr: true,
  registry: false,
  allowNamespaces: [".eth", ".base"],
  blocklist: ["spam.eth"],
};

if (shouldAcceptPaste(pasted, filter)) {
  const result = await client.resolvePaste(pasted);
  // …show payment_options
} else {
  const denied = evaluatePasteFilter(pasted, filter);
  // denied.reason: unr_disabled | registry_disabled | blocklist | …
}`}</pre>
      <p>
        The same rules can be enforced server-side with provider{" "}
        <code>resolve_policy</code>. See{" "}
        <Link href="/docs/for-wallets/api-reference">API Reference</Link>.
      </p>

      <h2>Complete wallet flow</h2>
      <ol>
        <li>Scan the QR and extract its resolver URL, type, and value.</li>
        <li>Resolve the identifier and require an active, payment-ready response.</li>
        <li>Display the selected chain, asset, token contract, and destination.</li>
        <li>Execute the transaction in the wallet after user confirmation.</li>
        <li>Wait for chain confirmation and show the transaction hash.</li>
      </ol>
      <div className="docs-page-note">
        <p>
          The SDK does not sign or broadcast transactions. Use the{" "}
          <a href="/openapi.json">OpenAPI specification</a> when generating a
          client in another language.
        </p>
        <Link className="docs-wallets-link" href="/dashboard/free-api">
          Open Free API testing
        </Link>
      </div>
    </div>
  );
}

function ChangelogPage() {
  return (
    <div className="docs-page">
      <h1>Changelog</h1>
      <p className="docs-page-lede">Product and documentation changes.</p>
      <h2>2026-10-11</h2>
      <ul>
        <li>
          Business / Users dashboard identifier registrations capped at 2 per
          controller. Existing identifiers remain active; new dashboard creates
          are blocked at the limit. Wallet providers with Merchant Setup keep
          their own per-controller limits.
        </li>
      </ul>
      <h2>2026-09-21</h2>
      <ul>
        <li>
          Optional provider <code>resolve_policy</code> and SDK{" "}
          <code>shouldAcceptPaste</code> helpers for UNR / registry filters and
          blocklists (default remains open).
        </li>
      </ul>
      <h2>2026-08-29</h2>
      <ul>
        <li>
          Added provider namespaces, namespace API documentation, and complaint
          reporting guidance.
        </li>
        <li>
          Connected dashboard applications, registry management, and operator
          review to durable backend workflows.
        </li>
      </ul>
      <h2>2026-08-26</h2>
      <ul>
        <li>
          Added shared dashboard console with independent Business and Wallet
          Provider application tracks
        </li>
        <li>
          Documented dashboard IA in product and technical docs (
          <code>06-dashboard-console.md</code>,{" "}
          <code>technical/07-dashboard.md</code>)
        </li>
        <li>
          Initial dashboard scaffold and application-track documentation
        </li>
      </ul>
    </div>
  );
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;

  if (!slug?.length) {
    redirect("/docs/introduction/overview");
  }

  const meta = getDocMeta(slug);

  if (!meta) {
    notFound();
  }

  if (meta?.href === "/docs/introduction/how-it-works") {
    return <HowItWorksPage />;
  }
  if (meta?.href === "/docs/introduction/overview") {
    return <IntroductionOverview />;
  }
  if (meta?.href === "/docs/introduction/user-experience") {
    return <UserExperienceDocs />;
  }

  if (meta?.href === "/docs/reference/compatible-wallets") {
    return (
      <div className="docs-page docs-page-technical">
        <h1>Compatible wallets</h1>
        <p className="docs-page-lede">
          Rezva is wallet-agnostic. Production-approved wallets will appear here
          after operator review. Until then, use these open-source reference
          clients to test identifier resolve and Base Sepolia payments with a
          Free API key.
        </p>
        <CompatibleWalletsList />
        <h2>Reference clients</h2>
        <ul>
          <li>
            <strong>Mobile wallet:</strong>{" "}
            <a
              href="https://github.com/shahtab123/mobilewallet_rezva"
              target="_blank"
              rel="noreferrer"
            >
              https://github.com/shahtab123/mobilewallet_rezva
            </a>{" "}
            - Expo / Android wallet with Send + QR scan.
          </li>
          <li>
            <strong>Rabby (Chrome):</strong>{" "}
            <a
              href="https://github.com/shahtab123/rabby_chrome_rezva"
              target="_blank"
              rel="noreferrer"
            >
              https://github.com/shahtab123/rabby_chrome_rezva
            </a>{" "}
            - Rabby clone with Rezva in Send.
          </li>
        </ul>
        <p>
          Follow each repo README for install, API key, and local vs production
          base URL. Pair with the{" "}
          <Link href="/docs/dashboard/free-api">Free API and Test Merchant</Link>{" "}
          guide and the{" "}
          <Link href="/docs/dashboard/testing-guide">Testing guide</Link>{" "}
          (email, namespace, QR, and five names per ENS / Base / SNS / Unstoppable).
        </p>
        <h2>What compatibility means</h2>
        <ol>
          <li>Extract a typed identifier from QR or manual input.</li>
          <li>Send the identifier to <code>POST /v1/resolve</code>.</li>
          <li>Check lifecycle status and select a compatible payment option.</li>
          <li>Show the final recipient and network before signing.</li>
          <li>Wait for the wallet and chain to confirm the transaction.</li>
        </ol>
        <pre>{`const result = await resolver.resolve({ type, value });
if (result.status !== "active" || !result.payment_ready) {
  throw new Error("Identifier is not payable");
}`}</pre>
        <div className="docs-page-note">
          <p>
            Want your wallet listed as production-approved? Apply as a wallet
            provider through the dashboard, then complete operator review.
          </p>
          <Link className="docs-wallets-link" href="/dashboard/provider/apply">
            Apply as wallet provider
          </Link>
        </div>
      </div>
    );
  }

  if (meta?.href === "/docs/dashboard/console-overview") {
    return <DashboardConsoleOverview />;
  }
  if (meta?.href === "/docs/dashboard/business-track") {
    return <DashboardBusinessTrack />;
  }
  if (meta?.href === "/docs/dashboard/wallet-provider-track") {
    return <DashboardProviderTrack />;
  }
  if (meta?.href === "/docs/dashboard/provider-namespaces") {
    return <ProviderNamespacesDocs />;
  }
  if (meta?.href === "/docs/dashboard/free-api") {
    return <FreeApiDocs />;
  }
  if (meta?.href === "/docs/dashboard/testing-guide") {
    return <TestingGuideDocs />;
  }
  if (meta?.href === "/docs/for-merchants/getting-started") {
    return <MerchantGettingStarted />;
  }
  if (meta?.href === "/docs/for-merchants/register-an-identifier") {
    return <MerchantRegisterIdentifierDocs />;
  }
  if (meta?.href === "/docs/for-merchants/manage-identifiers") {
    return <MerchantManageIdentifiersDocs />;
  }
  if (meta?.href === "/docs/for-merchants/payment-destinations") {
    return <MerchantPaymentDestinationsDocs />;
  }
  if (meta?.href === "/docs/for-wallets/quickstart") {
    return <WalletQuickstart />;
  }
  if (meta?.href === "/docs/for-wallets/integration") {
    return <WalletIntegrationDocs />;
  }
  if (meta?.href === "/docs/for-wallets/authentication") {
    return <WalletAuthenticationDocs />;
  }
  if (meta?.href === "/docs/for-wallets/api-reference") {
    return <WalletApiReferenceDocs />;
  }
  if (meta?.href === "/docs/for-wallets/merchant-setup") {
    return <WalletMerchantSetupDocs />;
  }
  if (meta?.href === "/docs/for-wallets/sdks") {
    return <WalletSdkDocs />;
  }
  if (meta?.href === "/docs/for-wallets/namespace-api") {
    return <NamespaceApiDocs />;
  }
  if (meta?.href === "/docs/for-merchants/complaints") {
    return <MerchantComplaintsDocs />;
  }
  if (meta?.href === "/docs/protocol/specification") {
    return <ProtocolSpecificationDocs />;
  }
  if (meta?.href === "/docs/protocol/identifier-registry") {
    return <IdentifierRegistryDocs />;
  }
  if (meta?.href === "/docs/protocol/identifier-types") {
    return <IdentifierTypesDocs />;
  }
  if (meta?.href === "/docs/protocol/security") {
    return <SecurityDocs />;
  }
  if (meta?.href === "/docs/reference/errors") {
    return <ErrorsDocs />;
  }
  if (meta?.href === "/docs/reference/statuses") {
    return <StatusesDocs />;
  }
  if (meta?.href === "/docs/reference/changelog") {
    return <ChangelogPage />;
  }

  return (
    <div className="docs-page">
      <h1>{meta.title}</h1>
    </div>
  );
}
