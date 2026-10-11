import { AdminPageHeader } from "@/components/admin/ui";
import {
  HARD_RESERVED_NAMES,
  RESTRICTED_NAME_COUNTS,
  RESTRICTED_NAME_SOURCES,
} from "@/lib/restricted-names-data";

export default function HardReservedPage() {
  const names = [...HARD_RESERVED_NAMES].sort();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Dictionary"
        title="Hard reserved"
        description="System and URL-collision slugs that are never registerable as native names."
      />
      <div className="admin-notice">
        {RESTRICTED_NAME_COUNTS.hardReserved} entries from{" "}
        <span className="admin-code">{RESTRICTED_NAME_SOURCES.shouldbee}</span> plus protocol core
        terms. Brand and crypto labels ({RESTRICTED_NAME_COUNTS.protectedDictionary} names) require
        elevated review under Protected words.
      </div>
      <section className="admin-card">
        <h2>Hard reserved set</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {names.map((name) => (
            <span key={name} className="admin-code">
              {name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
