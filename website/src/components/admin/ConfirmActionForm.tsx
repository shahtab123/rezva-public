"use client";

import { useRef, useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  confirmTitle?: string;
  confirmMessage: string;
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Form that requires an explicit confirm dialog before invoking a privileged server action.
 */
export function ConfirmSubmitForm({
  action,
  submitLabel,
  confirmTitle = "Confirm privileged action",
  confirmMessage,
  danger = true,
  children,
  className,
  style,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <form
        ref={formRef}
        className={className}
        style={style}
        action={(formData) => {
          startTransition(async () => {
            await action(formData);
            confirmedRef.current = false;
            setOpen(false);
          });
        }}
        onSubmit={(event) => {
          if (!confirmedRef.current) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
        <button
          type="submit"
          className={danger ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary"}
          disabled={pending}
        >
          {pending ? "Working…" : submitLabel}
        </button>
      </form>

      {open ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="admin-confirm-title">{confirmTitle}</h2>
            <p>{confirmMessage}</p>
            <p className="admin-lede" style={{ marginTop: 8 }}>
              This action is written to the admin audit trail. Registry changes are never silent.
            </p>
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
                type="button"
                className={danger ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary"}
                disabled={pending}
                onClick={() => {
                  confirmedRef.current = true;
                  formRef.current?.requestSubmit();
                }}
              >
                Confirm: {submitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
