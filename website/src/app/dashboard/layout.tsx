import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard - Rezva",
  description: "Business, user, and wallet provider resolution console.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
