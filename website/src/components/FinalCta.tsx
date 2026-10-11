"use client";

import { LoginToIntegrateButton } from "./LoginToIntegrateButton";

export function FinalCta() {
  return (
    <section className="final-cta" id="dashboard">
      <p className="eyebrow">Get started</p>
      <h2>Register a name. Or add lookup to your wallet.</h2>
      <p>Log in to set up a business, or apply as a wallet provider.</p>
      <div className="button-row centered">
        <LoginToIntegrateButton />
      </div>
    </section>
  );
}
