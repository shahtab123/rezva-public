import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import { YoutubePreview } from "@/components/YoutubePreview";
import Link from "next/link";

const useCases = [
  {
    title: "Wallet namespaces",
    banner: "/use-cases/01-namespaces.svg?v=3",
    bannerAlt: "Section 1: Wallet namespaces",
    body: (
      <>
        <p>
          Crypto wallets can issue short names under their own brand (a
          namespace). Under Rabby, that looks like <code>shahtab.rabby</code>:{" "}
          <strong>shahtab</strong> is the person or shop, <strong>.rabby</strong>{" "}
          is Rabby’s namespace.
        </p>
        <p>
          <strong>Example:</strong> your friend is paid as{" "}
          <code>shahtab.rabby</code> inside Rabby. You’re in another crypto
          wallet that doesn’t know Rabby’s naming system. Without a shared
          resolver you’d switch apps or paste a long <code>0x…</code> address.
        </p>
        <p>
          With Rezva, your wallet resolves <code>shahtab.rabby</code>, shows who
          you’re paying, and loads the onchain destination (network, asset,
          address). You confirm and send crypto in the wallet you already use.
          Rabby still owns the namespace; Rezva is the lookup layer.
        </p>
      </>
    ),
  },
  {
    title: "Email-based identifiers",
    banner: "/use-cases/02-email.svg?v=3",
    bannerAlt: "Section 2: Email-based identifiers",
    body: (
      <>
        <p>
          People already put an email on invoices. If that email is registered
          as a Rezva identifier, a crypto wallet can resolve it to a payment
          destination instead of asking for a raw address.
        </p>
        <p>
          <strong>Example:</strong> a freelancer lists{" "}
          <code>pay@studio.example</code> on an invoice. You open your crypto
          wallet, enter that email, Rezva returns Base USDC (or whatever they
          registered), you confirm, and the wallet sends the transfer.
        </p>
        <p>
          Without Rezva, that email is just text unless you both use the same
          closed app that invented “pay to email.”
        </p>
      </>
    ),
  },
  {
    title: "National and regional payment QR codes",
    banner: "/use-cases/03-qr.svg?v=3",
    bannerAlt: "Section 3: National and regional payment QR codes",
    body: (
      <>
        <p>
          Many merchants already show a national or regional payment QR (for
          example Bangla QR, SGQR, QRIS). That QR string can also be registered
          in Rezva as an identifier that points to a crypto destination.
        </p>
        <p>
          <strong>Example:</strong> a café keeps one QR sticker for local apps.
          A customer with a crypto wallet scans the same QR. The wallet sends
          the QR payload to Rezva, gets back the linked onchain destination, and
          the user pays with crypto - no second “crypto only” sticker required.
        </p>
        <p>
          Rezva does not run the national payment network. It only resolves the
          QR identifier into crypto payment options for compatible wallets.
        </p>
        <div className="use-case-videos">
          <YoutubePreview
            title="What If Crypto Wallets Could Understand Bangla QR?"
            url="https://youtu.be/iQ05dP4iBx0"
          />
        </div>
      </>
    ),
  },
  {
    title: "Business payment links",
    banner: "/use-cases/04-links.svg?v=3",
    bannerAlt: "Section 4: Business payment links",
    body: (
      <>
        <p>
          Merchants share PayPal links, Cash App links, or similar payment URLs
          and QRs. Those normally open that app’s checkout. In Rezva they can
          also be registered so a crypto wallet resolves them to an onchain
          destination.
        </p>
        <p>
          <strong>Example:</strong> a shop shows a Cash App or PayPal QR / link
          at the register. Your crypto wallet scans or pastes it, Rezva returns
          the registered crypto payment option, you confirm chain and amount, and
          the wallet sends crypto. The shop keeps the same link or sticker.
        </p>
        <div className="use-case-videos">
          <YoutubePreview
            title="What If You Could Receive Crypto With a PayPal or Cash App QR?"
            url="https://youtu.be/XIiK2TJxIcY"
          />
        </div>
      </>
    ),
  },
  {
    title: "Merchant identifiers",
    banner: "/use-cases/05-merchant.svg?v=5",
    bannerAlt: "Section 5: Merchant identifiers",
    body: (
      <>
        <p>
          A merchant ID is a stable business handle in the registry (Rezva type{" "}
          <code>merchant_id</code>). It is not a PayPal/Cash App URL and not a
          national QR payload. It is the ID you register once and point at crypto
          destinations.
        </p>
        <p>
          <strong>Example:</strong> Northwind Coffee registers{" "}
          <code>northwind-coffee</code> as a merchant ID with a Base USDC
          destination. Customers type or select that ID in a compatible crypto
          wallet, see “Northwind Coffee,” confirm, and send USDC. If Northwind
          later changes the receiving wallet or adds another network, the
          merchant ID stays the same; only the destination mapping updates.
        </p>
        <p>
          <strong>Multi-store:</strong> they can also register{" "}
          <code>northwind-store-12</code> and <code>northwind-store-18</code> so
          each location maps to its own crypto destination while keeping clear
          names at confirm time.
        </p>
      </>
    ),
  },
  {
    title: "Phone-based identifiers",
    banner: "/use-cases/06-phone.svg?v=3",
    bannerAlt: "Section 6: Phone-based identifiers",
    body: (
      <>
        <p>
          A phone number can be registered as a Rezva identifier that maps to a
          crypto destination, the same way people already save numbers in
          contacts.
        </p>
        <p>
          <strong>Example:</strong> you pay a contractor at{" "}
          <code>+15551234567</code>. In a compatible wallet you enter that
          number, Rezva returns their registered onchain destination, you
          confirm, and the wallet sends crypto - no reading a long address over
          the phone.
        </p>
      </>
    ),
  },
  {
    title: "Cross-wallet identifier resolution",
    banner: "/use-cases/07-cross-wallet.svg?v=3",
    bannerAlt: "Section 7: Cross-wallet identifier resolution",
    body: (
      <>
        <p>
          Crypto wallets each invent their own naming. Someone is{" "}
          <code>shahtab.rabby</code> in Rabby; you use a different wallet on the
          same chain. Without a shared resolver, that name is useless outside
          Rabby.
        </p>
        <p>
          <strong>Example:</strong> you stay in your wallet, resolve{" "}
          <code>shahtab.rabby</code> through Rezva, get the crypto payment
          options, and send. Each wallet can keep its own namespace; Rezva makes
          those names payable from other compatible wallets.
        </p>
      </>
    ),
  },
];

export default function UseCasesPage() {
  return (
    <MarketingStaticPage
      eyebrow="Examples"
      title="Use cases"
      lede="How familiar identifiers become crypto payments: a compatible wallet resolves through Rezva, you confirm, and the wallet sends onchain."
    >
      {useCases.map((item) => (
        <section key={item.title} className="use-case-section">
          <div className="use-case-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.banner} alt={item.bannerAlt} />
          </div>
          {item.body}
        </section>
      ))}
      <p>
        Want the flow step by step? See{" "}
        <Link href="/how-it-works">how it works</Link>. Building a wallet? Start
        with <Link href="/integrate">integrate</Link> or the{" "}
        <Link href="/docs/introduction/overview">docs</Link>.
      </p>
    </MarketingStaticPage>
  );
}
