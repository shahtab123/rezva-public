import { DM_Sans, Space_Grotesk } from "next/font/google";

export const homeDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-home-display",
  weight: ["500", "600", "700"],
});

export const homeSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-home-sans",
  weight: ["400", "500", "600", "700"],
});
