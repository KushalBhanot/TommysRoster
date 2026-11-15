// JSON response helpers shared by every API route, so the error shape
// ({ "error": string }) and the sample-data header stay the same everywhere.

import { usingSampleData } from "./data";

/** A JSON response. Adds `X-Sample-Data: true` while sample data is in use. */
export function json(body: unknown, status = 200): Response {
  const headers = new Headers();
  if (usingSampleData()) headers.set("X-Sample-Data", "true");
  return Response.json(body, { status, headers });
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

/**
 * Read a POST body that must be a JSON object. Returns null when the body is
 * missing, not JSON, or not an object.
 */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * A text field from a JSON body, trimmed. Numbers are accepted too (a year
 * sent as 2028). Anything else reads as "".
 */
export function textField(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim();
}

/** "name@usc.edu" in lowercase, or "" when it is not a USC address. */
export function uscEmail(value: unknown): string {
  const email = textField(value).toLowerCase();
  return /^[^\s@]+@usc\.edu$/.test(email) ? email : "";
}
