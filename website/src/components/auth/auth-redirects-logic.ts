/**
 * Pure auth navigation transitions (used by AuthRedirects + tests).
 * Returns the path to replace, or null if no navigation.
 */
export function resolveAuthRedirect(input: {
  ready: boolean;
  bootstrapped: boolean;
  wasAuthenticated: boolean;
  authenticated: boolean;
  pathname: string;
}): {
  bootstrapped: boolean;
  wasAuthenticated: boolean;
  redirectTo: string | null;
} {
  if (!input.ready) {
    return {
      bootstrapped: input.bootstrapped,
      wasAuthenticated: input.wasAuthenticated,
      redirectTo: null,
    };
  }

  if (!input.bootstrapped) {
    return {
      bootstrapped: true,
      wasAuthenticated: input.authenticated,
      redirectTo: null,
    };
  }

  if (input.authenticated && !input.wasAuthenticated) {
    return {
      bootstrapped: true,
      wasAuthenticated: true,
      redirectTo: input.pathname.startsWith("/dashboard") ? null : "/dashboard",
    };
  }

  if (!input.authenticated && input.wasAuthenticated) {
    return {
      bootstrapped: true,
      wasAuthenticated: false,
      redirectTo: "/",
    };
  }

  return {
    bootstrapped: true,
    wasAuthenticated: input.wasAuthenticated,
    redirectTo: null,
  };
}
