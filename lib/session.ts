// Who is signed in, as far as the server is concerned.
//
// Two ways to sign in:
// 1. Google sign-in limited to usc.edu accounts. USC's Google accounts log in
//    through USC's own NetID page, so we never see a password. Google tells us
//    the verified address, and we keep it in a signed cookie.
// 2. Demo sign-in: the person types a USC email and nothing checks it. It is
//    the only way in while Google is not set up, and stays available next to
//    Google only when ALLOW_DEMO_SIGNIN=true.
//
// The cookie holds { email, exp } plus an HMAC made with AUTH_SECRET, so the
// browser can read it back to us but cannot change it or make one up.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { uscEmail } from "./http";

export const SESSION_COOKIE = "roster_session";
export const STATE_COOKIE = "roster_oauth_state";

const SESSION_SECONDS = 7 * 24 * 60 * 60;
// A short secret can be guessed, and then anyone could sign cookies.
const MIN_SECRET_CHARS = 32;

/** True when Google sign-in has everything it needs. */
export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.AUTH_SECRET ?? "").length >= MIN_SECRET_CHARS,
  );
}

/** True when typing a USC email (unverified) is accepted as signing in. */
export function demoSignInAllowed(): boolean {
  return !googleConfigured() || process.env.ALLOW_DEMO_SIGNIN === "true";
}

/** Where this site lives, for example "http://localhost:3000". No trailing slash. */
export function siteOrigin(request: Request): string {
  const fixed = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  return fixed || new URL(request.url).origin;
}

/** Cookie settings shared by both cookies. `secure` is off only on http://localhost. */
export function cookieOptions(request: Request, maxAge: number) {
  return {
    httpOnly: true, // page scripts cannot read it
    sameSite: "lax" as const, // not sent on requests made by other sites
    secure: siteOrigin(request).startsWith("https://"),
    path: "/",
    maxAge,
  };
}

function sign(payload: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(payload).digest("base64url");
}

/** Compare two strings without leaking, through timing, where they differ. */
export function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The cookie value for a verified USC email, and how long it lasts. */
export function newSession(email: string): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_SECONDS };
}

/** The email inside a session cookie value, or null if it is forged, broken or expired. */
function readSession(value: string | undefined): string | null {
  if (!value || !googleConfigured()) return null;
  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  if (!sameText(signature, sign(payload))) return null;
  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data !== "object" || data === null) return null;
    const { email, exp } = data as { email?: unknown; exp?: unknown };
    if (typeof exp !== "number" || exp < Date.now() / 1000) return null;
    return uscEmail(email) || null;
  } catch {
    return null;
  }
}

/** The USC email Google verified for this browser, or null. */
export async function verifiedEmail(): Promise<string | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

/**
 * The email to act as for this request. A verified session always wins. The
 * address the page sent (`claimed`) only counts while demo sign-in is allowed.
 * Returns "" when the person has to sign in first.
 */
export async function actingEmail(claimed: unknown): Promise<string> {
  const verified = await verifiedEmail();
  if (verified) return verified;
  return demoSignInAllowed() ? uscEmail(claimed) : "";
}

/**
 * True when this request may use the parts of the site that are for signed-in
 * people: the AI calls (they cost money) and the lists of who is on the
 * roster. With Google sign-in on and demo sign-in off, that means a verified
 * USC session; otherwise everyone may.
 */
export async function mayUseSite(): Promise<boolean> {
  if (demoSignInAllowed()) return true;
  return (await verifiedEmail()) !== null;
}

export const SIGN_IN_FIRST = "Please sign in with your USC account first.";
