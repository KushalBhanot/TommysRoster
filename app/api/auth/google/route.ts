// GET /api/auth/google: the "Continue with USC Google" button points here.
// It sends the browser to Google's sign-in page, limited to usc.edu accounts.
// USC's Google accounts log in on USC's own NetID page, so no password ever
// reaches this site.
// Docs: https://developers.google.com/identity/openid-connect/openid-connect

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { STATE_COOKIE, cookieOptions, googleConfigured, siteOrigin } from "@/lib/session";

export async function GET(request: Request) {
  const origin = siteOrigin(request);
  if (!googleConfigured()) return NextResponse.redirect(`${origin}/signin?error=not_configured`);

  // A random value that Google sends back to /api/auth/callback. Checking it
  // there proves the sign-in was started by this browser, not planted by
  // another site.
  const state = randomBytes(24).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  // The address is all we ask for: no name, no photo, no Drive, no calendar.
  url.searchParams.set("scope", "openid email");
  // Shows only usc.edu accounts. It is a hint, so the callback checks again.
  url.searchParams.set("hd", "usc.edu");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, cookieOptions(request, 10 * 60));
  return response;
}
