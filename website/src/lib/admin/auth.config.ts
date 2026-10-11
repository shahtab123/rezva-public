import type { NextAuthConfig } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { AdminAccountType, AdminPermission } from "./types";

declare module "next-auth" {
  interface User {
    username?: string;
    accountType?: AdminAccountType;
    permissions?: AdminPermission[];
  }

  interface Session {
    user: {
      id: string;
      username: string;
      accountType: AdminAccountType;
      permissions: AdminPermission[];
    } & DefaultSession["user"];
  }
}

type AdminToken = {
  id?: string;
  username?: string;
  accountType?: AdminAccountType;
  permissions?: AdminPermission[];
};

/** Edge-safe Auth.js config - no node:crypto / fs (used by middleware). */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "dev-admin-auth-secret-change-me",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const adminToken = token as typeof token & AdminToken;
      if (user) {
        adminToken.id = user.id;
        adminToken.username = user.username;
        adminToken.accountType = user.accountType;
        adminToken.permissions = user.permissions;
      }
      return adminToken;
    },
    async session({ session, token }) {
      const adminToken = token as typeof token & AdminToken;
      session.user = {
        ...session.user,
        id: String(adminToken.id ?? ""),
        username: String(adminToken.username ?? ""),
        accountType: adminToken.accountType ?? "read_only",
        permissions: adminToken.permissions ?? [],
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
