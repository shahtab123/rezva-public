import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import Link from "next/link";

export default function TermsPage() {
  return (
    <MarketingStaticPage
      eyebrow="Legal"
      title="Terms of use"
      lede="These terms govern your use of the Rezva website, dashboard, APIs, SDKs, documentation, and related services (together, the “Services”). By accessing or using the Services, you agree to these terms."
    >
      <section>
        <h2>1. What Rezva is (and is not)</h2>
        <p>
          Rezva provides a payment identity registry and resolution layer. The
          Services help compatible wallets and applications look up identifiers
          (such as names, emails, phones, merchant IDs, payment links, QR
          payloads, provider namespace names, and custom values) and retrieve
          associated payment destination metadata.
        </p>
        <p>
          Rezva is not a bank, money transmitter, payment processor, custodian,
          exchange, broker, or escrow. Rezva does not receive, hold, settle,
          reverse, insure, or guarantee transfers of fiat or crypto. Rezva does
          not process payments through PayPal, Cash App, bKash, bank rails,
          national QR networks, card networks, or any other third-party payment
          service. Any crypto payment is created, signed, broadcast, and
          confirmed solely by you and/or a third-party wallet or payment app
          that chooses to integrate Rezva.
        </p>
      </section>

      <section>
        <h2>2. No affiliation with third-party brands or rails</h2>
        <p>
          Mentions of third-party brands, apps, wallets, merchants, or national
          payment schemes (including examples such as PayPal, Cash App, Rabby,
          Bangla QR, SGQR, QRIS, or bKash) are for illustration of identifier
          types or integration patterns only, unless we expressly state a
          written partnership. Those systems remain independent. Registering or
          resolving an identifier that resembles a third-party format does not
          mean Rezva operates, endorses, or is responsible for that system.
        </p>
      </section>

      <section>
        <h2>3. Eligibility and accounts</h2>
        <p>
          You must be able to form a binding contract under applicable law to
          use the Services. Dashboard access may use third-party authentication
          (including Privy). You are responsible for your credentials, API keys,
          wallet connections, and all activity under your account or keys. Notify
          us promptly of unauthorized access via <Link href="/contact">contact</Link>.
        </p>
        <p>
          Business and wallet-provider features may require an application and
          operator approval. Approval is discretionary, may be limited or
          revoked, and does not create a partnership, agency, employment, or
          joint-venture relationship with Rezva.
        </p>
      </section>

      <section>
        <h2>4. Registry content and your responsibilities</h2>
        <p>
          If you register, update, or control an identifier or destination, you
          represent and warrant that: (a) you have all rights needed to use that
          identifier and the linked destinations; (b) the mapping is accurate and
          not misleading; (c) you will not impersonate others, infringe
          trademarks, or register identifiers you do not control; and (d) you
          will keep destinations current and remove or suspend mappings you no
          longer control.
        </p>
        <p>
          Controllers, businesses, and providers are solely responsible for the
          truthfulness of registry data they submit. Rezva may store and return
          that data for resolution but does not independently verify every
          mapping for commercial fitness, legality of goods or services, or
          destination safety beyond protocol features such as review, suspension,
          cooldowns, or operator actions described in the documentation.
        </p>
      </section>

      <section>
        <h2>5. Wallets, integrators, and payments</h2>
        <p>
          Wallet providers and other integrators decide whether and how to call
          Rezva APIs, present resolve results, and allow users to send funds.
          You (and any wallet you use) must independently verify display names,
          destinations, networks, assets, amounts, and timing before signing or
          confirming any transfer. Onchain and other crypto transfers are
          typically irreversible. Rezva cannot cancel, reverse, refund, or
          recover funds sent to a wrong, outdated, suspended, or fraudulent
          destination.
        </p>
        <p>
          Free API, sandbox, and Test Merchant features are for development and
          evaluation. Production keys, rate limits, namespaces, and provider
          tooling may change as the protocol evolves.
        </p>
      </section>

      <section>
        <h2>6. Acceptable use</h2>
        <p>You may not use the Services to:</p>
        <p>
          (a) commit fraud, scams, money laundering, sanctions evasion, or other
          unlawful activity; (b) publish malware or attempt unauthorized access
          to Rezva systems; (c) abuse rate limits, scrape in a way that degrades
          the service, or resell access without permission; (d) submit false
          applications or evidence; (e) register identifiers or destinations
          intended to deceive payers; or (f) interfere with operator review,
          complaints, or safety actions.
        </p>
        <p>
          We may suspend identifiers, revoke access, reject applications, or
          take other protocol actions when we believe these terms or applicable
          law have been violated, or when safety requires it. Operator actions
          do not create an obligation to police all content or to compensate
          affected parties.
        </p>
      </section>

      <section>
        <h2>7. Reports and disputes</h2>
        <p>
          Impersonation, trademark, and unauthorized mapping concerns may be
          reported through the processes described on{" "}
          <Link href="/report">Report / Dispute</Link> and (where available) the
          dashboard complaints tools. Filing a report does not guarantee a
          particular outcome, timeline, or restoration of funds. Operator review
          of a complaint is not an admission of fault by Rezva and does not make
          Rezva a party to any dispute between you and a third party.
        </p>
      </section>

      <section>
        <h2>8. Intellectual property</h2>
        <p>
          Rezva retains rights in the Services, branding, documentation, and
          software we provide, subject to any open-source or SDK licenses that
          accompany specific components. You retain rights in content you
          submit, and you grant Rezva a worldwide license to host, process,
          display, and distribute that content as needed to operate the registry,
          resolver, dashboard, and related Services.
        </p>
      </section>

      <section>
        <h2>9. Third-party services</h2>
        <p>
          The Services may depend on third parties (for example authentication
          providers, cloud hosting, databases, blockchains, RPC providers, and
          wallet software). Those services have their own terms. Rezva is not
          responsible for outages, data handling, or losses caused by third
          parties or by blockchain networks.
        </p>
      </section>

      <section>
        <h2>10. Disclaimer of warranties</h2>
        <p>
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, REZVA DISCLAIMS ALL WARRANTIES, WHETHER
          EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. We do not warrant
          that registry data is complete, current, or error-free; that resolve
          responses will be uninterrupted; that any destination is safe to pay;
          or that the Services will meet your commercial requirements.
        </p>
        <p>
          Parts of pricing, protocol rules, and operator policy are still being
          built. Features may change, and environments may include incomplete or
          evolving infrastructure.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REZVA AND ITS OPERATORS,
          CONTRIBUTORS, AFFILIATES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
          DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR
          CRYPTO OR FIAT ASSETS, ARISING FROM OR RELATED TO THE SERVICES OR THESE
          TERMS, WHETHER BASED IN CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE,
          EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          Without limiting the above, Rezva is not liable for: mistaken or
          fraudulent payments; outdated or incorrect registry mappings submitted
          by controllers; wallet software bugs; user failure to verify resolve
          results; blockchain congestion, forks, or failed transactions;
          third-party brand or rail disputes; or operator actions taken in good
          faith for safety or policy enforcement.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REZVA’S TOTAL LIABILITY FOR ALL
          CLAIMS RELATING TO THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE
          AMOUNTS YOU PAID TO REZVA FOR THE SERVICES IN THE THREE MONTHS BEFORE
          THE CLAIM, OR (B) FIFTY U.S. DOLLARS (US$50). Some jurisdictions do not
          allow certain limitations; in those places, our liability is limited to
          the fullest extent permitted.
        </p>
      </section>

      <section>
        <h2>12. Indemnity</h2>
        <p>
          You will defend, indemnify, and hold harmless Rezva and its operators,
          contributors, and affiliates from claims, damages, losses, and expenses
          (including reasonable legal fees) arising out of: your use of the
          Services; identifiers or destinations you register or control; your
          applications or evidence; your integrations; your violation of these
          terms or law; or disputes between you and payers, payees, wallets, or
          other third parties.
        </p>
      </section>

      <section>
        <h2>13. Changes and termination</h2>
        <p>
          We may update these terms by posting a revised version on this page.
          Continued use after changes become effective constitutes acceptance.
          We may suspend or terminate access to the Services at any time,
          including for maintenance, abuse, legal risk, or product changes. You
          may stop using the Services at any time.
        </p>
      </section>

      <section>
        <h2>14. Governing law</h2>
        <p>
          These terms are governed by the laws applicable to the operator of the
          Services, without regard to conflict-of-law rules, except where
          mandatory consumer protections require otherwise. Courts in that
          jurisdiction will have exclusive venue for disputes that cannot be
          resolved informally, except where prohibited by law.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these terms: <Link href="/contact">contact</Link>. See
          also our <Link href="/privacy">Privacy</Link> notice and{" "}
          <Link href="/about">About</Link> disclaimer.
        </p>
      </section>
    </MarketingStaticPage>
  );
}
