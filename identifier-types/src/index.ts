export type PrivacyClassification = "NORMAL" | "SENSITIVE" | "HIGH_SENSITIVITY";

/** Hard cap for every identifier value (register + resolve). */
export const MAX_IDENTIFIER_VALUE_LENGTH = 700;

export type IdentifierTypeDefinition = {
  name: string;
  version: string;
  status: "draft" | "active" | "deprecated" | "disabled";
  privacy: PrivacyClassification;
  registration_eligible: boolean;
  resolution_eligible: boolean;
  normalize(value: string): string;
  validate(value: string): boolean;
};

export const INITIAL_TYPES = [
  "phone",
  "email",
  "bangla_qr",
  "paypal",
  "bkash",
  "merchant_id",
  "custom",
] as const;

export type InitialIdentifierType = (typeof INITIAL_TYPES)[number];

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * Legacy fallback pattern. Prefer `isExternalNamespaceName` from
 * `@universal-payment/external-naming/namespaces` when available.
 * Kept for packages that only depend on identifier-types.
 */
const EXTERNAL_CRYPTO_NAME_PATTERN =
  /\.(eth|sol|base|crypto|bitcoin|btc|wallet|nft|x|polygon|blockchain|dao|zil|arb|base\.eth)$/i;

let externalNamespaceMatcher:
  | ((value: string) => boolean)
  | null
  | undefined;

/**
 * Optional hook so the registry can inject the Universal Name Resolution
 * namespace matcher without a hard dependency cycle at build time.
 */
export function setExternalNamespaceMatcher(
  matcher: ((value: string) => boolean) | null,
): void {
  externalNamespaceMatcher = matcher;
}

export function isNonRegisterableValue(value: string): boolean {
  const trimmed = value.trim();
  if (ETH_ADDRESS_PATTERN.test(trimmed)) {
    return true;
  }
  if (externalNamespaceMatcher) {
    if (externalNamespaceMatcher(trimmed)) {
      return true;
    }
  } else if (EXTERNAL_CRYPTO_NAME_PATTERN.test(trimmed)) {
    return true;
  }
  return false;
}

const CUSTOM_RESERVED = new Set([
  "paypal",
  "bkash",
  "admin",
  "support",
  "system",
  "api",
  "official",
  "phone",
  "email",
  "merchant_id",
  "bangla_qr",
  "custom",
]);

export function normalizePhoneBd(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+880${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+880${digits}`;
  }
  return value.trim();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function compactEmvPayload(value: string): string {
  // Keep spaces inside EMV fields (e.g. merchant name); drop wrap-only whitespace.
  return value.trim().replace(/[\r\n\t]+/g, "");
}

function isLikelyEmvQrPayload(value: string): boolean {
  const compact = compactEmvPayload(value);
  return /^000201/.test(compact) && compact.length >= 40;
}

export function looksLikeEmvQrPayload(value: string): boolean {
  return isLikelyEmvQrPayload(value);
}

/**
 * Best-effort type inference for wallet "Send to" inputs.
 * Full Bangla/EMV QR payloads must resolve as `bangla_qr`, not provider names.
 * External naming TLDs (.eth, .sol, .base, UD TLDs, …) are classified as
 * `external_name` so they are not mistaken for Rezva provider namespaces.
 */
export function inferIdentifierType(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (isLikelyEmvQrPayload(trimmed) && validateBanglaQr(trimmed)) {
    return "bangla_qr";
  }

  if (validateEmail(trimmed)) {
    return "email";
  }

  if (validatePhone(trimmed)) {
    return "phone";
  }

  if (isNonRegisterableValue(trimmed) && /\./.test(trimmed) && !ETH_ADDRESS_PATTERN.test(trimmed)) {
    // External crypto names (ENS/SNS/Base/UD) — not Rezva provider_name.
    if (externalNamespaceMatcher ? externalNamespaceMatcher(trimmed) : EXTERNAL_CRYPTO_NAME_PATTERN.test(trimmed)) {
      return "external_name";
    }
  }

  // provider namespaces: label.namespace (e.g. shahtab.rabby)
  if (/^[a-z0-9][a-z0-9._-]{0,62}\.[a-z0-9][a-z0-9-]{1,62}$/i.test(trimmed)) {
    return "provider_name";
  }

  if (validateBanglaQr(trimmed) && /^\d{8,32}$/.test(trimmed.replace(/\D/g, ""))) {
    return "bangla_qr";
  }

  if (validateCustom(trimmed)) {
    return "custom";
  }

  return null;
}

/** Canonical bangla_qr value: the pasted string (whitespace-trimmed). */
function normalizeBanglaQr(value: string): string {
  const compact = compactEmvPayload(value);
  if (isLikelyEmvQrPayload(compact)) {
    return compact;
  }
  return compact.replace(/\D/g, "");
}

function normalizeLowerTrim(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMerchantId(value: string): string {
  return value.trim();
}

/** Preserve the pasted custom string; only trim and lowercase for matching. */
function normalizeCustom(value: string): string {
  let trimmed = value.trim();
  try {
    // Wallets may percent-encode `$` as `%24` when pasting URLs.
    if (/%[0-9a-fA-F]{2}/.test(trimmed)) {
      trimmed = decodeURIComponent(trimmed);
    }
  } catch {
    // Keep the raw string if decoding fails.
  }
  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

function validatePhone(value: string): boolean {
  const normalized = normalizePhoneBd(value);
  return /^\+8801[3-9]\d{8}$/.test(normalized);
}

function validateEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}

function validateBanglaQr(value: string): boolean {
  const normalized = normalizeBanglaQr(value);
  if (isLikelyEmvQrPayload(normalized)) {
    return (
      normalized.length >= 40 &&
      normalized.length <= MAX_IDENTIFIER_VALUE_LENGTH
    );
  }
  return /^\d{8,32}$/.test(normalized);
}

function validatePaypal(value: string): boolean {
  const normalized = normalizeLowerTrim(value);
  return /^[a-z0-9._-]{3,127}$/.test(normalized);
}

function validateBkash(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function validateMerchantId(value: string): boolean {
  const normalized = normalizeMerchantId(value);
  return normalized.length >= 2 && normalized.length <= 64;
}

/**
 * Custom is intentionally open: URLs, handles, shop codes, etc.
 * Only reject empty / oversized values, raw crypto addresses, and a few
 * reserved single-token labels that collide with other types.
 */
function validateCustom(value: string): boolean {
  const normalized = normalizeCustom(value);
  if (normalized.length < 1 || normalized.length > MAX_IDENTIFIER_VALUE_LENGTH) {
    return false;
  }
  if (CUSTOM_RESERVED.has(normalized)) {
    return false;
  }
  return !isNonRegisterableValue(normalized);
}

const TYPE_DEFINITIONS: Record<InitialIdentifierType, IdentifierTypeDefinition> = {
  phone: {
    name: "phone",
    version: "1",
    status: "active",
    privacy: "HIGH_SENSITIVITY",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizePhoneBd,
    validate: validatePhone,
  },
  email: {
    name: "email",
    version: "1",
    status: "active",
    privacy: "HIGH_SENSITIVITY",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizeEmail,
    validate: validateEmail,
  },
  bangla_qr: {
    name: "bangla_qr",
    version: "1",
    status: "active",
    privacy: "NORMAL",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizeBanglaQr,
    validate: validateBanglaQr,
  },
  paypal: {
    name: "paypal",
    version: "1",
    status: "active",
    privacy: "SENSITIVE",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizeLowerTrim,
    validate: validatePaypal,
  },
  bkash: {
    name: "bkash",
    version: "1",
    status: "active",
    privacy: "SENSITIVE",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: (value) => value.replace(/\D/g, ""),
    validate: validateBkash,
  },
  merchant_id: {
    name: "merchant_id",
    version: "1",
    status: "active",
    privacy: "NORMAL",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizeMerchantId,
    validate: validateMerchantId,
  },
  custom: {
    name: "custom",
    version: "1",
    status: "active",
    privacy: "NORMAL",
    registration_eligible: true,
    resolution_eligible: true,
    normalize: normalizeCustom,
    validate: validateCustom,
  },
};

export function getIdentifierType(type: string): IdentifierTypeDefinition | null {
  if (!(type in TYPE_DEFINITIONS)) {
    return null;
  }
  return TYPE_DEFINITIONS[type as InitialIdentifierType];
}

export function normalizeIdentifier(type: string, value: string): string | null {
  const definition = getIdentifierType(type);
  if (!definition) {
    return null;
  }
  return definition.normalize(value);
}

export function validateIdentifier(type: string, value: string): boolean {
  const definition = getIdentifierType(type);
  if (!definition || definition.status !== "active") {
    return false;
  }
  if (value.trim().length > MAX_IDENTIFIER_VALUE_LENGTH) {
    return false;
  }
  if (isNonRegisterableValue(value)) {
    return false;
  }
  const normalized = definition.normalize(value);
  if (normalized.length > MAX_IDENTIFIER_VALUE_LENGTH) {
    return false;
  }
  return definition.validate(normalized);
}

export function listActiveIdentifierTypes(): IdentifierTypeDefinition[] {
  return INITIAL_TYPES.map((name) => TYPE_DEFINITIONS[name]).filter(
    (definition) => definition.status === "active",
  );
}

export { TYPE_DEFINITIONS };
