import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  enrichIdentifierWithBusinessName,
  getPrimaryBusinessName,
  linkIdentifiersToPrimaryBusinessName,
  pickPrimaryBusinessName,
} from "@/lib/dashboard/business-profile";
import { requireApprovedBusinessTrack } from "@/lib/dashboard/require-approved-business";
import {
  DEFAULT_PAYMENT_ASSET,
  DEFAULT_PAYMENT_NETWORK,
  normalizePaymentOption,
  resolvePaymentSelection,
} from "@/lib/dashboard/payment-options";
import {
  canRegisterDashboardIdentifier,
  countDashboardIdentifiers,
  DASHBOARD_MAX_IDENTIFIERS,
  dashboardIdentifierLimitMessage,
} from "@/lib/dashboard/identifier-limits";
import {
  createDashboardRegistryClient,
  requireControllerWallet,
} from "@/lib/dashboard/registry-client";

async function loadDashboardIdentifiers(wallet: string) {
  const client = createDashboardRegistryClient(wallet);
  const [{ names }, { identifiers }] = await Promise.all([
    client.listControllerNames(wallet),
    client.listControllerIdentifiers(wallet),
  ]);
  const primary = pickPrimaryBusinessName(names);
  const linked = primary
    ? await linkIdentifiersToPrimaryBusinessName(client, primary, identifiers)
    : identifiers;
  return linked.map((identifier) =>
    enrichIdentifierWithBusinessName(identifier, names, primary),
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const wallet = requireControllerWallet(user.controllerWallet);
    const identifiers = await loadDashboardIdentifiers(wallet);
    return NextResponse.json({ identifiers });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedBusinessTrack(user.userId);
    const body = (await request.json()) as {
      type?: string;
      value?: string;
      controller_wallet?: string;
      payment_options?: Array<{
        chain?: string;
        asset?: string;
        address?: string;
        token_contract?: string;
        network_identifier?: string;
      }>;
    };
    const wallet = requireControllerWallet(
      user.controllerWallet ??
        body.controller_wallet?.trim().toLowerCase() ??
        null,
    );
    if (!body.type?.trim() || !body.value?.trim()) {
      return NextResponse.json(
        { error: "type and value are required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const rawOptions = Array.isArray(body.payment_options) ? body.payment_options : [];
    let paymentOptions = rawOptions
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
    // Defensive default: older clients (or cleared address fields) used to hit the
    // registry with an empty payment_options array and get a opaque 400.
    if (!paymentOptions.length) {
      const selection = resolvePaymentSelection(
        DEFAULT_PAYMENT_NETWORK.id,
        DEFAULT_PAYMENT_ASSET.symbol,
      );
      const fallback = selection
        ? normalizePaymentOption({ ...selection, address: wallet })
        : null;
      if (fallback) {
        paymentOptions = [fallback];
      } else {
        return NextResponse.json(
          {
            error:
              "At least one payment destination (chain, asset, and address) is required.",
            code: "DESTINATION_INVALID",
          },
          { status: 400 },
        );
      }
    }
    const client = createDashboardRegistryClient(wallet);
    const { identifiers: existing } = await client.listControllerIdentifiers(wallet);
    if (!canRegisterDashboardIdentifier(existing)) {
      const count = countDashboardIdentifiers(existing);
      return NextResponse.json(
        {
          error: dashboardIdentifierLimitMessage(count),
          code: "IDENTIFIER_LIMIT",
          limit: DASHBOARD_MAX_IDENTIFIERS,
          count,
        },
        { status: 409 },
      );
    }
    const primary = await getPrimaryBusinessName(client, wallet);
    const record = await client.registerIdentifier({
      type: body.type.trim(),
      value: body.value.trim(),
      ...(primary ? { name_id: primary.id } : {}),
      payment_options: paymentOptions,
    });
    const [{ names }] = await Promise.all([client.listControllerNames(wallet)]);
    return NextResponse.json(
      {
        identifier: enrichIdentifierWithBusinessName(record, names, primary),
      },
      { status: 201 },
    );
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
