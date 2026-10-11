import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Coins,
  CreditCard,
  Globe2,
  IdCard,
  Mail,
  Phone,
  QrCode,
  SlidersHorizontal,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { BaseMark } from "@/components/BaseMark";
import { FinalCta } from "@/components/FinalCta";
import { HomeFeaturesSection } from "@/components/HomeFeaturesSection";
import { homeDisplay, homeSans } from "@/components/HomePaperFonts";
import { LoginToIntegrateButton } from "@/components/LoginToIntegrateButton";
import { ProductDemo } from "@/components/ProductDemo";
import { regionalQrExamples } from "@/components/RegionalQrLogos";
import { SiteHeader } from "@/components/SiteHeader";
import { WalletIntegrationPanel } from "@/components/WalletIntegrationPanel";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const identifiers: Array<{ icon: LucideIcon; label: string; hint: string }> = [
  { icon: Phone, label: "Phone", hint: "Numbers people already save" },
  { icon: QrCode, label: "QR code", hint: "National payment QR strings" },
  { icon: Mail, label: "Email", hint: "Inboxes customers know" },
  { icon: Globe2, label: "Universal Name Resolution", hint: "ENS, Base, SNS, Unstoppable names" },
  { icon: Tag, label: "Wallet name", hint: "Names like coffee.rabby" },
  { icon: SlidersHorizontal, label: "Custom", hint: "Your own identifier type" },
];

const trustChecks = [
  {
    step: "01",
    title: "Who",
    body: "a clear shop or brand name, not a random address",
  },
  {
    step: "02",
    title: "How you found them",
    body: "phone, email, QR, or a wallet name like coffee.rabby",
  },
  {
    step: "03",
    title: "How to pay",
    body: "currency and network your wallet supports",
  },
  {
    step: "04",
    title: "Where it goes",
    body: "the receiving address, with a warning if it changed recently",
  },
];

const identifierSources: Array<{
  icon: LucideIcon;
  title: string;
  value: string;
}> = [
  { icon: Phone, title: "Phone identifier", value: "+880 1840 123456" },
  { icon: QrCode, title: "QR payload", value: "000201… Bangla QR" },
  { icon: IdCard, title: "Merchant identifier", value: "ABC-19384" },
  { icon: Mail, title: "Email identifier", value: "pay@shop.com" },
  { icon: Tag, title: "Namespace name", value: "coffee.rabby" },
  { icon: Globe2, title: "UNR", value: "vitalik.eth" },
];

const resolverStages = [
  ["1", "Normalize", "Convert the raw input into a standard form"],
  [
    "2",
    "Resolve",
    "Find the mapping in the registry, or via Universal Name Resolution",
  ],
  ["3", "Verify", "Confirm the destination is ready to receive funds"],
  ["4", "Return", "Hand payment destinations back to the wallet"],
];

const paymentOptions: Array<{
  icon: LucideIcon;
  asset: string;
  network: string;
}> = [
  { icon: CircleDollarSign, asset: "USDC", network: "Base" },
  { icon: Coins, asset: "USDC", network: "Ethereum" },
  { icon: CreditCard, asset: "USDT", network: "Arbitrum" },
];

export default function Home() {
  return (
    <div className={`site-shell home-editorial ${homeDisplay.variable} ${homeSans.variable}`}>
      <SiteHeader />

      <main>
        <section className="hero" id="top">
          <div className="hero-main section-grid">
            <div className="hero-scraps" aria-hidden="true">
              <span className="hero-scrap hero-scrap-a" />
              <span className="hero-scrap hero-scrap-c">R</span>
            </div>

            <div className="hero-copy">
              <p className="eyebrow">
                <span className="live-dot" />
                Rezva
              </p>
              <h1>Use familiar identifiers to send crypto.</h1>
              <p className="hero-lede">
                Register phone numbers, emails, QR codes, and other identifiers
                with Rezva, or use names you already own from supported naming
                systems like ENS, SNS, and Unstoppable Domains. Rezva resolves
                them to the right payment destination for compatible wallets.
              </p>
              <div className="button-row">
                <LoginToIntegrateButton showArrow label="Integrate" />
              </div>
            </div>

            <ProductDemo />
          </div>

          <a
            className="hero-base-badge"
            href="https://www.base.org"
            target="_blank"
            rel="noreferrer"
          >
            <BaseMark size={16} />
            <span>Currently testing on Base</span>
          </a>

          <div className="home-disclaimer" aria-label="Disclaimer">
            <div className="home-disclaimer-inner">
              <p className="home-disclaimer-label">Disclaimer</p>
              <div className="home-disclaimer-copy">
                <p>
                  Identifiers are used only for
                  resolution. Rezva does not process, receive, or modify payments
                  through the original payment service. The crypto payment is
                  handled separately by the compatible wallet.
                </p>
              </div>
            </div>
          </div>

          <div className="signal-bar" aria-label="How payment works">
            <span>Enter a name or QR</span>
            <i />
            <span>See the merchant</span>
            <i />
            <span>Pick how to pay</span>
            <i />
            <span>Confirm in your wallet</span>
            <i />
            <span>Payment settles onchain</span>
          </div>
        </section>

        <HomeFeaturesSection />

        <section className="section how-section" id="resolution">
          <div className="how-section-inner">
            <div className="section-intro">
              <p className="section-number">02 / How it works</p>
              <h2>Identifier in. Destination out.</h2>
              <p>
                When a wallet has an identifier, it asks Rezva to resolve it.
                Rezva normalizes the value, finds the active mapping in the
                registry or through Universal Name Resolution (UNR) for names
                like <code>vitalik.eth</code>, checks that the destination can
                receive funds, and returns payment destinations. The wallet
                picks a network and asset, then signs and sends the transfer
                itself.
              </p>
            </div>

            <div className="resolution-canvas">
              <span className="paper-brad paper-brad-tl" aria-hidden="true" />
              <span className="paper-brad paper-brad-tr" aria-hidden="true" />
              <div className="canvas-header">
                <div>
                  <span className="canvas-live" />
                  <strong>Resolution path</strong>
                </div>
                <code>coffee.rabby</code>
              </div>

              <div className="resolution-workspace">
                <div className="source-cloud">
                  <p>Identifier input</p>
                  <div className="source-cloud-grid">
                    {identifierSources.map(({ icon: Glyph, title, value }) => (
                      <article key={title}>
                        <span className="line-icon" aria-hidden="true">
                          <Glyph size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                          <strong>{title}</strong>
                          <small>{value}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="canonical-preview">
                    <small>Resolved as</small>
                    <code>coffee.rabby</code>
                  </div>
                </div>

                <div className="canvas-arrow">
                  <span>resolve</span>
                  <i />
                  <Arrow />
                </div>

                <div className="rezva-engine">
                  <div className="engine-brand">
                    <div>
                      <small>Rezva registry</small>
                      <strong>Normalize · resolve · verify</strong>
                    </div>
                    <b>OK</b>
                  </div>

                  <div className="stage-rail">
                    {resolverStages.map(([number, title, copy]) => (
                      <article key={number}>
                        <span>{number}</span>
                        <div>
                          <strong>{title}</strong>
                          <small>{copy}</small>
                        </div>
                        <b className="line-icon" aria-hidden="true">
                          <BadgeCheck size={16} strokeWidth={1.75} />
                        </b>
                      </article>
                    ))}
                  </div>

                  <div className="engine-state">
                    <div>
                      <small>Mapping status</small>
                      <strong>Active</strong>
                    </div>
                    <div>
                      <small>Destination ready</small>
                      <strong>Yes</strong>
                    </div>
                    <div>
                      <small>Last destination change</small>
                      <strong>6 months ago</strong>
                    </div>
                  </div>
                </div>

                <div className="canvas-arrow">
                  <span>destinations</span>
                  <i />
                  <Arrow />
                </div>

                <div className="resolution-result">
                  <div className="result-heading">
                    <div>
                      <small>Returned to wallet</small>
                      <strong>3 payment destinations</strong>
                    </div>
                    <span>Ready</span>
                  </div>
                  <div className="result-options">
                    {paymentOptions.map(({ icon: Glyph, asset, network }, index) => (
                      <article className={index === 0 ? "recommended" : ""} key={`${asset}-${network}`}>
                        <span className="line-icon" aria-hidden="true">
                          <Glyph size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                          <strong>{asset}</strong>
                          <small>{network}</small>
                        </div>
                        {index === 0 ? <b>Preferred</b> : null}
                      </article>
                    ))}
                  </div>
                  <div className="wallet-handoff">
                    <div>
                      <small>Wallet action</small>
                      <strong>Select destination, sign, send</strong>
                    </div>
                    <Arrow />
                  </div>
                </div>
              </div>

              <div className="canvas-telemetry">
                <div>
                  <span>Speed</span>
                  <small>Resolution usually under 100ms</small>
                </div>
                <div>
                  <span>Identity</span>
                  <small>Merchant profile included when available</small>
                </div>
                <div>
                  <span>Change alerts</span>
                  <small>Flagged if the destination moved recently</small>
                </div>
                <div>
                  <span>Custody</span>
                  <small>Private keys stay in the wallet</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="identifiers-section">
          <div className="identifiers-inner">
            <div className="identifiers-head section-intro">
              <p className="section-number">03 / What you can register</p>
              <h2>Use what people already know.</h2>
              <p>
                Register a phone, email, QR, or a wallet name like{" "}
                <strong>coffee.rabby</strong>. Compatible wallets can also
                resolve Universal Name Resolution names such as{" "}
                <strong>vitalik.eth</strong>. Customers type what they already
                know. Wallets look up where to send the money.
              </p>
            </div>

            <div className="identifier-type-grid">
              {identifiers.map(({ icon: Icon, label, hint }) => (
                <article key={label}>
                  <span className="identifier-type-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </article>
              ))}
            </div>

            <div className="identifier-qr-block">
              <div className="identifier-qr-copy">
                <p className="identifier-qr-label">Payment QR codes</p>
                <h3>Same sticker. Crypto wallets too.</h3>
                <p className="identifier-qr-lede">
                  Many countries already use one QR for banks and apps. You can
                  register that same QR with Rezva so crypto wallets can pay it
                  too - without a new sticker for every wallet.
                </p>
              </div>
              <div className="identifier-qr-grid">
                {regionalQrExamples.map(({ id, scheme, country, logoSrc, logoAlt, mono }) => (
                  <article key={id}>
                    <span className={`identifier-qr-logo${mono ? " is-mono" : ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoSrc} alt={logoAlt} />
                    </span>
                    <div>
                      <strong>{scheme}</strong>
                      <small>{country}</small>
                    </div>
                  </article>
                ))}
              </div>
              <p className="identifier-qr-note">
                Rezva is not partnered with or affiliated with these payment
                schemes or brands. Names and logos are shown only as examples of
                identifier types people already use.
              </p>
            </div>
          </div>
        </section>

        <section className="section wallets-section" id="integrate">
          <div className="page-content section-grid">
            <div className="section-intro">
              <p className="section-number">04 / Built for wallets</p>
              <h2>Add lookup. Keep everything else.</h2>
              <p>
                Your wallet still scans, builds, signs, and sends. Rezva only
                answers: where should this payment go?
              </p>
            </div>

            <WalletIntegrationPanel />
          </div>
        </section>

        <section className="protocol-section" id="protocol">
          <div className="page-content protocol-layout">
            <div className="protocol-editor" id="developers">
              <div className="editor-window-bar">
                <div className="editor-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="editor-title">resolve-payment.ts · Rezva</span>
                <span className="editor-version">v1</span>
              </div>
              <div className="editor-tab-bar" aria-hidden="true">
                <button type="button" className="editor-tab is-active" tabIndex={-1}>
                  <span className="editor-file-icon">TS</span>
                  resolve-payment.ts
                </button>
                <button type="button" className="editor-tab" tabIndex={-1}>
                  package.json
                </button>
              </div>
              <pre className="editor-code" tabIndex={0}>
                <code>
                  <span className="editor-line">
                    <span className="editor-ln">1</span>
                    <span>
                      <span className="syn-keyword">import</span>
                      {" { ResolverClient } "}
                      <span className="syn-keyword">from</span>{" "}
                      <span className="syn-string">&quot;@universal-payment/sdk&quot;</span>;
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">2</span>
                    <span />
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">3</span>
                    <span>
                      <span className="syn-keyword">const</span>
                      {" client = "}
                      <span className="syn-keyword">new</span>{" "}
                      <span className="syn-type">ResolverClient</span>
                      {"({"}
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">4</span>
                    <span>
                      {"  baseUrl: "}
                      <span className="syn-string">&quot;https://api.example.com&quot;</span>,
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">5</span>
                    <span>
                      {"  apiKey: process.env.REZVA_API_KEY,"}
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">6</span>
                    <span>{"});"}</span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">7</span>
                    <span />
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">8</span>
                    <span>
                      <span className="syn-keyword">const</span>
                      {" result = "}
                      <span className="syn-keyword">await</span>
                      {" client."}
                      <span className="syn-function">resolve</span>
                      {"({"}
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">9</span>
                    <span>
                      {"  type: "}
                      <span className="syn-string">&quot;provider_name&quot;</span>,
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">10</span>
                    <span>
                      {"  value: "}
                      <span className="syn-string">&quot;coffee.rabby&quot;</span>,
                    </span>
                  </span>
                  <span className="editor-line">
                    <span className="editor-ln">11</span>
                    <span>{"});"}</span>
                  </span>
                </code>
              </pre>
              <div className="editor-response">
                <div className="editor-response-meta">
                  <span className="response-dot" />
                  <strong>200</strong>
                  <small>42ms · application/json</small>
                </div>
                <pre className="editor-response-body">
                  <code>{`{
  "status": "active",
  "payment_ready": true,
  "profile": { "name": "Northwind Coffee" },
  "payment_options": [{
    "asset": "USDC",
    "chain": "base"
  }]
}`}</code>
                </pre>
              </div>
              <div className="editor-status-bar">
                <span>TypeScript</span>
                <span>UTF-8</span>
                <span>Ln 11</span>
              </div>
            </div>

            <div className="protocol-panel">
              <p className="section-number">05 / For builders</p>
              <h2>One simple lookup for wallets.</h2>
              <p className="protocol-description">
                Send a type and value. Get back whether it is ready to pay, who
                it belongs to, and which networks and coins work.
              </p>
              <div className="protocol-points">
                <span>Open docs</span>
                <span>Approved wallets in production</span>
                <span>You keep custody</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section trust-section" id="trust">
          <div className="page-content section-grid">
            <div className="section-intro">
              <p className="section-number">06 / Before you pay</p>
              <h2>See who you are paying.</h2>
              <p>
                Instead of pasting a long address, you look up a name people
                already use. Your wallet shows the shop, how they accept money,
                and where it goes - then you confirm.
              </p>
              <ol className="trust-checklist">
                {trustChecks.map(({ step, title, body }) => (
                  <li key={step}>
                    <span className="trust-checklist-step">{step}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="wallet-sheet" aria-label="Example wallet payment confirmation">
              <div className="wallet-sheet-phone">
                <div className="wallet-sheet-status" aria-hidden="true">
                  <span>9:41</span>
                  <span className="wallet-sheet-notch" />
                  <span>100%</span>
                </div>

                <div className="wallet-sheet-nav">
                  <span className="wallet-sheet-nav-back" aria-hidden="true">‹</span>
                  <strong>Send</strong>
                  <span className="wallet-sheet-source">Rezva</span>
                </div>

                <div className="wallet-sheet-hero">
                  <div className="wallet-sheet-merchant">
                    <span className="wallet-sheet-avatar" aria-hidden="true">N</span>
                    <div>
                      <strong>Northwind Coffee</strong>
                      <small>Verified shop name</small>
                    </div>
                  </div>
                  <p className="wallet-sheet-amount">
                    <strong>12.00</strong>
                    <span>USDC</span>
                  </p>
                  <em className="wallet-sheet-network">on Base</em>
                </div>

                <div className="wallet-sheet-rows">
                  <div className="wallet-sheet-row">
                    <span>Found as</span>
                    <p className="wallet-sheet-found">
                      <Tag size={14} strokeWidth={2} aria-hidden="true" />
                      <code>coffee.rabby</code>
                    </p>
                  </div>
                  <div className="wallet-sheet-row">
                    <span>To</span>
                    <code className="wallet-sheet-addr">0x742d…8Fa3</code>
                  </div>
                  <div className="wallet-sheet-row">
                    <span>Network</span>
                    <strong>Base</strong>
                  </div>
                  <div className="wallet-sheet-row">
                    <span>Asset</span>
                    <strong>USDC</strong>
                  </div>
                </div>

                <p className="wallet-sheet-warn" role="status">
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                  Destination updated 3 days ago — double-check before paying
                </p>

                <div className="wallet-sheet-actions">
                  <button type="button" className="wallet-sheet-btn" tabIndex={-1}>
                    Cancel
                  </button>
                  <button type="button" className="wallet-sheet-btn is-primary" tabIndex={-1}>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
    </div>
  );
}
