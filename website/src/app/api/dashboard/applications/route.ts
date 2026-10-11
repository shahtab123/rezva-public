import { NextResponse } from "next/server";
import {
  getUserApplications,
  respondToDocumentRequest,
  submitUserApplication,
} from "@/lib/applications/store";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    return NextResponse.json(await getUserApplications(user.userId));
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    if (Number(request.headers.get("content-length") ?? 0) > 128 * 1024) {
      return NextResponse.json({ error: "Application payload is too large." }, { status: 413 });
    }
    const body = (await request.json()) as {
      track?: "business" | "provider";
      payload?: Record<string, string>;
      controllerWallet?: string | null;
    };

    const payload = body.payload
      ? Object.fromEntries(
          Object.entries(body.payload).filter(
            ([key, value]) =>
              key.trim().length > 0 &&
              typeof value === "string" &&
              value.trim().length > 0,
          ),
        )
      : undefined;
    const hasValidPayload =
      payload &&
      typeof payload === "object" &&
      Object.keys(payload).length > 0 &&
      Object.keys(payload).length <= 50 &&
      Object.entries(payload).every(
        ([key, value]) =>
          key.trim().length > 0 &&
          key.length <= 200 &&
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.length <= 5_000,
      );
    if (
      (body.track !== "business" && body.track !== "provider") ||
      !hasValidPayload
    ) {
      return NextResponse.json({ error: "track and payload required" }, { status: 400 });
    }
    if (!payload) {
      return NextResponse.json({ error: "track and payload required" }, { status: 400 });
    }

    const saved = await submitUserApplication({
      privyUserId: user.userId,
      track: body.track,
      payload,
      controllerWallet: body.controllerWallet ?? user.controllerWallet,
    });

    return NextResponse.json({
      business: body.track === "business" ? toClient(saved) : undefined,
      provider: body.track === "provider" ? toClient(saved) : undefined,
      application: toClient(saved),
    });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const body = (await request.json()) as {
      track?: "business" | "provider";
      message?: string;
      note?: string;
    };

    if (!body.track || !body.message?.trim()) {
      return NextResponse.json(
        { error: "track and message required" },
        { status: 400 },
      );
    }

    const saved = await respondToDocumentRequest({
      privyUserId: user.userId,
      track: body.track,
      message: body.message.trim(),
      note: body.note?.trim(),
    });

    if (!saved) {
      return NextResponse.json(
        { error: "No application awaiting additional information" },
        { status: 404 },
      );
    }

    return NextResponse.json({ application: toClient(saved) });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

function toClient(app: {
  id: string;
  status: string;
  payload: Record<string, string>;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentRequest?: unknown;
  documentResponse?: unknown;
}) {
  return {
    applicationId: app.id,
    status: app.status,
    payload: app.payload,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    rejectionReason: app.rejectionReason,
    documentRequest: app.documentRequest,
    documentResponse: app.documentResponse,
  };
}
