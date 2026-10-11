"use client";

import { useState, useTransition, type ComponentType } from "react";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Eye,
  FileQuestion,
  PauseCircle,
  ShieldOff,
  Trash2,
  XCircle,
} from "lucide-react";

type IconProps = { className?: string; "aria-hidden"?: boolean };

export const adminRowActionIcons = {
  alertTriangle: AlertTriangle,
  bookmark: Bookmark,
  checkCircle2: CheckCircle2,
  eye: Eye,
  fileQuestion: FileQuestion,
  pauseCircle: PauseCircle,
  shieldOff: ShieldOff,
  trash2: Trash2,
  xCircle: XCircle,
} as const;

export type AdminRowActionIcon = keyof typeof adminRowActionIcons;

export type AdminRowActionProps = {
  action: (formData: FormData) => Promise<void>;
  label: string;
  confirmMessage: string;
  confirmTitle?: string;
  danger?: boolean;
  hiddenFields: Record<string, string>;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonDefault?: string;
  icon: AdminRowActionIcon;
};

export function AdminRowActions({ children }: { children: React.ReactNode }) {
  return <div className="admin-row-actions">{children}</div>;
}

export function AdminRowAction({
  action,
  label,
  confirmMessage,
  confirmTitle,
  danger = true,
  hiddenFields,
  reasonLabel = "Reason",
  reasonPlaceholder = "Required for audit trail",
  reasonDefault = "",
  icon,
}: AdminRowActionProps) {
  const Icon = adminRowActionIcons[icon] as ComponentType<IconProps>;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        className={`admin-icon-btn${danger ? " admin-icon-btn-danger" : ""}`}
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        <Icon className="admin-icon-btn-svg" aria-hidden />
      </button>

      {open ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-row-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="admin-row-action-title">{confirmTitle ?? label}</h2>
            <p>{confirmMessage}</p>
            <form
              className="admin-row-action-form"
              action={(formData) => {
                startTransition(async () => {
                  await action(formData);
                  setOpen(false);
                });
              }}
            >
              {Object.entries(hiddenFields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
              <div className="admin-field">
                <label htmlFor={`reason-${label}`}>{reasonLabel}</label>
                <input
                  id={`reason-${label}`}
                  name="reason"
                  defaultValue={reasonDefault}
                  required
                  placeholder={reasonPlaceholder}
                />
              </div>
              <p className="admin-lede">Recorded in the admin audit trail.</p>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={danger ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary"}
                  disabled={pending}
                >
                  {pending ? "Working…" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
