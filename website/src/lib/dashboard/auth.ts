import { PrivyClient } from "@privy-io/server-auth";
import { ProtocolApiError } from "@universal-payment/sdk";

export type DashboardUser = {
  userId: string;
  controllerWallet: string | null;
};

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    return null;
  }
  if (!privyClient) {
    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireDashboardUser(request: Request): Promise<DashboardUser> {
  const token = readBearerToken(request);
  const controllerWallet =
    request.headers.get("x-controller-wallet")?.trim().toLowerCase() ?? null;

  const privy = getPrivyClient();
  if (privy && token) {
    try {
      const claims = await privy.verifyAuthToken(token);
      const privyUser = await privy.getUser(claims.userId);
      const linkedWallets = privyUser.linkedAccounts.flatMap((account) => {
        if (
          (account.type === "wallet" || account.type === "smart_wallet") &&
          "address" in account &&
          typeof account.address === "string" &&
          account.address.length > 0
        ) {
          return [account.address.toLowerCase()];
        }
        return [];
      });

      if (process.env.NODE_ENV === "production" && linkedWallets.length === 0) {
        throw new DashboardAuthError(
          "Link a controller wallet to your account before using the dashboard.",
          400,
        );
      }

      if (
        controllerWallet &&
        linkedWallets.length > 0 &&
        !linkedWallets.includes(controllerWallet)
      ) {
        throw new DashboardAuthError("Controller wallet is not linked to this session", 403);
      }

      // Prefer a Privy-linked wallet. Only fall back to the client header when
      // Privy returned no wallets (local/dev typing quirks) and not in production.
      const resolvedWallet =
        (controllerWallet && linkedWallets.includes(controllerWallet)
          ? controllerWallet
          : null) ??
        linkedWallets[0] ??
        (process.env.NODE_ENV === "production" ? null : controllerWallet);

      return {
        userId: claims.userId,
        controllerWallet: resolvedWallet,
      };
    } catch (error) {
      if (error instanceof DashboardAuthError) {
        throw error;
      }
      throw new DashboardAuthError("Invalid session token", 401);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const devUserId =
      request.headers.get("x-dashboard-user-id")?.trim() ??
      new URL(request.url).searchParams.get("userId")?.trim();
    if (devUserId) {
      return { userId: devUserId, controllerWallet };
    }
  }

  throw new DashboardAuthError("Authentication required", 401);
}

export class DashboardAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DashboardAuthError";
    this.status = status;
  }
}

export function dashboardAuthResponse(error: unknown) {
  if (error instanceof DashboardAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ProtocolApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status >= 400 && error.status < 600 ? error.status : 400 },
    );
  }
  const message = error instanceof Error ? error.message : "Internal error";
  const status =
    error instanceof Error &&
    (message.includes("Link a controller wallet") || message.includes("controller wallet"))
      ? 400
      : 500;
  return Response.json({ error: message }, { status });
}
