import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load root monorepo env (.env.local / .env) into process.env for this Next app.
loadEnvConfig(path.join(__dirname, ".."));

const nextConfig: NextConfig = {
  transpilePackages: ["@privy-io/react-auth", "@universal-payment/sdk"],
  // Next 16 defaults to Turbopack on `next build`. Keep an empty turbopack
  // config so Vercel (which may run plain `next build`) doesn't fail because
  // we also define a webpack() hook for local `--webpack` builds.
  turbopack: {},
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /node_modules[\\/]ox[\\/]_esm[\\/]tempo[\\/]internal[\\/]virtualMasterPool/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
  // Turbopack only auto-inlines NEXT_PUBLIC_* from website/.env* -
  // expose root monorepo values to the client bundle explicitly.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-admin-auth-secret-change-me",
  },
};

export default nextConfig;
