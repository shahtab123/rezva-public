import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  enrichIdentifierWithBusinessName,
  getPrimaryBusinessName,
} from "@/lib/dashboard/business-profile";
import { requireApprovedBusinessTrack } from "@/lib/dashboard/require-approved-business";
import { normalizePaymentOption } from "@/lib/dashboard/payment-options";
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
    const [identifier, { names }, primary] = await Promise.all([
      client.getIdentifier(id),
      client.listControllerNames(wallet),
      getPrimaryBusinessName(client, wallet),
    ]);
    return NextResponse.json({
      identifier: enrichIdentifierWithBusinessName(identifier, names, primary),
    });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const wallet = requireControllerWallet(user.controllerWallet);
    const { id } = await params;
    const body = (await request.json()) as {
      payment_options?: Array<{
        chain?: string;
        asset?: string;
        address?: string;
        token_contract?: string;
        network_identifier?: string;
      }>;
    };
    const paymentOptions = (body.payment_options ?? [])
      .map((option) =>
        normalizePaymentOption({
          chain: option.chain ?? "",
          asset: option.asset ?? "",
          address: option.address ?? "",
          token_contract: option.token_contract,
          network_identifier: option.network_identifier,
        }),
      )
      .filter((option): option is NonNullable<typeof option> => option !== null);
    if (!paymentOptions.length) {
      return NextResponse.json(
        {
          error:
            "At least one payment destination (chain, asset, and address) is required.",
        },
        { status: 400 },
      );
    }
    const client = createDashboardRegistryClient(wallet);
    const primary = await getPrimaryBusinessName(client, wallet);
    const existing = await client.getIdentifier(id);
    const identifier = await client.updateIdentifier(id, {
      payment_options: paymentOptions,
      ...(primary && !existing.name_id ? { name_id: primary.id } : {}),
    });
    const { names } = await client.listControllerNames(wallet);
    return NextResponse.json({
      identifier: enrichIdentifierWithBusinessName(identifier, names, primary),
    });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
