import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { linkIdentifiersToPrimaryBusinessName } from "@/lib/dashboard/business-profile";
import { requireApprovedBusinessTrack } from "@/lib/dashboard/require-approved-business";
import {
  createDashboardRegistryClient,
  requireControllerWallet,
} from "@/lib/dashboard/registry-client";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const wallet = requireControllerWallet(user.controllerWallet);
    const client = createDashboardRegistryClient(wallet);
    const { names } = await client.listControllerNames(wallet);
    return NextResponse.json({ names });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const wallet = requireControllerWallet(user.controllerWallet);
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim().toLowerCase();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const client = createDashboardRegistryClient(wallet);
    const { names: existing } = await client.listControllerNames(wallet);
    const alreadyHasName = existing.some((row) =>
      ["active", "pending_review"].includes(row.status),
    );
    if (alreadyHasName) {
      return NextResponse.json(
        {
          error:
            "You already have a business name. Only one name is used as the merchant title on linked identifiers.",
        },
        { status: 409 },
      );
    }
    const record = await client.createName({ name });
    const { identifiers } = await client.listControllerIdentifiers(wallet);
    await linkIdentifiersToPrimaryBusinessName(
      client,
      { id: record.id, name: record.name },
      identifiers,
    );
    return NextResponse.json({ name: record }, { status: 201 });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
