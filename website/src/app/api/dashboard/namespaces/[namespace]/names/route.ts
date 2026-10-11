import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { createDashboardRegistryClient } from "@/lib/dashboard/registry-client";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";

type RouteContext = {
  params: Promise<{ namespace: string }>;
};

async function getContext(request: Request, context: RouteContext) {
  const user = await requireDashboardUser(request);
  await requireApprovedProviderTrack(user.userId);
  const params = await context.params;
  const namespace = params.namespace.trim().replace(/^\./, "").toLowerCase();
  if (!namespace) throw new Error("namespace is required");
  return { namespace, client: createDashboardRegistryClient("0x0000000000000000000000000000000000000000") };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { namespace, client } = await getContext(request, context);
    const body = (await request.json()) as {
      label?: string;
      controller_ref?: string;
      chain?: string;
      asset?: string;
      address?: string;
      status?: "active" | "reserved" | "suspended";
    };
    if (!body.label?.trim()) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    const created = await client.registerNamespaceName(namespace, {
      label: body.label.trim(),
      controller_ref: body.controller_ref,
      chain: body.chain,
      asset: body.asset,
      address: body.address,
    });
    if (body.status && body.status !== "active") {
      return NextResponse.json(
        await client.updateNamespaceName(namespace, body.label.trim(), { status: body.status }),
      );
    }
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
