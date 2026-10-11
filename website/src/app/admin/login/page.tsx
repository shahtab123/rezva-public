"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import "../admin.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError("Invalid username or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <BrandMark size={40} className="brand-mark" />
        <h1>Protocol admin</h1>
        <p>
          Privileged control plane for registry, namespaces, dictionary review,
          and complaints. Separate from the business / provider dashboard.
        </p>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="admin-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          style={{ width: "100%", minHeight: 40 }}
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
