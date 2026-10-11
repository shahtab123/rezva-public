export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="dash-page-header">
      <div className="dash-page-header-copy">
        {eyebrow ? <p className="dash-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="dash-page-lede">{description}</p> : null}
      </div>
      {actions ? <div className="dash-page-actions">{actions}</div> : null}
    </header>
  );
}
