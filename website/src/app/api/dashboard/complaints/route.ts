import { NextResponse } from "next/server";
import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { getDashboardProviderKey, getRegistryApiBaseUrl } from "@/lib/dashboard/registry-client";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const response = await fetch(
      `${getRegistryApiBaseUrl()}/v1/complaints?reporter_user_id=${encodeURIComponent(user.userId)}`,
      {
        headers: {
          Authorization: `Bearer ${getDashboardProviderKey()}`,
          "X-Dashboard-Owner-User-Id": user.userId,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Complaint service unavailable." },
        { status: 502 },
      );
    }
    const data = (await response.json()) as {
      complaints?: Array<{
        id: string;
        identifier_id: string;
        reason: string;
        description: string;
        status: string;
        created_at: string;
      }>;
    };
    return NextResponse.json({
      complaints: (data.complaints ?? []).map((item) => ({
        id: item.id,
        subject: item.reason,
        target: item.identifier_id,
        summary: item.description,
        status: item.status.toLowerCase(),
        submittedAt: item.created_at,
      })),
    });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 128 * 1024) {
      return NextResponse.json({ error: "Complaint payload is too large." }, { status: 413 });
    }
    const body = (await request.json()) as {
      subject?: string;
      target?: string;
      summary?: string;
    };

    const subject = body.subject?.trim() ?? "";
    const target = body.target?.trim() ?? "";
    const summary = body.summary?.trim() ?? "";
    const targetMatch = target.match(/^([^:]+):([\s\S]+)$/);
    if (
      !subject ||
      !targetMatch ||
      !summary ||
      subject.length > 120 ||
      target.length > 500 ||
      summary.length > 10_000
    ) {
      return NextResponse.json(
        { error: "subject, target (type:value), and summary are required and within limits." },
        { status: 400 },
      );
    }

    const response = await fetch(`${getRegistryApiBaseUrl()}/v1/complaints`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getDashboardProviderKey()}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        target_type: targetMatch[1]!.trim().toLowerCase(),
        target_value: targetMatch[2]!.trim(),
        reporter_user_id: user.userId,
        reason: subject,
        description: summary,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? "Could not submit complaint." },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }
    const complaint = data as {
      id: string;
      identifier_id: string;
      reason: string;
      description: string;
      status: string;
      created_at: string;
    };
    return NextResponse.json({
      complaint: {
        id: complaint.id,
        subject: complaint.reason,
        target: complaint.identifier_id,
        summary: complaint.description,
        status: complaint.status.toLowerCase(),
        submittedAt: complaint.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
