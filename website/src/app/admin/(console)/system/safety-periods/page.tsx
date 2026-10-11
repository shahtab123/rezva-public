import { getSettings } from "@/lib/admin/store";
import { updateSafetySettingsAction } from "@/lib/admin/actions";
import { AdminPageHeader, AdminReadOnlyNotice } from "@/components/admin/ui";
import { adminHasPermission } from "@/lib/admin/session";

export default async function SafetyPeriodsPage() {
  const settings = getSettings();
  const canWrite = await adminHasPermission("system:write");

  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="Safety periods"
        description="Configurable protocol timers. Distinct from registry data."
      />
      {!canWrite ? <AdminReadOnlyNotice permission="system:write" /> : null}
      <form action={updateSafetySettingsAction} className="admin-card" style={{ maxWidth: 520 }}>
        <div className="admin-field">
          <label>Registration safety (seconds)</label>
          <input
            name="registrationSafetySeconds"
            type="number"
            min={0}
            defaultValue={settings.registrationSafetySeconds}
            required
            disabled={!canWrite}
          />
        </div>
        <div className="admin-field">
          <label>Payment update safety (seconds)</label>
          <input
            name="updateSafetySeconds"
            type="number"
            min={0}
            defaultValue={settings.updateSafetySeconds}
            required
            disabled={!canWrite}
          />
        </div>
        <div className="admin-field">
          <label>Removal cooldown (seconds)</label>
          <input
            name="removalCooldownSeconds"
            type="number"
            min={0}
            defaultValue={settings.removalCooldownSeconds}
            required
            disabled={!canWrite}
          />
        </div>
        {canWrite ? (
          <button type="submit" className="admin-btn admin-btn-primary">
            Save safety periods
          </button>
        ) : null}
      </form>
    </div>
  );
}
