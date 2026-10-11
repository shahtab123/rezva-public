"use client";

import { ApplicationLanding } from "@/components/dashboard/ApplicationLanding";
import { useDashboardState } from "@/components/dashboard/DashboardStateProvider";

const businessFields = [
  {
    group: "Profile",
    label: "Display name",
    hint: "Business, project, or individual operator name",
    placeholder: "e.g. Northwind Market",
  },
  {
    group: "Profile",
    label: "Country / region",
    type: "select" as const,
    placeholder: "Select country",
    options: ["Bangladesh", "United States", "United Kingdom", "Singapore", "Other"],
  },
  {
    group: "Profile",
    label: "Applicant type",
    type: "select" as const,
    placeholder: "Select type",
    options: ["Business", "Individual", "Organization", "Other"],
  },
  {
    group: "Profile",
    label: "Description",
    type: "textarea" as const,
    wide: true,
    hint: "What you sell or operate, and how resolution helps",
    placeholder: "Brief description of your use case",
  },
  {
    group: "Verification",
    label: "Google Maps location",
    type: "url" as const,
    wide: true,
    hint: "Share link from Google Maps for your business location",
    placeholder: "https://maps.google.com/…",
  },
  {
    group: "Verification",
    label: "Website",
    type: "url" as const,
    optional: true,
    hint: "If you have one",
    placeholder: "https://",
  },
  {
    group: "Verification",
    label: "Social",
    type: "text" as const,
    optional: true,
    wide: true,
    hint: "Facebook, Instagram, X, etc.",
    placeholder: "https://instagram.com/yourpage",
  },
  {
    group: "Contact",
    label: "Contact email",
    type: "email" as const,
    placeholder: "you@example.com",
  },
];

const benefits = [
  "Native name and profile",
  "Identifier registration",
  "Payment destinations",
  "Activity and settings",
];

export default function BusinessApplyPage() {
  const { applications } = useDashboardState();
  return (
    <ApplicationLanding
      track="business"
      title="Apply to register identifiers"
      lede="Businesses and individual users apply once. After approval you can register identifiers and payment destinations that compatible wallets resolve."
      application={applications.business}
      fields={businessFields}
      benefits={benefits}
    />
  );
}
