import {
  howItWorksIdentifiers,
  howItWorksMerchants,
  howItWorksOverview,
  howItWorksUsers,
  howItWorksWallets,
} from "./data";

function AudienceSteps({
  steps,
}: {
  steps: ReadonlyArray<{ title: string; body: string }>;
}) {
  return (
    <ol className="hiw-audience-steps">
      {steps.map((step, index) => (
        <li className="hiw-audience-step" key={step.title}>
          <span className="hiw-audience-step-number">{index + 1}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorksOverview() {
  return (
    <section className="hiw-audience-section" id="overview">
      <h2>{howItWorksOverview.title}</h2>
      <p className="hiw-section-lede">{howItWorksOverview.body}</p>
      <ul className="hiw-point-list">
        {howItWorksOverview.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorksUsers() {
  return (
    <section className="hiw-audience-section" id="for-users">
      <h2>{howItWorksUsers.title}</h2>
      <p className="hiw-section-lede">{howItWorksUsers.lede}</p>
      <AudienceSteps steps={howItWorksUsers.steps} />
    </section>
  );
}

export function HowItWorksMerchants() {
  return (
    <section className="hiw-audience-section" id="for-merchants">
      <h2>{howItWorksMerchants.title}</h2>
      <p className="hiw-section-lede">{howItWorksMerchants.lede}</p>
      <AudienceSteps steps={howItWorksMerchants.steps} />
      <div className="hiw-inline-note">
        <p>{howItWorksMerchants.note}</p>
      </div>
    </section>
  );
}

export function HowItWorksWallets() {
  return (
    <section className="hiw-audience-section" id="for-wallets">
      <h2>{howItWorksWallets.title}</h2>
      <p className="hiw-section-lede">{howItWorksWallets.lede}</p>
      <div className="hiw-level-grid hiw-level-grid-3">
        {howItWorksWallets.levels.map((level) => (
          <article className="hiw-level-card" key={level.title}>
            <h3>{level.title}</h3>
            <p>{level.body}</p>
            <ul>
              {level.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="hiw-inline-note">
        <p>{howItWorksWallets.note}</p>
      </div>
    </section>
  );
}

export function HowItWorksIdentifiers() {
  return (
    <section className="hiw-audience-section" id="identifiers">
      <h2>{howItWorksIdentifiers.title}</h2>
      <p className="hiw-section-lede">{howItWorksIdentifiers.lede}</p>
      <ul className="hiw-identifier-cards">
        {howItWorksIdentifiers.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </li>
        ))}
      </ul>
      <div className="hiw-inline-note">
        <p>{howItWorksIdentifiers.note}</p>
      </div>
    </section>
  );
}
