"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; body: string; baseUrl: string }
  | { status: "error"; message: string; baseUrl: string };

type TypesState =
  | { status: "idle" | "loading" }
  | { status: "ok"; count: number }
  | { status: "error"; message: string };

export default function DevelopersPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8787";
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [types, setTypes] = useState<TypesState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${baseUrl}/health`);
        const text = await response.text();
        if (cancelled) return;
        if (!response.ok) {
          setHealth({ status: "error", message: text || response.statusText, baseUrl });
          return;
        }
        setHealth({ status: "ok", body: text, baseUrl });
      } catch (error) {
        if (cancelled) return;
        setHealth({
          status: "error",
          message: error instanceof Error ? error.message : "Request failed",
          baseUrl,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  async function loadTypes() {
    setTypes({ status: "loading" });
    try {
      const response = await fetch(`${baseUrl}/v1/identifier-types`);
      const json = (await response.json()) as { types?: unknown[] };
      if (!response.ok) {
        setTypes({ status: "error", message: `HTTP ${response.status}` });
        return;
      }
      setTypes({ status: "ok", count: json.types?.length ?? 0 });
    } catch (error) {
      setTypes({
        status: "error",
        message: error instanceof Error ? error.message : "Request failed",
      });
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Developers"
        title="Build on the resolution protocol"
        description="Reference material for wallets and integrators, plus a live check against NEXT_PUBLIC_API_URL."
      />

      <div className="dash-dev-blocks">
        <section id="api" className="dash-card">
          <h2>API connectivity</h2>
          <p>
            Base URL: <span className="dash-code">{baseUrl}</span>
          </p>
          {health.status === "loading" ? <p>Checking /health…</p> : null}
          {health.status === "ok" ? (
            <p className="dash-meta">
              Health OK - <span className="dash-code">{health.body}</span>
            </p>
          ) : null}
          {health.status === "error" ? (
            <p className="dash-meta">
              Unreachable: {health.message}. Start the API with{" "}
              <span className="dash-code">npm run dev</span>.
            </p>
          ) : null}
          <div className="dash-card-actions">
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              onClick={loadTypes}
              disabled={types.status === "loading"}
            >
              {types.status === "loading" ? "Loading types…" : "GET /v1/identifier-types"}
            </button>
          </div>
          {types.status === "ok" ? (
            <p className="dash-meta">{types.count} active identifier types returned.</p>
          ) : null}
          {types.status === "error" ? (
            <p className="dash-meta">Types request failed: {types.message}</p>
          ) : null}
        </section>

        <section id="docs" className="dash-card">
          <h2>Docs</h2>
          <p>
            Protocol specification, registry API, resolver API, identifier types,
            and security model.
          </p>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-primary" href="/docs/introduction/overview">
              Open documentation
            </Link>
            <Link className="dash-btn dash-btn-secondary" href="/integrate">
              Integration overview
            </Link>
          </div>
        </section>

        <section id="sdks" className="dash-card">
          <h2>SDKs</h2>
          <p>
            The TypeScript SDK lives in the monorepo as{" "}
            <span className="dash-code">@universal-payment/sdk</span> with{" "}
            <span className="dash-code">ResolverClient</span>,{" "}
            <span className="dash-code">RegistryClient</span>, and{" "}
            <span className="dash-code">OperatorClient</span>. npm publish is not
            live yet.
          </p>
          <div className="dash-card-actions">
            <span className="dash-btn dash-btn-secondary" style={{ opacity: 0.6 }}>
              Package not published
            </span>
          </div>
        </section>

        <section id="sandbox" className="dash-card">
          <h2>Sandbox</h2>
          <p>
            Local API development uses <span className="dash-code">npm run dev</span>{" "}
            (API on :8787). Provider sandbox UI appears after provider approval.
          </p>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-secondary" href="/dashboard/provider/apply">
              Provider application
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
