import {
  addDictionaryEntryAction,
  removeDictionaryEntryAction,
} from "@/lib/admin/actions";
import Link from "next/link";
import { listDictionaryEntryMeta } from "@/lib/admin/store";
import { RESTRICTED_NAME_COUNTS, RESTRICTED_NAME_SOURCES } from "@/lib/restricted-names-data";
import { AdminRowAction, AdminRowActions } from "@/components/admin/AdminRowAction";

export function DictionaryEntriesPanel({
  query,
  canReview = true,
}: {
  query?: string;
  canReview?: boolean;
}) {
  const q = (query ?? "").trim().toLowerCase();
  const entries = listDictionaryEntryMeta().filter((entry) =>
    q ? entry.name.includes(q) || entry.category.includes(q) : true,
  );
  const total = listDictionaryEntryMeta().length;

  return (
    <section className="admin-card admin-dictionary-entries">
      <div className="admin-dictionary-entries-head">
        <div>
          <h2>Dictionary entries</h2>
          <p className="admin-lede" style={{ margin: "6px 0 0" }}>
            {total} protected names requiring elevated verification before activation. Includes{" "}
            {RESTRICTED_NAME_COUNTS.crypto} crypto exchanges, wallets, cards, and DeFi brands from{" "}
            <span className="admin-code">{RESTRICTED_NAME_SOURCES.cryptoBrands}</span>, plus{" "}
            <span className="admin-code">{RESTRICTED_NAME_SOURCES.abaronBrands}</span> and protocol
            finance terms. Hard-reserved slugs ({RESTRICTED_NAME_COUNTS.hardReserved}) are under
            Dictionary → Hard reserved.
          </p>
        </div>
        {canReview ? (
        <form action={addDictionaryEntryAction} className="admin-dictionary-add">
          <div className="admin-field">
            <label>Add name</label>
            <input name="name" required placeholder="e.g. paypal" />
          </div>
          <div className="admin-field">
            <label>Reason</label>
            <input name="reason" required placeholder="Why verification is required" />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            Add to dictionary
          </button>
        </form>
        ) : null}
      </div>

      <form className="admin-search" method="get">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search dictionary entries…"
          aria-label="Search dictionary entries"
        />
        <button type="submit" className="admin-btn">
          Search
        </button>
        {q ? (
          <Link className="admin-btn admin-btn-ghost" href="/admin/dictionary">
            Clear
          </Link>
        ) : null}
      </form>

      {entries.length === 0 ? (
        <div className="admin-empty">
          {q ? `No entries matching “${q}”.` : "Dictionary is empty - add a name above."}
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 12 }}>
          <table className="admin-table admin-table-compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Source</th>
                <th className="admin-col-actions" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.name}>
                  <td>
                    <span className="admin-code">{entry.name}</span>
                  </td>
                  <td>{entry.category}</td>
                  <td className="admin-cell-muted">{entry.source}</td>
                  <td>
                    {canReview ? (
                    <AdminRowActions>
                      <AdminRowAction
                        action={removeDictionaryEntryAction}
                        label="Remove from dictionary"
                        icon="trash2"
                        confirmMessage={`Remove “${entry.name}” from the protected dictionary?`}
                        hiddenFields={{ name: entry.name }}
                      />
                    </AdminRowActions>
                    ) : (
                      <span className="admin-cell-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
