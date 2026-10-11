import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { createDashboardRegistryClient } from "@/lib/dashboard/registry-client";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";

type RouteContext = {
  params: Promise<{ namespace: string; label: string }>;
};

async function getContext(request: Request, context: RouteContext) {
  const user = await requireDashboardUser(request);
  await requireApprovedProviderTrack(user.userId);
  const params = await context.params;
  const namespace = params.namespace.trim().replace(/^\./, "").toLowerCase();
  const label = params.label.trim().toLowerCase();
  if (!namespace || !label) throw new Error("namespace and label are required");
  return {
    namespace,
    label,
    client: createDashboardRegistryClient("0x0000000000000000000000000000000000000000"),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { namespace, label, client } = await getContext(request, context);
    const body = (await request.json()) as { status?: "active" | "reserved" | "suspended" };
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    return NextResponse.json(await client.updateNamespaceName(namespace, label, body));
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { namespace, label, client } = await getContext(request, context);
    return NextResponse.json(
      await client.updateNamespaceName(namespace, label, { status: "removed" }),
    );
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
