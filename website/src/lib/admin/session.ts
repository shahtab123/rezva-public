import { auth } from "./auth";
import { hasPermission, type AdminPermission } from "./types";

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function adminHasPermission(permission: AdminPermission): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;
  return hasPermission(
    {
      accountType: session.user.accountType,
      permissions: session.user.permissions,
      status: "active",
    },
    permission,
  );
}
