import { getAdminStore } from "@/lib/admin/store";
import { AdminPageHeader } from "@/components/admin/ui";

export default function AdminSettingsPage() {
  const store = getAdminStore();

  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="Settings"
        description="Admin accounts use Auth.js credentials today. Account types and permissions are ready for a higher-security upgrade."
      />

      <div className="admin-notice">
        Default seeded account: <span className="admin-code">admin</span> /{" "}
        <span className="admin-code">admin</span> (hashed in{" "}
        <span className="admin-code">website/.data/admin-store.json</span>). Set{" "}
        <span className="admin-code">AUTH_SECRET</span> in env for production.
      </div>

      <section className="admin-card">
        <h2>Admin accounts</h2>
        <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display name</th>
                <th>Account type</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              {store.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.displayName}</td>
                  <td>{user.accountType}</td>
                  <td>{user.permissions.length} grants</td>
                  <td>{user.status}</td>
                  <td>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
