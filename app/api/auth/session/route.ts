// GET    /api/auth/session → { email, google, demo }: who this browser is
//                            signed in as, and which ways of signing in are on.
// DELETE /api/auth/session → { ok: true }: sign out (forget the cookie).
//
// `email` is the caller's OWN verified address, read from their signed
// cookie. It is the only email any API route ever returns, and it only ever
// goes back to the person it belongs to.

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE, cookieOptions, demoSignInAllowed, googleConfigured, verifiedEmail,
} from "@/lib/session";

export async function GET() {
  // Reading the cookie makes this run on every request (never prerendered).
  const email = await verifiedEmail();
  return NextResponse.json(
    { email, google: googleConfigured(), demo: demoSignInAllowed() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", cookieOptions(request, 0));
  return response;
}
