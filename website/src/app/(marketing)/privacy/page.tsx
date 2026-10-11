import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <MarketingStaticPage
      eyebrow="Legal"
      title="Privacy"
      lede="This notice explains what information Rezva handles when you use the website, dashboard, APIs, and related services, and how that relates to the payment identity registry and resolver."
    >
      <section>
        <h2>1. Our role</h2>
        <p>
          Rezva operates a registry and resolution layer for payment identifiers.
          We process information needed to run those systems: accounts,
          applications, identifier mappings, destinations, complaints, operator
          actions, and service logs. Rezva does not receive, hold, or settle your
          crypto or fiat payments. Payment activity that occurs inside a third-party
          wallet is governed by that wallet’s privacy practices, not by this notice
          alone.
        </p>
      </section>

      <section>
        <h2>2. Information we process</h2>
        <p>
          <strong>Account and authentication data.</strong> Dashboard sign-in may
          use Privy or similar authentication. We may receive identifiers such as
          wallet addresses, email, session tokens, and account metadata needed to
          keep you signed in and authorize actions. Admin console access uses
          separate operator credentials.
        </p>
        <p>
          <strong>Applications and evidence.</strong> Business and wallet-provider
          applications may include contact details, website, summaries, and
          supporting evidence. Evidence is stored for operator review. It is not
          published in public resolve responses.
        </p>
        <p>
          <strong>Registry and resolution data.</strong> When identifiers are
          registered or updated, we store type, normalized value, controller
          references, destinations (network, asset, address or equivalent), status
          fields, timestamps, and related protocol metadata. Compatible clients may
          query the resolver to retrieve payment-ready mappings.
        </p>
        <p>
          <strong>Complaints and reports.</strong> Dispute submissions may include
          subject, target identifier, summary, and evidence. This material is used
          for review and safety actions.
        </p>
        <p>
          <strong>Technical and usage data.</strong> We may process API request
          metadata, rate-limit counters, health checks, error logs, IP addresses,
          device or browser information, and similar operational telemetry needed
          to secure and operate the Services.
        </p>
      </section>

      <section>
        <h2>3. Identifier privacy classifications</h2>
        <p>
          Identifier types carry a protocol privacy classification (for example
          NORMAL, SENSITIVE, or HIGH_SENSITIVITY). Sensitive types may require
          authentication for availability checks and may redact or withhold raw
          values on public resolve responses according to protocol rules. Exact
          behavior for each type is described in the{" "}
          <Link href="/docs/introduction/overview">protocol documentation</Link>{" "}
          and identifier-type definitions.
        </p>
        <p>
          Even when a value is redacted in a public response, authorized parties
          (such as the controller, approved providers, or operators) may still
          access operational data needed to manage the mapping.
        </p>
      </section>

      <section>
        <h2>4. How we use information</h2>
        <p>We use information to:</p>
        <p>
          (a) provide registry, resolve, dashboard, Free API, namespace, and
          operator features; (b) review applications and enforce eligibility;
          (c) detect abuse, fraud signals, rate-limit violations, and security
          incidents; (d) process complaints and take safety actions such as warn,
          suspend, revoke, or reclaim; (e) improve reliability and documentation;
          and (f) communicate about service changes or support when you contact us.
        </p>
        <p>
          We do not sell personal information. We do not use registry evidence as
          advertising profiles.
        </p>
      </section>

      <section>
        <h2>5. What may be public or shared with integrators</h2>
        <p>
          Resolve responses are designed for wallet and payment-app lookup. Data
          returned to authenticated or public clients may include display
          information, payment readiness, destinations, and status fields needed
          to complete a send flow, subject to privacy classification rules.
        </p>
        <p>
          If you register an identifier people can look up, you should assume
          associated payment metadata may be retrieved by compatible clients
          worldwide. Do not register identifiers or destinations you are not
          prepared to expose under the protocol’s rules.
        </p>
      </section>

      <section>
        <h2>6. Sharing with service providers and legal requests</h2>
        <p>
          We use infrastructure and vendors (such as hosting, databases,
          authentication, and email) to operate the Services. They process data
          only as needed to provide those functions.
        </p>
        <p>
          We may disclose information if required by law, regulation, legal
          process, or to protect the rights, safety, and integrity of users, the
          protocol, or the public. Operator actions on identifiers are part of
          protocol governance and may be visible in status changes or audit logs
          available to authorized roles.
        </p>
      </section>

      <section>
        <h2>7. Retention</h2>
        <p>
          We retain account, registry, complaint, and log data for as long as
          needed to operate the Services, meet security and audit needs, resolve
          disputes, and comply with law. Removed or revoked identifiers may leave
          residual history, cooldown, or audit records as described in protocol
          documentation.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We apply technical and organizational measures appropriate to a
          resolution service, including access controls for dashboard and operator
          roles, API key handling, and logging practices. No method of
          transmission or storage is fully secure. You are responsible for
          protecting your keys, sessions, and devices.
        </p>
      </section>

      <section>
        <h2>9. Your choices</h2>
        <p>
          You may update or remove identifiers you control through the dashboard
          or APIs, subject to protocol cooldowns and operator policy. You may
          stop using the Services and request account-related assistance via{" "}
          <Link href="/contact">contact</Link>. Some registry history and safety
          records may be retained after deletion requests where needed for
          security, dispute handling, or legal compliance.
        </p>
      </section>

      <section>
        <h2>10. Children</h2>
        <p>
          The Services are not directed to children, and we do not knowingly
          collect personal information from children. If you believe a child has
          provided information, contact us so we can take appropriate steps.
        </p>
      </section>

      <section>
        <h2>11. International processing</h2>
        <p>
          Information may be processed in countries where we or our providers
          operate. By using the Services, you understand that your information
          may be transferred to jurisdictions with different data-protection
          rules than your own.
        </p>
      </section>

      <section>
        <h2>12. Changes</h2>
        <p>
          We may update this notice as the product evolves. The current version
          will be posted on this page. Material changes may also be called out in
          the dashboard or documentation when practical.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          Privacy questions: <Link href="/contact">contact</Link>. Related pages:{" "}
          <Link href="/terms">Terms of use</Link>, <Link href="/about">About</Link>,{" "}
          <Link href="/report">Report / Dispute</Link>.
        </p>
      </section>
    </MarketingStaticPage>
  );
}
