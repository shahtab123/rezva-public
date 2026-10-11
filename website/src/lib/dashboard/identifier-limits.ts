/** Max identifiers a Business / Users dashboard account may newly register. */
export const DASHBOARD_MAX_IDENTIFIERS = 2;

/** Statuses that still occupy a dashboard identifier slot. */
const COUNTED_STATUSES = new Set([
  "pending",
  "active",
  "update_pending",
  "suspended",
]);

export function countsTowardDashboardIdentifierLimit(status: string): boolean {
  return COUNTED_STATUSES.has(status);
}

export function countDashboardIdentifiers(
  identifiers: Array<{ status: string }>,
): number {
  return identifiers.filter((row) =>
    countsTowardDashboardIdentifierLimit(row.status),
  ).length;
}

export function canRegisterDashboardIdentifier(
  identifiers: Array<{ status: string }>,
): boolean {
  return countDashboardIdentifiers(identifiers) < DASHBOARD_MAX_IDENTIFIERS;
}

export function dashboardIdentifierLimitMessage(count: number): string {
  if (count <= DASHBOARD_MAX_IDENTIFIERS) {
    return `Business / Users dashboard accounts can register up to ${DASHBOARD_MAX_IDENTIFIERS} identifiers.`;
  }
  return `You already have ${count} identifiers. Existing ones stay active. New registrations through the dashboard are limited to ${DASHBOARD_MAX_IDENTIFIERS} total — remove one before adding another, or use an approved wallet provider that offers Merchant Setup (providers set their own limits).`;
}
