import { getUserApplications } from "@/lib/applications/store";
import { isApproved } from "@/components/dashboard/application-types";
import { DashboardAuthError } from "@/lib/dashboard/auth";

export async function requireApprovedBusinessTrack(userId: string): Promise<void> {
  const apps = await getUserApplications(userId);
  if (!isApproved(apps.business.status)) {
    throw new DashboardAuthError(
      "Business application must be approved before using registry features",
      403,
    );
  }
}
