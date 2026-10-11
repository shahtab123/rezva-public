export type DocsNavItem = {
  title: string;
  href: string;
  external?: boolean;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

export const docsNav: DocsNavSection[] = [
  {
    title: "Introduction",
    items: [
      { title: "Overview", href: "/docs/introduction/overview" },
      { title: "How It Works", href: "/docs/introduction/how-it-works" },
      { title: "User Experience", href: "/docs/introduction/user-experience" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { title: "Console Overview", href: "/docs/dashboard/console-overview" },
      { title: "Which API key?", href: "/docs/dashboard/console-overview#api-keys" },
      { title: "Business / Users Track", href: "/docs/dashboard/business-track" },
      { title: "Wallet Provider Track", href: "/docs/dashboard/wallet-provider-track" },
      { title: "Provider Namespaces", href: "/docs/dashboard/provider-namespaces" },
    ],
  },
  {
    title: "Free API",
    items: [
      { title: "Free API and Test Merchant", href: "/docs/dashboard/free-api" },
      { title: "Free API vs provider key", href: "/docs/dashboard/free-api#not-provider" },
    ],
  },
  {
    title: "Testing",
    items: [
      { title: "Testing guide", href: "/docs/dashboard/testing-guide" },
      { title: "Test wallets (Mobile / Rabby)", href: "/docs/reference/compatible-wallets" },
    ],
  },
  {
    title: "For Wallets",
    items: [
      { title: "Quickstart", href: "/docs/for-wallets/quickstart" },
      { title: "Integration", href: "/docs/for-wallets/integration" },
      { title: "Authentication", href: "/docs/for-wallets/authentication" },
      { title: "API Reference", href: "/docs/for-wallets/api-reference" },
      { title: "Merchant Setup", href: "/docs/for-wallets/merchant-setup" },
      { title: "Namespace API", href: "/docs/for-wallets/namespace-api" },
      { title: "SDKs and integration recipes", href: "/docs/for-wallets/sdks" },
    ],
  },
  {
    title: "AI & Developer Resources",
    items: [
      { title: "OpenAPI spec", href: "/openapi.json", external: true },
      { title: "LLM guide", href: "/llms.txt", external: true },
      { title: "Full LLM reference", href: "/llms-full.txt", external: true },
    ],
  },
  {
    title: "For Merchants",
    items: [
      { title: "Getting Started", href: "/docs/for-merchants/getting-started" },
      {
        title: "Register an Identifier",
        href: "/docs/for-merchants/register-an-identifier",
      },
      {
        title: "Manage Identifiers",
        href: "/docs/for-merchants/manage-identifiers",
      },
      {
        title: "Payment Destinations",
        href: "/docs/for-merchants/payment-destinations",
      },
      { title: "Complaints", href: "/docs/for-merchants/complaints" },
    ],
  },
  {
    title: "Protocol",
    items: [
      { title: "Specification", href: "/docs/protocol/specification" },
      { title: "Identifier Registry", href: "/docs/protocol/identifier-registry" },
      { title: "Identifier Types", href: "/docs/protocol/identifier-types" },
      { title: "Security", href: "/docs/protocol/security" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Errors", href: "/docs/reference/errors" },
      { title: "Statuses", href: "/docs/reference/statuses" },
      { title: "Changelog", href: "/docs/reference/changelog" },
    ],
  },
];
