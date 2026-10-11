/**
 * Restricted-name system extension: external naming namespace rules.
 *
 * These are TLD/namespace → provider routes, not individual restricted labels.
 * Example: ".eth" → ENS, ".sol" → SNS. Never store alice.eth as a reserved name.
 */

export {
  EXTERNAL_NAMESPACE_RULES,
  UNSTOPPABLE_NAMESPACES,
  isExternalNamespaceName,
  listExternalNamespaces,
  matchExternalNamespace,
  type ExternalNamespaceMatch,
  type ExternalNamespaceRule,
} from "@universal-payment/external-naming/namespaces";
