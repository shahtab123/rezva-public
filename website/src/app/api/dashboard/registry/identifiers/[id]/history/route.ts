import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { requireApprovedBusinessTrack } from "@/lib/dashboard/require-approved-business";
import {
  createDashboardRegistryClient,
  requireControllerWallet,
} from "@/lib/dashboard/registry-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const wallet = requireControllerWallet(user.controllerWallet);
    const { id } = await params;
    const client = createDashboardRegistryClient(wallet);
    const history = await client.getIdentifierHistory(id);
    return NextResponse.json(history);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
