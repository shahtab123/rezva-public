import type { ExternalNamespaceRule } from "./namespaces.js";
import {
  EXTERNAL_NAMESPACE_RULES,
  isExternalNamespaceName,
  matchExternalNamespace,
} from "./namespaces.js";
import type {
  ExternalNamingEnv,
  ExternalResolveResult,
  NameResolver,
  ResolveOptions,
} from "./types.js";

/**
 * Provider registry: maps provider ids to NameResolver implementations.
 * New naming systems register here without changing the core resolve flow.
 */
export class NameResolverRegistry {
  private readonly resolvers = new Map<string, NameResolver>();
  private readonly rules: readonly ExternalNamespaceRule[];

  constructor(rules: readonly ExternalNamespaceRule[] = EXTERNAL_NAMESPACE_RULES) {
    this.rules = rules;
  }

  register(resolver: NameResolver): void {
    this.resolvers.set(resolver.provider, resolver);
  }

  get(provider: string): NameResolver | undefined {
    return this.resolvers.get(provider);
  }

  listProviders(): string[] {
    return [...this.resolvers.keys()];
  }

  canResolve(identifier: string): boolean {
    const match = matchExternalNamespace(identifier, this.rules);
    if (!match) return false;
    const resolver = this.resolvers.get(match.provider);
    return Boolean(resolver?.canResolve(identifier));
  }

  async resolve(
    identifier: string,
    options?: ResolveOptions,
  ): Promise<ExternalResolveResult> {
    const match = matchExternalNamespace(identifier, this.rules);
    if (!match) {
      return {
        ok: false,
        code: "UNSUPPORTED_NAMESPACE",
        message: "Identifier does not match a supported external naming namespace.",
      };
    }

    const resolver = this.resolvers.get(match.provider);
    if (!resolver) {
      return {
        ok: false,
        code: "UNSUPPORTED_NAMESPACE",
        message: `No resolver registered for provider "${match.provider}".`,
        match,
      };
    }

    if (!resolver.canResolve(identifier)) {
      return {
        ok: false,
        code: "UNSUPPORTED_NAMESPACE",
        message: `Provider "${match.provider}" cannot resolve this identifier.`,
        match,
      };
    }

    return resolver.resolve(identifier, options);
  }
}

export function isExternalNameCandidate(identifier: string): boolean {
  return isExternalNamespaceName(identifier);
}

export type { ExternalNamingEnv };
