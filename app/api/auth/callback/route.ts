// GET /api/auth/callback: Google sends the browser back here after sign-in.
// We swap the one-time code for the person's verified email, make sure it is
// a usc.edu account, and start a session in a signed cookie.

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE, STATE_COOKIE, cookieOptions, googleConfigured, newSession, sameText, siteOrigin,
} from "@/lib/session";
import { uscEmail } from "@/lib/http";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** The cookies this request sent, as a name → value map. */
function requestCookies(request: Request): Map<string, string> {
  const jar = new Map<string, string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at > 0) jar.set(part.slice(0, at).trim(), part.slice(at + 1).trim());
  }
  return jar;
}

/** The claims inside an ID token (the middle part of a JWT), or null. */
function tokenClaims(idToken: unknown): Record<string, unknown> | null {
  if (typeof idToken !== "string") return null;
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof claims === "object" && claims !== null ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Swap the one-time code for an ID token and return the verified USC email in
 * it. Returns "not_usc" for a real Google account that is not a USC one, and
 * null when anything else is off.
 */
async function uscEmailFromCode(code: string, redirectUri: string): Promise<string | "not_usc" | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;

  // The token comes straight from Google over HTTPS, in return for our client
  // secret, so (as Google's docs say) its signature does not need checking
  // again. What it says still does: who it is for, and who it is about.
  const body: unknown = await response.json();
  const claims = tokenClaims((body as { id_token?: unknown } | null)?.id_token);
  if (!claims) return null;
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (typeof claims.iss !== "string" || !GOOGLE_ISSUERS.includes(claims.iss)) return null;
  if (typeof claims.exp !== "number" || claims.exp < Date.now() / 1000) return null;

  // `hd` is the Google Workspace the account belongs to. Checking it (and not
  // only how the address ends) is what makes this a USC-managed account.
  const email = uscEmail(claims.email);
  if (claims.email_verified !== true || claims.hd !== "usc.edu" || !email) return "not_usc";
  return email;
}

export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const back = (query: string) => {
    const response = NextResponse.redirect(`${origin}/signin?${query}`);
    // One use only, whether the sign-in worked or not.
    response.cookies.set(STATE_COOKIE, "", cookieOptions(request, 0));
    return response;
  };
  if (!googleConfigured()) return back("error=not_configured");

  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expected = requestCookies(request).get(STATE_COOKIE);
  // No code means the person pressed Cancel at Google (or the link was made up).
  if (!code) return back("error=cancelled");
  if (!state || !expected || !sameText(state, expected)) return back("error=expired");

  let email: string | "not_usc" | null = null;
  try {
    email = await uscEmailFromCode(code, `${origin}/api/auth/callback`);
  } catch (error) {
    // Log the kind of error only: never the code, the token or an address.
    console.warn("[api/auth/callback]", error instanceof Error ? error.name : "unknown error");
  }
  if (email === "not_usc") return back("error=not_usc");
  if (!email) return back("error=google");

  const session = newSession(email);
  const response = back("signed_in=1");
  response.cookies.set(SESSION_COOKIE, session.value, cookieOptions(request, session.maxAge));
  return response;
}
