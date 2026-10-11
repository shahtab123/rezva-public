"use client";

import { useState, type FormEvent } from "react";

export function DocumentResponseForm({
  onSubmit,
}: {
  onSubmit: (input: { message: string; note?: string }) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setError("Describe what you are providing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ message: message.trim(), note: note.trim() || undefined });
      setMessage("");
      setNote("");
    } catch {
      setError("Could not send your response. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="dash-doc-response" onSubmit={handleSubmit}>
      <div className="dash-field">
        <label htmlFor="doc-response-message">Your response</label>
        <textarea
          id="doc-response-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          placeholder="Describe documents sent by email, links, or other proof…"
          rows={4}
        />
      </div>
      <div className="dash-field">
        <label htmlFor="doc-response-note">Optional note</label>
        <input
          id="doc-response-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Reference number, contact person, etc."
        />
      </div>
      {error ? <p className="dash-form-error">{error}</p> : null}
      <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Submit additional information"}
      </button>
      <p className="dash-meta" style={{ marginTop: 10 }}>
        Do not upload sensitive files here unless productized - email or secure channel may be
        requested in the operator message.
      </p>
    </form>
  );
}
