export type RegistryConfig = {
  registrationSafetySeconds: number;
  updateSafetySeconds: number;
  removalCooldownSeconds: number;
};

export function configFromEnv(env: {
  REGISTRATION_SAFETY_SECONDS?: string;
  UPDATE_SAFETY_SECONDS?: string;
  REMOVAL_COOLDOWN_SECONDS?: string;
}): RegistryConfig {
  return {
    registrationSafetySeconds: parseInt(
      env.REGISTRATION_SAFETY_SECONDS ?? "86400",
      10,
    ),
    updateSafetySeconds: parseInt(env.UPDATE_SAFETY_SECONDS ?? "3600", 10),
    removalCooldownSeconds: parseInt(
      env.REMOVAL_COOLDOWN_SECONDS ?? "2592000",
      10,
    ),
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

export function isPast(iso: string | null | undefined): boolean {
  if (!iso) {
    return false;
  }
  return Date.parse(iso) <= Date.now();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
