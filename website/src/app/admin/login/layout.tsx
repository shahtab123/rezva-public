import { Suspense } from "react";
import { AdminSessionProvider } from "@/components/admin/AdminSessionProvider";
import "../admin.css";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      <Suspense fallback={<div className="admin-login">Loading…</div>}>
        {children}
      </Suspense>
    </AdminSessionProvider>
  );
}
