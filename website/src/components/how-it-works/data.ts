export const howItWorksIntro =
  "Rezva is a shared payment resolution layer. Customers pay through a compatible wallet. Merchants register identifiers once. Wallet apps look up destinations without rebuilding their payment rails.";

export const howItWorksOverview = {
  title: "What Rezva does",
  body:
    "Rezva sits between identifiers people already know and the crypto destinations payments should reach. It does not hold funds, run card rails, or replace apps like bKash or PayPal. Compatible wallets ask Rezva where an identifier points, then settle the payment themselves.",
  points: [
    "Not a wallet and not a custodian",
    "Not a payment processor or settlement network",
    "A shared lookup layer any approved wallet can call",
    "One registration can serve many compatible wallets",
    "Supports phones, emails, regional QR, custom IDs, provider namespaces, and external names (.eth, .sol, .base, Unstoppable TLDs) via the same resolve API",
  ],
} as const;

export const howItWorksUsers = {
  title: "For users",
  lede: "If you want to pay someone, you stay in a compatible wallet. Rezva helps that wallet find where to send the payment.",
  steps: [
    {
      title: "Scan or enter an identifier",
      body:
        "Use a phone number, Bangla QR / EMV payload, email, merchant ID, custom handle, a provider name such as alice.rabby, or an external name such as alice.eth inside your wallet’s send flow.",
      },
    {
      title: "Your wallet resolves it",
      body:
        "The wallet calls Rezva with the typed value (same API for Rezva identifiers and external names). You do not need the merchant’s own app, and you do not paste a raw chain address unless you choose to.",
    },
    {
      title: "Review the options",
      body:
        "Your wallet shows payable networks, assets, and destinations it supports. It can also surface safety signals such as pending activation or a recently changed destination.",
    },
    {
      title: "Confirm and pay",
      body:
        "Pick an option and confirm in your wallet. Rezva does not move the money. Your wallet signs and broadcasts the transaction.",
    },
  ],
} as const;

export const howItWorksMerchants = {
  title: "For merchants",
  lede:
    "A merchant, creator, freelancer, or any controller registers identifiers people already recognize and links them to where crypto payments should arrive.",
  steps: [
    {
      title: "Apply on the business track",
      body:
        "Sign in to the Rezva dashboard, connect a controller wallet, and complete business approval before registering production identifiers.",
    },
    {
      title: "Register an identifier",
      body:
        "Add a phone, email, Bangla QR string, merchant ID, PayPal handle, custom identifier, or another active type. Full regional QR text can be registered and matched exactly.",
    },
    {
      title: "Link payment destinations",
      body:
        "Choose the chain, asset, and receiving address for that identifier. Destinations can be updated later with the same controller authorization.",
    },
    {
      title: "Get paid from compatible wallets",
      body:
        "Register once. Customers can pay from different wallet apps as long as those wallets support Rezva resolution for that type.",
    },
  ],
  note:
    "New identifiers may stay pending for a short safety period before they become payable. Destination changes can enter update_pending so wallets can warn users when a mapping was recently updated.",
} as const;

export const howItWorksWallets = {
  title: "For wallets",
  lede:
    "Wallet providers add Rezva beside the payment flow they already have. They keep signing, custody model, and settlement. Rezva only answers where an identifier points.",
  levels: [
    {
      title: "Resolver only",
      body:
        "The smallest integration. Resolve identifiers and show destinations inside the wallet’s existing send UI.",
      items: [
        "POST /v1/resolve with an approved provider key or Free API key",
        "Accept typed values including full Bangla / EMV QR payloads",
        "Resolve provider names such as alice.rabby",
        "Show status, payment readiness, and safety timestamps",
        "Pay with the wallet’s existing transaction flow",
      ],
    },
    {
      title: "Resolver + merchant setup",
      body:
        "Everything in resolver only, plus flows for controllers to register and manage identifiers from the wallet.",
      items: [
        "Check identifier availability",
        "Register identifiers and payment destinations",
        "Update or remove mappings with controller authorization",
        "Offer merchant setup without sending users to a separate app",
      ],
    },
    {
      title: "Provider namespaces",
      body:
        "Approved wallet providers can claim a namespace (for example .rabby) and register payable names under it.",
      items: [
        "Apply for a namespace in the provider dashboard",
        "Register names like shop.rabby with a destination wallet",
        "Resolve them as type provider_name through the same API",
        "Keep namespace policy and reserved labels under provider control",
      ],
    },
  ],
  note:
    "Production resolver access is permissioned. Providers apply, get reviewed, and receive credentials. Free API keys are for prototypes and the shared Test Merchant only.",
} as const;

export const howItWorksIdentifiers = {
  title: "Identifiers",
  lede:
    "Identifier types are lookup namespaces. They help wallets find a destination. They do not replace the original payment network behind a phone number, QR scheme, or app username.",
  items: [
    {
      title: "Phone & email",
      body: "Normalized contact identifiers for high-sensitivity mappings.",
    },
    {
      title: "Bangla QR / EMV",
      body: "Full regional QR payloads (up to 700 characters) matched as the exact registered string.",
    },
    {
      title: "Merchant ID, PayPal, bKash, custom",
      body: "Familiar merchant handles and operator-controlled custom values where enabled.",
    },
    {
      title: "Provider names",
      body: "Namespace names such as alice.rabby resolved as provider_name after the provider registers them.",
    },
    {
      title: "Protocol native names",
      body: "Protected or dictionary-reviewed names when the registry policy allows them.",
    },
  ],
  note:
    "Wallets should discover active types from GET /v1/identifier-types instead of hard-coding the set. Eligibility for registration and resolution can change independently.",
} as const;
