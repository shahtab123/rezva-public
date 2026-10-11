import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import {
  findAdminByUsername,
  markAdminLogin,
  appendAudit,
  verifyPassword,
} from "./store";
import { ALL_ADMIN_PERMISSIONS, effectivePermissions } from "./types";

function envAdminUser(username: string, password: string) {
  const envUser = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envPass || username !== envUser || password !== envPass) {
    return null;
  }
  return {
    id: "admin_env",
    name: "Protocol Admin",
    email: `${envUser}@admin.local`,
    username: envUser,
    accountType: "super_admin" as const,
    permissions: [...ALL_ADMIN_PERMISSIONS],
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Admin credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) {
          return null;
        }

        const fromEnv = envAdminUser(username, password);
        if (fromEnv) {
          try {
            appendAudit({
              adminId: fromEnv.id,
              adminUsername: fromEnv.username,
              action: "admin.login",
              resourceType: "admin_session",
              resourceId: fromEnv.id,
              newState: "authenticated",
            });
          } catch {
            // Audit is best-effort on serverless.
          }
          return fromEnv;
        }

        const user = findAdminByUsername(username);
        if (!user || user.status !== "active") {
          return null;
        }
        if (!verifyPassword(password, user.passwordHash)) {
          return null;
        }

        try {
          markAdminLogin(user.id);
          appendAudit({
            adminId: user.id,
            adminUsername: user.username,
            action: "admin.login",
            resourceType: "admin_session",
            resourceId: user.id,
            newState: "authenticated",
          });
        } catch {
          // Login must succeed even if the local admin store cannot persist.
        }

        return {
          id: user.id,
          name: user.displayName,
          email: `${user.username}@admin.local`,
          username: user.username,
          accountType: user.accountType,
          permissions: effectivePermissions(user),
        };
      },
    }),
  ],
});
