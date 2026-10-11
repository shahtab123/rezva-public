export const PRODUCTION_REGISTRATION_SAFETY_SECONDS = 86_400;

export function getRegistrationSafetySeconds(): number {
  const raw =
    process.env.NEXT_PUBLIC_REGISTRATION_SAFETY_SECONDS?.trim() ??
    process.env.REGISTRATION_SAFETY_SECONDS?.trim() ??
    "0";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatSafetyDuration(seconds: number): string {
  if (seconds <= 0) return "immediately";
  if (seconds % 86_400 === 0) {
    const days = seconds / 86_400;
    return days === 1 ? "24 hours" : `${days} days`;
  }
  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (seconds >= 60) {
    const minutes = Math.round(seconds / 60);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return `${seconds} seconds`;
}

export function describeRegistrationSafetyPolicy(): string {
  const localSeconds = getRegistrationSafetySeconds();
  const localLabel = formatSafetyDuration(localSeconds);
  const productionLabel = formatSafetyDuration(PRODUCTION_REGISTRATION_SAFETY_SECONDS);

  if (localSeconds <= 0) {
    return `This dev environment activates new identifiers immediately. Production uses a ${productionLabel} safety period before identifiers become payment-ready.`;
  }
  if (localSeconds === PRODUCTION_REGISTRATION_SAFETY_SECONDS) {
    return `New identifiers stay pending for ${productionLabel} after registration, then become payment-ready automatically. This is not an admin approval step.`;
  }
  return `This environment uses a ${localLabel} registration safety period. Production uses ${productionLabel} before identifiers become payment-ready.`;
}

export function pendingActivationLabel(
  status: string,
  pendingActivationAt?: string | null,
): string | null {
  if (status !== "pending" && status !== "update_pending") {
    return null;
  }
  if (!pendingActivationAt) {
    return status === "update_pending" ? "Destination update pending" : "Activation pending";
  }
  const activatesAt = Date.parse(pendingActivationAt);
  if (!Number.isFinite(activatesAt)) {
    return "Activation pending";
  }
  if (activatesAt <= Date.now()) {
    return "Activating on next refresh…";
  }
  return `Payment-ready after ${new Date(activatesAt).toLocaleString()}`;
}
