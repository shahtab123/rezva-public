import { getUserApplications } from "@/lib/applications/store";
import { isApproved } from "@/components/dashboard/application-types";
import { DashboardAuthError } from "@/lib/dashboard/auth";

export async function requireApprovedProviderTrack(userId: string): Promise<void> {
  const apps = await getUserApplications(userId);
  if (!isApproved(apps.provider.status)) {
    throw new DashboardAuthError(
      "Wallet provider application must be approved before using provider features",
      403,
    );
  }
}
