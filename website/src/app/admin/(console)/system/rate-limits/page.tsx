import { getSettings } from "@/lib/admin/store";
import { updateRateLimitSettingsAction } from "@/lib/admin/actions";
import { AdminPageHeader, AdminReadOnlyNotice } from "@/components/admin/ui";
import { adminHasPermission } from "@/lib/admin/session";

export default async function RateLimitsPage() {
  const settings = getSettings();
  const canWrite = await adminHasPermission("system:write");

  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="Rate limits"
        description="Admin-configured target quotas. Enforced by Upstash on the API worker."
      />
      {!canWrite ? <AdminReadOnlyNotice permission="system:write" /> : null}
      <form action={updateRateLimitSettingsAction} className="admin-card" style={{ maxWidth: 520 }}>
        <div className="admin-field">
          <label>Resolve requests / minute</label>
          <input
            name="resolveRateLimitPerMinute"
            type="number"
            min={1}
            defaultValue={settings.resolveRateLimitPerMinute}
            required
            disabled={!canWrite}
          />
        </div>
        <div className="admin-field">
          <label>Register requests / minute</label>
          <input
            name="registerRateLimitPerMinute"
            type="number"
            min={1}
            defaultValue={settings.registerRateLimitPerMinute}
            required
            disabled={!canWrite}
          />
        </div>
        {canWrite ? (
          <button type="submit" className="admin-btn admin-btn-primary">
            Save rate limits
          </button>
        ) : null}
      </form>
    </div>
  );
}
