import { AdminPageHeader } from "@/components/admin/ui";

const TYPES = [
  { id: "phone", privacy: "sensitive", note: "E.164 normalization" },
  { id: "email", privacy: "sensitive", note: "Lowercase + trim" },
  { id: "bangla_qr", privacy: "standard", note: "BD merchant QR payloads" },
  { id: "paypal", privacy: "standard", note: "PayPal handle" },
  { id: "bkash", privacy: "sensitive", note: "bKash wallet id" },
  { id: "merchant_id", privacy: "standard", note: "Protocol merchant ids" },
  { id: "custom", privacy: "standard", note: "Namespaced custom ids" },
];

export default function IdentifierTypesPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="Identifier types"
        description="Configurable protocol catalog - distinct from live registry mappings."
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Privacy class</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="admin-code">{row.id}</span>
                </td>
                <td>{row.privacy}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
