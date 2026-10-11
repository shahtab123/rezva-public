"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

type Complaint = {
  id: string;
  subject: string;
  target: string;
  summary: string;
  status: string;
  submittedAt: string;
};

export default function BusinessComplaintsPage() {
  return (
    <TrackGate
      track="business"
      title="Complaints are locked"
      description="Report impersonation or disputes after business approval."
    >
      <ComplaintsContent />
    </TrackGate>
  );
}

function ComplaintsContent() {
  const { controllerWallet } = useTrackAccess("business");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState("Impersonation");
  const [target, setTarget] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void dashboardFetch("/api/dashboard/complaints", { controllerWallet })
      .then((response) => response.json())
      .then((data) => setComplaints(data.complaints ?? []))
      .catch(() => setComplaints([]));
  }, [controllerWallet, sent]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await dashboardFetch("/api/dashboard/complaints", {
        method: "POST",
        controllerWallet,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controllerWallet,
          subject,
          target,
          summary,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setTarget("");
      setSummary("");
      setSent(true);
    } catch {
      setError("Could not submit complaint. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Complaints"
        description="Report impersonation, unauthorized mappings, or trademark disputes. Submissions are stored in the operator review queue."
      />

      <div className="dash-notice">
        This is a lightweight intake form. Operator review happens in the admin control plane.
      </div>

      <form className="dash-card" style={{ marginTop: 16 }} onSubmit={onSubmit}>
        <h2>Submit a complaint</h2>
        <div className="dash-field">
          <label htmlFor="complaint-subject">Subject</label>
          <select
            id="complaint-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option>Impersonation</option>
            <option>Unauthorized identifier</option>
            <option>Trademark / brand misuse</option>
            <option>Other</option>
          </select>
        </div>
        <div className="dash-field">
          <label htmlFor="complaint-target">Target</label>
          <input
            id="complaint-target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            required
            placeholder="phone:… name:… email:…"
          />
        </div>
        <div className="dash-field">
          <label htmlFor="complaint-summary">Summary</label>
          <textarea
            id="complaint-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            rows={4}
            placeholder="What happened and why this mapping or name is unauthorized"
          />
        </div>
        {error ? <p className="dash-form-error">{error}</p> : null}
        <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit complaint"}
        </button>
      </form>

      {complaints.length > 0 ? (
        <section className="dash-card" style={{ marginTop: 16 }}>
          <h2>Your submissions</h2>
          <ul className="dash-history">
            {complaints.map((item) => (
              <li key={item.id}>
                <time dateTime={item.submittedAt}>
                  {new Date(item.submittedAt).toLocaleString()}
                </time>
                <span>
                  <strong>{item.subject}</strong> · {item.target} - {item.summary}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
