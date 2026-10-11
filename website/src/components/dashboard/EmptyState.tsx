import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-mark" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionHref ? (
        <Link className="dash-btn dash-btn-secondary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
