export type CompatibleWalletStatus = "live" | "beta" | "coming-soon";

export type CompatibleWallet = {
  id: string;
  name: string;
  status: CompatibleWalletStatus;
  resolver: boolean;
  merchantSetup: boolean;
  href: string;
  /** Short subtitle under the name. */
  blurb?: string;
};

/** Reference clients for Free API / resolve testing (not production-approved wallet listings). */
export const compatibleWallets: CompatibleWallet[] = [
  {
    id: "mobilewallet-rezva",
    name: "Mobile wallet",
    status: "beta",
    resolver: true,
    merchantSetup: false,
    href: "https://github.com/shahtab123/mobilewallet_rezva",
    blurb: "Expo / Android · Send, identifiers, QR scan",
  },
  {
    id: "rabby-chrome-rezva",
    name: "Rabby (Chrome)",
    status: "beta",
    resolver: true,
    merchantSetup: false,
    href: "https://github.com/shahtab123/rabby_chrome_rezva",
    blurb: "Rabby clone · Rezva resolve in Send",
  },
];

export const compatibleWalletStatusLabel: Record<CompatibleWalletStatus, string> =
  {
    live: "Live",
    beta: "Beta",
    "coming-soon": "Coming soon",
  };
