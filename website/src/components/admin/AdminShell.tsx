import Link from "next/link";
import { auth, signOut } from "@/lib/admin/auth";
import { BrandMark } from "@/components/BrandMark";
import { AdminNav } from "./AdminNav";
import { AdminGlobalSearch } from "./AdminGlobalSearch";
import { AdminNotifyRail, type AdminQueueBadges } from "./AdminNotifyRail";
import { overviewCounts } from "@/lib/admin/store";
import { getAdminComplaintPanelRows } from "@/lib/admin/live-registry";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const counts = await overviewCounts();
  const { rows: complaints } = await getAdminComplaintPanelRows();
  const newComplaints = complaints.filter((c) => c.status === "submitted").length;

  const badges: AdminQueueBadges = {
    pendingBusiness: counts.pendingBusinessApplications,
    pendingProvider: counts.pendingProviderApplications,
    pendingDictionary: counts.pendingDictionary,
    newComplaints,
  };

  const navBadges: Record<string, number> = {
    "/admin/applications/businesses/pending": badges.pendingBusiness,
    "/admin/applications/providers/pending": badges.pendingProvider,
    "/admin/registry/name-reviews": badges.pendingDictionary,
    "/admin/complaints/new": badges.newComplaints,
  };

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link href="/admin" className="admin-brand">
            <BrandMark size={32} className="brand-mark" />
            <span>
              <strong>Rezva Admin</strong>
              <small>Protocol control plane</small>
            </span>
          </Link>
        </div>

        <AdminGlobalSearch />

        <AdminNav badges={navBadges} />

        <div className="admin-sidebar-foot">
          <div className="admin-user-chip">
            <strong>{user?.name ?? user?.username ?? "Admin"}</strong>
            <span>
              {user?.username} · {user?.accountType?.replaceAll("_", " ")}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="admin-btn" style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <AdminNotifyRail badges={badges} />

      <main className="admin-main">{children}</main>
    </div>
  );
}
