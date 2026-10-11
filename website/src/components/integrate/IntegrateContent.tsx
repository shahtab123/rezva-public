import Link from "next/link";
import {
  integrateAudiences,
  integrateFeatures,
  integrateFinalCta,
  integrateHero,
  integratePricing,
  integrateSteps,
} from "./data";
import "./integrate.css";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function IntegrateContent() {
  return (
    <div className="integrate-page">
      <section className="integrate-hero">
        <p className="integrate-eyebrow">Developer integration</p>
        <h1>{integrateHero.title}</h1>
        <p className="integrate-hero-lede">{integrateHero.lede}</p>
        <p className="integrate-hero-body">{integrateHero.body}</p>
        <div className="integrate-hero-actions">
          <Link className="button button-primary" href="/dashboard">
            Get Started <Arrow />
          </Link>
          <Link className="button button-secondary" href="/docs/introduction/overview">
            Read the Docs
          </Link>
        </div>
      </section>

      <section className="integrate-section">
        <h2>{integrateFeatures.title}</h2>
        <div className="integrate-feature-grid">
          {integrateFeatures.items.map((item) => (
            <article className="integrate-feature-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="integrate-section">
        <h2>{integrateSteps.title}</h2>
        <ol className="integrate-steps">
          {integrateSteps.items.map((step) => (
            <li className="integrate-step" key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="integrate-section">
        <h2>{integrateAudiences.title}</h2>
        <div className="integrate-audience-grid">
          {integrateAudiences.items.map((item) => (
            <article className="integrate-audience-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="integrate-section integrate-pricing-section">
        <h2>{integratePricing.title}</h2>
        <p className="integrate-section-lede">{integratePricing.lede}</p>
        <div className="integrate-pricing-coming-soon" role="status">
          <p className="integrate-pricing-coming-soon-label">
            {integratePricing.statusLabel}
          </p>
          <p>{integratePricing.statusBody}</p>
          <Link className="button button-secondary" href="/dashboard">
            Get Started
          </Link>
        </div>
      </section>

      <section className="integrate-final-cta">
        <h2>{integrateFinalCta.title}</h2>
        <p>{integrateFinalCta.body}</p>
        <div className="integrate-hero-actions">
          <Link className="button button-primary" href="/dashboard">
            Get Started <Arrow />
          </Link>
          <Link className="button button-secondary" href="/docs/introduction/overview">
            Read the Docs
          </Link>
        </div>
      </section>
    </div>
  );
}
