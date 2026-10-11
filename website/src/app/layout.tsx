import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PrivyProviders } from "@/components/auth/PrivyProviders";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Rezva - Payment Resolution Layer",
  description:
    "Resolve existing identifiers into crypto payment destinations across compatible wallets. Scan. Resolve. Pay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col antialiased">
        <PrivyProviders>{children}</PrivyProviders>
        <Analytics />
      </body>
    </html>
  );
}
