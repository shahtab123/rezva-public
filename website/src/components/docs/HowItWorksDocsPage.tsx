import { docsHowItWorksSections } from "./how-it-works-technical";

export function HowItWorksDocsPage() {
  return (
    <div className="docs-page docs-page-technical">
      <h1>How It Works</h1>
      <p className="docs-page-lede">
        Technical overview of the Rezva resolution protocol: how identifiers
        are normalized, resolved, protected, and returned to integrated
        wallets.
      </p>

      {docsHowItWorksSections.map((section) => (
        <section className="docs-tech-section" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <p className="docs-tech-lede">{section.lede}</p>

          {"blocks" in section &&
            section.blocks?.map((block, index) =>
              block.type === "code" ? (
                <pre className="docs-tech-code" key={`${section.id}-code-${index}`}>
                  <code>{block.lines.join("\n")}</code>
                </pre>
              ) : (
                <p className="docs-tech-text" key={`${section.id}-text-${index}`}>
                  {block.body}
                </p>
              ),
            )}

          {"list" in section && section.list ? (
            <ul className="docs-tech-list">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {"cards" in section && section.cards ? (
            <div className="docs-tech-grid">
              {section.cards.map((card) => (
                <article className="docs-tech-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <ul>
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
