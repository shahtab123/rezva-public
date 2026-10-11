import { AdminPageHeader } from "@/components/admin/ui";

/** Shared stub for registry/provider/complaint/system panels wired later to operator API */
export function AdminProtocolPanel({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div>
      <AdminPageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="admin-notice">
        Operator API wiring uses <span className="admin-code">OPERATOR_API_KEY</span> against
        the registry worker. This panel is ready for privileged actions with confirmation +
        audit logging.
      </div>
      <section className="admin-card">
        <h2>Capabilities</h2>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#c5cee0", lineHeight: 1.6 }}>
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
