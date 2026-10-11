import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { createDashboardRegistryClient } from "@/lib/dashboard/registry-client";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const client = createDashboardRegistryClient("0x0000000000000000000000000000000000000000");
    const { namespaces } = await client.listNamespaces();
    const details = await Promise.all(
      namespaces.map((namespace) => client.getNamespaceDetail(String(namespace.slug))),
    );
    return NextResponse.json({ namespaces: details });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const body = (await request.json()) as {
      slug?: string;
      description?: string;
      registration_policy?: string;
      reserved_names?: string[];
    };
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }
    const client = createDashboardRegistryClient("0x0000000000000000000000000000000000000000");
    const namespace = await client.applyNamespace({
      slug: body.slug.trim().replace(/^\./, "").toLowerCase(),
      description: body.description,
      registration_policy: body.registration_policy,
      reserved_names: body.reserved_names,
    });
    return NextResponse.json({ namespace }, { status: 201 });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
