export const docsHowItWorksSections = [
  {
    id: "resolution-model",
    title: "Resolution model",
    lede:
      "Rezva maps an identifier type and value to crypto payment destinations through a resolver. It does not settle, custody, or bridge the original payment network tied to that identifier.",
    blocks: [
      {
        type: "code" as const,
        lines: [
          "Identifier Type + Identifier Value",
          "            ↓",
          "         Resolver",
          "            ↓",
          "  Crypto Payment Destination",
        ],
      },
      {
        type: "text" as const,
        body:
          "Supported identifier types include phone numbers, QR payloads, merchant IDs, email addresses, PayPal usernames, custom identifiers, and protocol-native names. The type system is extensible.",
      },
    ],
  },
  {
    id: "protocol-boundary",
    title: "Protocol boundary",
    lede:
      "The resolver discovers payment options and safety metadata. The integrated wallet validates the result, presents options, signs, and settles onchain.",
    list: [
      "Resolver returns normalized identifiers, payment readiness, safety timestamps, and compatible payment options.",
      "The wallet executes the transaction using its existing signing and broadcast infrastructure.",
      "Rezva does not initiate, sign, broadcast, custody, or settle blockchain transactions.",
    ],
  },
  {
    id: "controller-model",
    title: "Controller model",
    lede:
      "Registration and management are controller-scoped. A controller owns the mappings attached to their identifiers.",
    blocks: [
      {
        type: "code" as const,
        lines: [
          "Controller",
          "    ↓",
          "Profile / Name",
          "    ↓",
          "Identifiers",
          "    ↓",
          "Crypto payment destinations",
        ],
      },
      {
        type: "text" as const,
        body:
          "Controller authorization is separate from wallet-provider authorization. An approved provider credential does not grant ownership of a controller's identifiers.",
      },
    ],
  },
  {
    id: "integration-levels",
    title: "Wallet integration levels",
    lede:
      "Approved wallet providers integrate one of two capability levels. These are hard capability rules.",
    cards: [
      {
        title: "Resolver only",
        items: [
          "Resolve identifiers",
          "Scan or parse supported identifier carriers",
          "Present payment options and safety metadata",
          "Pay through the wallet's existing transaction flow",
          "Must not expose registration, update, or removal",
        ],
      },
      {
        title: "Resolver + merchant setup",
        items: [
          "Everything in Resolver only",
          "Name and identifier availability checks",
          "Register identifiers and payment destinations",
          "Update or remove controller mappings",
        ],
      },
    ],
  },
  {
    id: "registration-paths",
    title: "Registration paths",
    lede:
      "Controllers (businesses or individual users) may register and manage mappings through the official dashboard Business / Users track (after application approval) or through an approved wallet that implements merchant setup. Compatible wallets that integrate Rezva resolve can look those identifiers up.",
    list: [
      "Official website: connect wallet, claim one name, register up to 2 identifiers and payment destinations (existing identifiers above the cap stay active).",
      "Partner wallet: the same controller flow may be offered inside an approved wallet application; each provider sets its own per-controller identifier limits.",
      "The controller does not need to use a specific wallet application to maintain a mapping.",
    ],
  },
  {
    id: "lifecycle-and-safety",
    title: "Lifecycle and safety",
    lede:
      "Protocol state affects whether a mapping is payable and how wallets should warn users.",
    list: [
      "New registrations may enter PENDING before becoming payment-active. Wallets must not treat PENDING mappings as normal payable destinations.",
      "Payment destination changes may enter UPDATE_PENDING. Wallets must surface recent destination changes using protocol timestamps such as last_payment_update.",
      "Important safety fields include registered_at, activated_at, last_updated, and last_payment_update.",
      "Production resolver access is permissioned to approved integrations with rate limits and anti-enumeration controls.",
    ],
  },
  {
    id: "external-systems",
    title: "External payment systems",
    lede:
      "Existing networks such as bKash, Nagad, PayPal, Bangla QR, UPI, Pix, and PromptPay are lookup namespaces, not settlement integrations.",
    list: [
      "The original payment network does not process the crypto transaction.",
      "The same QR or username may still be interpreted by its original application.",
      "A compatible crypto wallet may use the same identifier as a lookup key through Rezva.",
      "No cooperation or API access from the original payment provider is required for resolution.",
    ],
  },
] as const;
