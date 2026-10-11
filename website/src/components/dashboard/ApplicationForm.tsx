"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { FormPreviewField } from "./FormPreview";

export type { FormPreviewField };

const MAX_FILE_BYTES_DEFAULT = 1024 * 1024;

type FieldGroup = {
  title: string | null;
  fields: FormPreviewField[];
};

function groupFields(fields: FormPreviewField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  for (const field of fields) {
    const title = field.group ?? null;
    const last = groups[groups.length - 1];
    if (!last || last.title !== title) {
      groups.push({ title, fields: [field] });
    } else {
      last.fields.push(field);
    }
  }
  return groups;
}

function filePayload(file: File, dataUrl: string): string {
  return JSON.stringify({
    name: file.name,
    size: file.size,
    type: file.type,
    dataUrl,
  });
}

function isFieldRequired(field: FormPreviewField): boolean {
  return !field.optional;
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "126.com",
  "rediffmail.com",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
]);

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function domainFromEmail(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function emailMatchesWebsiteDomain(email: string, websiteUrl: string): boolean {
  const siteDomain = domainFromUrl(websiteUrl);
  const emailDomain = domainFromEmail(email);
  if (!siteDomain || !emailDomain) {
    return false;
  }
  return emailDomain === siteDomain || emailDomain.endsWith(`.${siteDomain}`);
}

function validateField(
  field: FormPreviewField,
  value: string,
  allValues: Record<string, string>,
): string | null {
  const trimmed = value.trim();
  const required = isFieldRequired(field);

  if (required && !trimmed) {
    return "This field is required.";
  }

  if (!trimmed) {
    return null;
  }

  if (field.type === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address.";
    }

    if (field.officialEmail) {
      const emailDomain = domainFromEmail(trimmed);
      if (PERSONAL_EMAIL_DOMAINS.has(emailDomain)) {
        return "Use an official company email, not a personal provider.";
      }

      if (field.matchDomainFrom) {
        const website = allValues[field.matchDomainFrom]?.trim() ?? "";
        if (website && !emailMatchesWebsiteDomain(trimmed, website)) {
          const siteDomain = domainFromUrl(website);
          return siteDomain
            ? `Email domain must match your website (@${siteDomain}).`
            : "Enter a valid website first, then use a matching official email.";
        }
      }
    }
  }

  if (field.type === "url") {
    try {
      const url = new URL(trimmed);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "Enter a valid URL starting with http:// or https://.";
      }
    } catch {
      return "Enter a valid URL.";
    }
  }

  if (field.type === "file" && required) {
    try {
      const parsed = JSON.parse(trimmed) as { dataUrl?: string };
      if (!parsed.dataUrl) {
        return "Upload a file.";
      }
    } catch {
      return "Upload a file.";
    }
  }

  return null;
}

function validateAllFields(
  fields: FormPreviewField[],
  values: Record<string, string>,
): Record<string, string> {
  const nextErrors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateField(field, values[field.label] ?? "", values);
    if (message) {
      nextErrors[field.label] = message;
    }
  }
  return nextErrors;
}

function fieldDomId(label: string): string {
  return `field-${label.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
}

export function ApplicationForm({
  fields,
  note,
  submitLabel = "Submit application",
  onSubmit,
}: {
  fields: FormPreviewField[];
  note?: string;
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.label, ""])),
  );
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const groups = useMemo(() => groupFields(fields), [fields]);

  function update(label: string, value: string) {
    setValues((prev) => ({ ...prev, [label]: value }));
    setErrors((prev) => {
      if (!prev[label]) return prev;
      const next = { ...prev };
      delete next[label];
      return next;
    });
  }

  async function handleFile(label: string, field: FormPreviewField, file: File | null) {
    if (!file) {
      update(label, "");
      setFileNames((prev) => {
        const next = { ...prev };
        delete next[label];
        return next;
      });
      return;
    }

    const maxBytes = field.maxSizeBytes ?? MAX_FILE_BYTES_DEFAULT;
    if (file.size > maxBytes) {
      setErrors((prev) => ({
        ...prev,
        [label]: `File must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller.`,
      }));
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    update(label, filePayload(file, dataUrl));
    setFileNames((prev) => ({ ...prev, [label]: file.name }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = validateAllFields(fields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalid = fields.find((field) => nextErrors[field.label]);
      if (firstInvalid) {
        document
          .querySelector(`[data-field="${CSS.escape(firstInvalid.label)}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setBusy(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value.trim().length > 0),
      );
      await onSubmit(cleaned);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="dash-apply-form" onSubmit={handleSubmit} noValidate>
      {note ? <p className="dash-apply-form-note">{note}</p> : null}
      <p className="dash-apply-form-required-note">
        Fields marked with <span className="dash-field-required">*</span> are required.
      </p>

      {groups.map((group, groupIndex) => (
        <div className="dash-apply-form-group" key={group.title ?? `group-${groupIndex}`}>
          {group.title ? <h3>{group.title}</h3> : null}
          <div className="dash-form-grid">
            {group.fields.map((field) => {
              const wide =
                field.wide ||
                field.type === "textarea" ||
                field.type === "file";
              const inputType =
                field.type === "email" || field.type === "url" ? field.type : "text";
              const required = isFieldRequired(field);
              const invalid = Boolean(errors[field.label]);
              const errorId = `${fieldDomId(field.label)}-error`;
              return (
                <label
                  key={field.label}
                  data-field={field.label}
                  className={`dash-field${wide ? " is-wide" : ""}${
                    field.type === "select" ? " is-select" : ""
                  }${field.type === "file" ? " is-file" : ""}${
                    invalid ? " is-invalid" : ""
                  }`}
                >
                  <span className="dash-field-label">
                    {field.label}
                    {required ? (
                      <span className="dash-field-required" title="Required" aria-hidden="true">
                        *
                      </span>
                    ) : (
                      <span className="dash-field-optional">Optional</span>
                    )}
                  </span>
                  {field.type === "file" ? (
                    <span className="dash-file-wrap">
                      <input
                        type="file"
                        accept={field.accept ?? "image/*,.pdf"}
                        className="dash-file-input"
                        aria-invalid={invalid}
                        aria-describedby={invalid ? errorId : undefined}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleFile(field.label, field, file);
                        }}
                      />
                      <span className="dash-file-label">
                        {fileNames[field.label] ?? "Choose file…"}
                      </span>
                    </span>
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[field.label] ?? ""}
                      placeholder={field.placeholder}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? errorId : undefined}
                      onChange={(event) => update(field.label, event.target.value)}
                    />
                  ) : field.type === "select" ? (
                    <span className="dash-select-wrap">
                      <select
                        value={values[field.label] ?? ""}
                        aria-invalid={invalid}
                        aria-describedby={invalid ? errorId : undefined}
                        onChange={(event) => update(field.label, event.target.value)}
                      >
                        <option value="" disabled>
                          {field.placeholder ?? "Select…"}
                        </option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </span>
                  ) : (
                    <input
                      type={inputType}
                      value={values[field.label] ?? ""}
                      placeholder={field.placeholder}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? errorId : undefined}
                      onChange={(event) => update(field.label, event.target.value)}
                    />
                  )}
                  {field.hint ? (
                    <span className="dash-field-hint">{field.hint}</span>
                  ) : null}
                  <span
                    id={errorId}
                    className={`dash-field-error${invalid ? " is-visible" : ""}`}
                    role={invalid ? "alert" : undefined}
                  >
                    {errors[field.label] ?? "\u00a0"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="dash-apply-form-footer">
        <p>You’ll get a decision notice when review completes.</p>
        <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
          {busy ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
