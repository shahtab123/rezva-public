"use client";

import { ApplicationLanding } from "@/components/dashboard/ApplicationLanding";
import { useDashboardState } from "@/components/dashboard/DashboardStateProvider";

const providerFields = [
  {
    group: "Product",
    label: "Wallet / product name",
    hint: "Company, wallet, or project name",
    placeholder: "e.g. Atlas Wallet",
  },
  {
    group: "Product",
    label: "Website",
    type: "url" as const,
    placeholder: "https://",
  },
  {
    group: "Product",
    label: "Applicant type",
    type: "select" as const,
    placeholder: "Select type",
    options: ["Wallet company", "Individual developer", "Organization", "Other"],
  },
  {
    group: "Product",
    label: "Wallet type",
    type: "select" as const,
    placeholder: "Select wallet type",
    options: ["Consumer wallet", "Merchant wallet", "Exchange", "Infrastructure", "Other"],
  },
  {
    group: "Integration",
    label: "Supported chains",
    wide: true,
    hint: "Comma-separated for now; structured later",
    placeholder: "e.g. base, ethereum, polygon",
  },
  {
    group: "Integration",
    label: "Existing platform",
    placeholder: "App stores, web app, SDK, etc.",
  },
  {
    group: "Integration",
    label: "Expected usage",
    type: "textarea" as const,
    wide: true,
    hint: "Approximate resolve volume and markets",
    placeholder: "Expected monthly resolve volume and regions",
  },
  {
    group: "Contact",
    label: "Contact email",
    type: "email" as const,
    officialEmail: true,
    matchDomainFrom: "Website",
    hint: "Official company email only. Domain must match your website.",
    placeholder: "you@yourcompany.com",
  },
  {
    group: "Contact",
    label: "Contact email 2",
    type: "email" as const,
    optional: true,
    officialEmail: true,
    matchDomainFrom: "Website",
    hint: "Secondary official contact (optional). Same domain rules apply.",
    placeholder: "security@yourcompany.com",
  },
];

const benefits = [
  "Provider credentials",
  "Integration checklist",
  "API keys and usage",
  "Sandbox tooling",
];

export default function ProviderApplyPage() {
  const { applications } = useDashboardState();
  return (
    <ApplicationLanding
      track="provider"
      title="Apply as a wallet provider"
      lede="Wallets and platforms apply for resolution access. After approval you get credentials, usage views, and sandbox tooling in this console."
      application={applications.provider}
      fields={providerFields}
      benefits={benefits}
    />
  );
}
