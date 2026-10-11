export {
  authenticateProvider,
  authenticateOperator,
  buildAuthContext,
  getControllerWallet,
  providerAllowsType,
  requireController,
  requireMerchantSetup,
} from "./auth.js";
export type { AuthContext, RegistryEnv } from "./auth.js";
export {
  verifyControllerAuthorization,
  claimIdempotencyKey,
  storeIdempotencyResult,
} from "./controller-auth.js";
export {
  advanceIdentifierState,
  buildResolveResponse,
  computePaymentReady,
  pendingActivationAt,
  removalAvailableAt,
  isPermanentlyUnavailable,
  isPermanentlyRemoved,
} from "./state.js";
export {
  invalidateResolveCache,
  getCachedResolve,
  setCachedResolve,
  shouldCacheResolveStatus,
} from "./cache.js";
export { handleResolve, resetExternalNamingRegistryForTests } from "./resolve.js";
export { handleRegistryRequest } from "./routes.js";
export { handleOperatorRequest } from "./operator-routes.js";
export { jsonResponse, errorResponse, readJson } from "./http.js";
export { createDbExecutor } from "./db/factory.js";
export type { DatabaseEnv } from "./db/factory.js";
export { configFromEnv, nowIso, addSeconds, isPast, newId, sha256Hex } from "./config.js";
export type { RegistryConfig } from "./config.js";
export { SCHEMA_SQL, SCHEMA_SEED_SQL } from "./schema.js";
export { RegistryStore } from "./store.js";
export type { IdentifierRow, PaymentDestinationRow } from "./store.js";
export {
  validatePaymentDestination,
  validatePaymentOptions,
  normalizeNativeName,
  validateNativeName,
  destinationsEqual,
  destinationsFingerprint,
} from "./validation.js";
