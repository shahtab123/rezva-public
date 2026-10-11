import Link from "next/link";
import { adminGlobalSearch } from "@/lib/admin/search";
import { AdminPageHeader } from "@/components/admin/ui";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const hits = await adminGlobalSearch(q);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Search"
        title={q.trim() ? `Results for “${q.trim()}”` : "Global search"}
        description="Jump to applications, identifiers, protected names, complaints, and providers."
      />

      <form method="get" className="admin-card" style={{ marginBottom: 14, maxWidth: 560 }}>
        <div className="admin-field">
          <label htmlFor="admin-search-q">Search</label>
          <input
            id="admin-search-q"
            name="q"
            defaultValue={q}
            placeholder="Application id, identifier, name, complaint…"
            autoFocus
          />
        </div>
        <button type="submit" className="admin-btn admin-btn-primary">
          Search
        </button>
      </form>

      {q.trim().length < 2 ? (
        <p className="admin-lede">Enter at least 2 characters.</p>
      ) : hits.length === 0 ? (
        <p className="admin-lede">No matches.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-compact">
            <thead>
              <tr>
                <th>Type</th>
                <th>Label</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((hit) => (
                <tr key={`${hit.kind}-${hit.id}`}>
                  <td>{hit.kind}</td>
                  <td>
                    <Link href={hit.href}>
                      <strong>{hit.label}</strong>
                    </Link>
                    <div className="admin-cell-sub">{hit.id}</div>
                  </td>
                  <td className="admin-cell-muted">{hit.sublabel ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
