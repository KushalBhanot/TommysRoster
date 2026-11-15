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
