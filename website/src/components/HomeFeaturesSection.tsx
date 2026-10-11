"use client";

import HowItWorks, { type Step } from "@/components/ui/how-it-works";

/** Monochrome pin cards. Pink on cards 01 and 03. */
const accent = {
  bg: "bg-white",
  text: "text-[#ff2d6a]",
  border: "border-[#e5e5e0]",
};

const ink = {
  bg: "bg-[#fafaf9]",
  text: "text-[#0b0b0c]",
  border: "border-[#e5e5e0]",
};

const graphite = {
  bg: "bg-[#f2f2ef]",
  text: "text-[#3a3a36]",
  border: "border-[#e0e0da]",
};

export const homeFeatureSteps: Step[] = [
  {
    title: "Universal Name Resolution",
    description:
      "Resolve ENS, Base Names, SNS, and Unstoppable Domains through the same API. New naming systems do not require a wallet update.",
    colors: accent,
  },
  {
    title: "Provider namespaces",
    description:
      "Wallets offer branded names like coffee.rabby. People pay with a name they trust, and the destination stays under that wallet's namespace.",
    colors: ink,
  },
  {
    title: "Existing payment QRs",
    description:
      "Register PayPal links, Cash App QR, Bangla QR, SGQR, QRIS, and other national QR strings so crypto wallets can pay the same sticker.",
    colors: accent,
  },
  {
    title: "Email, phone & IDs",
    description:
      "Register the email, phone, or merchant ID people already save. Compatible wallets get crypto payment options back.",
    colors: graphite,
  },
  {
    title: "One resolve API",
    description:
      "Wallets keep scanning, signing, and sending. Rezva only answers where the payment should go.",
    colors: accent,
  },
];

export function HomeFeaturesSection() {
  return (
    <section className="home-features" id="features" aria-labelledby="features-heading">
      <div className="home-features-inner">
        <div className="home-features-head section-intro">
          <p className="section-number">01 / Features</p>
          <h2 id="features-heading">
            Turn existing payment identifiers into crypto destinations.
          </h2>
          <p>
            Rezva lets compatible wallets resolve familiar identifiers, from
            payment links and QR codes to usernames, phone numbers, and wallet
            names, into the crypto address behind them. This makes crypto
            payments easier to send without replacing the identifiers
            businesses already use.
          </p>
        </div>
        <HowItWorks features={homeFeatureSteps} className="home-features-board" />
      </div>
    </section>
  );
}
