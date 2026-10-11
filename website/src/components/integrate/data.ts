export const integrateHero = {
  title: "Integrate with Rezva",
  lede:
    "Connect your application to a shared payment identity layer.",
  body:
    "Use Rezva APIs to register payment identifiers, resolve payment destinations, and connect your application with compatible wallets and payment systems.",
} as const;

export const integrateFeatures = {
  title: "Build with Rezva",
  items: [
    {
      title: "Register identifiers",
      body:
        "Create and manage usernames, merchant IDs, and other payment identifiers through the Rezva API.",
    },
    {
      title: "Resolve payment destinations",
      body:
        "Use a Rezva identifier to find the payment destination associated with it.",
    },
    {
      title: "Connect payment systems",
      body:
        "Integrate Rezva into your wallet, payment app, merchant platform, or other payment service.",
    },
    {
      title: "One shared layer",
      body:
        "Instead of building your own separate identifier and resolution system, use Rezva as the layer between compatible payment systems.",
    },
  ],
} as const;

export const integrateSteps = {
  title: "How It Works",
  items: [
    {
      number: "01",
      title: "Open the dashboard",
      body: "Go to /dashboard - one console for businesses and wallet providers.",
    },
    {
      number: "02",
      title: "Apply for your track",
      body: "Business applicants manage identifiers after approval. Wallet providers unlock integration tooling after approval.",
    },
    {
      number: "03",
      title: "Complete review",
      body: "Each track unlocks only after operator approval. Rejected applications can reapply.",
    },
    {
      number: "04",
      title: "Integrate",
      body: "Approved providers use API credentials and docs. Approved businesses manage identifiers and destinations.",
    },
  ],
} as const;

export const integrateAudiences = {
  title: "Built for",
  items: [
    {
      title: "Wallets",
      body:
        "Give your wallet the ability to work with Rezva identifiers and resolve payment destinations.",
    },
    {
      title: "Payment Apps",
      body:
        "Add interoperable payment identity and destination resolution to your application.",
    },
    {
      title: "Merchant Platforms",
      body:
        "Give merchants a reusable identifier that compatible wallets can resolve.",
    },
    {
      title: "Other Payment Services",
      body:
        "Build your own payment experience using Rezva as the underlying identity and resolution layer.",
    },
  ],
} as const;

export const integratePricing = {
  title: "Simple, usage-based pricing",
  lede:
    "Coming soon - pricing is currently being built. Until then, get started free through the dashboard and docs.",
  statusLabel: "In the future",
  statusBody:
    "Plans and usage metering are under construction. We’ll publish clear Free / Pro options here when they’re ready.",
} as const;

export const integrateFinalCta = {
  title: "Start building with Rezva",
  body:
    "Connect your application to the payment identity layer built for interoperability.",
} as const;
