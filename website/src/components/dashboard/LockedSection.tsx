import Link from "next/link";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import type { ApplicationStatus } from "./application-types";

export function LockedSection({
  track,
  status,
  title,
  description,
}: {
  track: "business" | "provider";
  status: ApplicationStatus;
  title: string;
  description: string;
}) {
  const applyHref =
    track === "business"
      ? "/dashboard/business/apply"
      : "/dashboard/provider/apply";

  return (
    <div className="dash-locked">
      <ApplicationStatusBadge status={status} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="dash-btn dash-btn-primary" href={applyHref}>
        View application
      </Link>
    </div>
  );
}
