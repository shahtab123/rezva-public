import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import Link from "next/link";

export default function AboutPage() {
  return (
    <MarketingStaticPage
      eyebrow="Company"
      title="About Rezva"
      lede="Rezva is a shared payment identity and resolution layer, so wallets and payment apps can look up who you’re paying and where funds should go, without inventing a new proprietary address book each time."
    >
      <section>
        <h2>What we are</h2>
        <p>
          Rezva maps everyday payment identifiers (names, emails, phones, merchant IDs,
          payment links, QR codes, and custom strings) to crypto payment destinations that
          compatible wallets can resolve at send time.
        </p>
        <p>
          We are not a bank, exchange, or card processor. We do not move money on behalf of
          PayPal, Cash App, bKash, or any other rail. Rezva answers a lookup question: given
          this identifier, what destination should a compatible wallet use, and who does it
          represent?
        </p>
      </section>

      <section>
        <h2>What we build</h2>
        <p>
          A public registry and resolver for payment identifiers, a dashboard for businesses
          and wallet providers, and integration paths so apps can register identifiers and
          resolve destinations through the same shared layer.
        </p>
        <p>
          Operators review applications, manage protected names, and handle reports. Wallet
          providers connect through documented APIs and SDKs. Merchants and individuals
          register identifiers that map to destinations they control.
        </p>
        <p>
          Start with{" "}
          <Link href="/how-it-works">how it works</Link>,{" "}
          <Link href="/use-cases">use cases</Link>, or the{" "}
          <Link href="/docs/introduction/overview">protocol docs</Link>.
        </p>
      </section>

      <section>
        <h2>Who it’s for</h2>
        <p>
          <strong>Wallets and payment apps</strong> that want one resolution path for
          namespaced usernames, emails, phones, merchant IDs, links, and QR identifiers,
          instead of maintaining a closed lookup silo.
        </p>
        <p>
          <strong>Merchants and platforms</strong> that already show customers a familiar
          identifier (a shop name, invoice email, national QR, or payment link) and want
          compatible crypto wallets to resolve that same identifier to an onchain destination.
        </p>
        <p>
          <strong>Integrators</strong> building on Rezva via the{" "}
          <Link href="/integrate">integrate</Link> page and dashboard applications for
          business or provider tracks.
        </p>
      </section>

      <section>
        <h2>How to reach us</h2>
        <p>
          Partnerships, integrations, and operator questions go through{" "}
          <Link href="/contact">contact</Link>. Research and grant interest is outlined on{" "}
          <Link href="/grants">grants / research</Link>.
        </p>
      </section>

      <section className="static-page-disclaimer" aria-label="Disclaimer">
        <h2>Disclaimer</h2>
        <p>
          <strong>Important:</strong> Rezva identifiers are used only for resolution. Rezva
          does not process, receive, hold, settle, or modify payments through PayPal, Cash
          App, bank rails, national QR networks, or any other original payment service. When
          you pay with crypto, the transfer is created and confirmed inside a compatible
          wallet (or payment app) that integrates Rezva, not by Rezva itself.
        </p>
        <p>
          <strong>Not a payment rail.</strong> Registering or resolving an identifier does
          not mean Rezva operates that rail, endorses the linked merchant, guarantees
          delivery of goods or services, or replaces the terms of the destination network or
          asset you choose. National and brand payment systems (for example Bangla QR, SGQR,
          QRIS, PayPal links, Cash App links or QR codes) remain those systems; Rezva only
          stores and returns mapping data that wallets may use for lookup.
        </p>
        <p>
          <strong>Verify before you send.</strong> Always confirm the resolved display name,
          destination address or account, network, and asset in your wallet before signing.
          Rezva cannot reverse onchain transfers. Report suspicious or incorrect mappings via{" "}
          <Link href="/report">Report / Dispute</Link>.
        </p>
        <p>
          <strong>Identifier examples</strong> include names and usernames, email addresses,
          phone numbers, merchant IDs, payment links, QR code payloads, and free-form custom
          values when registered as such. Examples people often recognize: PayPal payment
          links, Cash App payment links or QR codes, bKash QR, Bangla QR, SGQR, QRIS, and
          similar merchant QR or link formats. Support depends on what has been registered
          and what a given wallet chooses to resolve.
        </p>
        <p>
          <strong>No affiliation implied.</strong> Mentions of third-party brands, apps, or
          national payment schemes are for illustration of identifier types only, unless we
          explicitly state a partnership. Rezva is independent of those services.
        </p>
        <p>
          <strong>Product status.</strong> Parts of the protocol, pricing, and operator
          policies are still being built. Registry data, resolver responses, and dashboard
          review flows may use evolving infrastructure. Production terms and privacy notices
          will continue to be updated on the{" "}
          <Link href="/terms">terms</Link> and <Link href="/privacy">privacy</Link> pages.
        </p>
      </section>
    </MarketingStaticPage>
  );
}
