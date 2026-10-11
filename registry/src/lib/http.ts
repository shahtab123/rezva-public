import type { ApiError } from "@universal-payment/protocol";

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export function errorResponse(
  error: ApiError,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json(error, { status, headers });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function decodePathSegment(segment: string): string {
  return decodeURIComponent(segment);
}
