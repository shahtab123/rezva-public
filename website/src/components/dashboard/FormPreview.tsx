export type FormPreviewField = {
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select" | "email" | "url" | "file";
  options?: string[];
  accept?: string;
  maxSizeBytes?: number;
  optional?: boolean;
  /** Reject personal email providers; optionally match website domain */
  officialEmail?: boolean;
  matchDomainFrom?: string;
  wide?: boolean;
  group?: string;
};

export function FormPreview({
  fields,
  note,
}: {
  fields: FormPreviewField[];
  note?: string;
}) {
  return (
    <div className="dash-form-preview">
      {note ? <p className="dash-form-note">{note}</p> : null}
      <div className="dash-form-grid">
        {fields.map((field) => (
          <label
            key={field.label}
            className={`dash-field${field.wide || field.type === "textarea" ? " is-wide" : ""}`}
          >
            <span className="dash-field-label">{field.label}</span>
            {field.hint ? (
              <span className="dash-field-hint">{field.hint}</span>
            ) : null}
            {field.type === "textarea" ? (
              <textarea
                disabled
                rows={4}
                placeholder={field.placeholder ?? "Will be collected when applications open"}
              />
            ) : field.type === "select" ? (
              <select disabled defaultValue="">
                <option value="" disabled>
                  {field.placeholder ?? "Select…"}
                </option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled
                type={field.type === "email" || field.type === "url" ? field.type : "text"}
                placeholder={field.placeholder ?? "Will be collected when applications open"}
              />
            )}
          </label>
        ))}
      </div>
      <button type="button" className="dash-btn dash-btn-primary" disabled>
        Submit application - coming soon
      </button>
    </div>
  );
}
