import {
  EXTERNAL_NAMESPACE_RULES,
  isExternalNamespaceName,
  listExternalNamespaces,
  matchExternalNamespace,
  UNSTOPPABLE_NAMESPACES,
  type ExternalNamespaceMatch,
  type ExternalNamespaceRule,
} from "./namespaces.js";
import {
  NameResolverRegistry,
  isExternalNameCandidate,
  type ExternalNamingEnv,
} from "./registry.js";
import { createBasenamesResolver } from "./resolvers/basenames.js";
import { createEnsResolver } from "./resolvers/ens.js";
import { createSnsResolver, type SnsClient } from "./resolvers/sns.js";
import {
  createUnstoppableResolver,
  type UnstoppableClient,
} from "./resolvers/unstoppable.js";
import {
  toResolveResponse,
  type ExternalResolveFailure,
  type ExternalResolveResult,
  type ExternalResolveSuccess,
  type NameResolver,
  type ResolveOptions,
} from "./types.js";
import type { EnsClient } from "./resolvers/ens.js";
import type { BasenamesClient } from "./resolvers/basenames.js";

export type CreateExternalNamingOptions = {
  env?: ExternalNamingEnv;
  ensClient?: EnsClient;
  basenamesClient?: BasenamesClient;
  snsClient?: SnsClient;
  unstoppableClient?: UnstoppableClient;
  /** Extra resolvers for future naming systems. */
  extraResolvers?: NameResolver[];
};

/**
 * Build the default Universal Name Resolution registry with ENS, SNS,
 * Base Names, and Unstoppable Domains providers.
 */
export function createExternalNamingRegistry(
  options: CreateExternalNamingOptions = {},
): NameResolverRegistry {
  const env = options.env ?? {};
  const registry = new NameResolverRegistry(EXTERNAL_NAMESPACE_RULES);

  registry.register(
    options.ensClient
      ? createEnsResolver(env, options.ensClient)
      : createEnsResolver(env),
  );
  registry.register(
    options.basenamesClient
      ? createBasenamesResolver(env, options.basenamesClient)
      : createBasenamesResolver(env),
  );
  registry.register(
    options.snsClient
      ? createSnsResolver(env, options.snsClient)
      : createSnsResolver(env),
  );
  registry.register(
    options.unstoppableClient
      ? createUnstoppableResolver(env, options.unstoppableClient)
      : createUnstoppableResolver(env),
  );

  for (const resolver of options.extraResolvers ?? []) {
    registry.register(resolver);
  }

  return registry;
}

export {
  EXTERNAL_NAMESPACE_RULES,
  UNSTOPPABLE_NAMESPACES,
  isExternalNamespaceName,
  listExternalNamespaces,
  matchExternalNamespace,
  NameResolverRegistry,
  isExternalNameCandidate,
  toResolveResponse,
  createEnsResolver,
  createBasenamesResolver,
  createSnsResolver,
  createUnstoppableResolver,
};

export type {
  ExternalNamespaceMatch,
  ExternalNamespaceRule,
  ExternalNamingEnv,
  ExternalResolveFailure,
  ExternalResolveResult,
  ExternalResolveSuccess,
  NameResolver,
  ResolveOptions,
  EnsClient,
  BasenamesClient,
  SnsClient,
  UnstoppableClient,
};
