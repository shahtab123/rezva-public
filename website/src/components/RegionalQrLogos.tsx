export type RegionalQrScheme = {
  id: string;
  scheme: string;
  country: string;
  logoSrc: string;
  logoAlt: string;
  /** Black/white marks need invert on dark backgrounds */
  mono?: boolean;
};

export const regionalQrExamples: RegionalQrScheme[] = [
  {
    id: "bangla-qr",
    scheme: "Bangla QR",
    country: "Bangladesh",
    logoSrc: "/regional-qr/bangla-qr.svg",
    logoAlt: "Bangla QR logo",
  },
  {
    id: "qris",
    scheme: "QRIS",
    country: "Indonesia",
    logoSrc: "/regional-qr/qris.svg",
    logoAlt: "QRIS logo",
  },
  {
    id: "sgqr",
    scheme: "SGQR+",
    country: "Singapore",
    logoSrc: "/regional-qr/sgqr.png",
    logoAlt: "SGQR+ logo",
  },
  {
    id: "bhim",
    scheme: "BHIM / Bharat QR",
    country: "India",
    logoSrc: "/regional-qr/bhim.png",
    logoAlt: "BHIM Bharat Interface for Money logo",
  },
  {
    id: "duitnow",
    scheme: "DuitNow QR",
    country: "Malaysia",
    logoSrc: "/regional-qr/duitnow.png",
    logoAlt: "DuitNow logo",
  },
  {
    id: "pix",
    scheme: "Pix",
    country: "Brazil",
    logoSrc: "/regional-qr/pix.png",
    logoAlt: "Pix Banco Central logo",
  },
  {
    id: "cash-app",
    scheme: "Cash App",
    country: "United States",
    logoSrc: "/regional-qr/cash-app.svg",
    logoAlt: "Cash App logo",
  },
  {
    id: "paypal",
    scheme: "PayPal",
    country: "Global",
    logoSrc: "/regional-qr/paypal.svg",
    logoAlt: "PayPal logo",
  },
];
