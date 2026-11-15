// Sends intro request emails through Resend's REST API (no SDK, just fetch),
// and finds the email address for a person on the roster.
//
// Email is optional. Without RESEND_API_KEY nothing is sent and the request
// is only stored. Addresses are never logged and never returned by an API.

import fs from "node:fs";
import path from "node:path";
import { EMAIL_LOGO_PNG_BASE64 } from "./email-logo";
import { recordsInMemory } from "./store";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Tommy's Roster <onboarding@resend.dev>";
const TIMEOUT_MS = 10_000;
// Ties the <img> in the HTML email to the logo attached to it.
const LOGO_CONTENT_ID = "tommys-roster-logo";

// Optional file { "<person_id>": "<email>" } for people on the roster who did
// not sign up through the site. Gitignored with the rest of data/private/.
const PERSON_EMAILS_FILE = path.join(process.cwd(), "data", "private", "person-emails.json");

/** True when the server has what it needs to send email. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send one plain-text email. Returns true only when Resend accepted it (a 2xx
 * answer). Never throws: any problem is logged (status only, no addresses)
 * and returns false.
 */
export async function sendEmail({
  to,
  replyTo,
  subject,
  text,
  html,
}: {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  /** Optional designed version. Mail apps that cannot show it use `text`. */
  html?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
        // The designed version carries the logo inside the email: the <img>
        // in the HTML points at this attachment by its content id.
        ...(html
          ? {
              html,
              attachments: [
                {
                  content: EMAIL_LOGO_PNG_BASE64,
                  filename: "tommys-roster.png",
                  content_type: "image/png",
                  content_id: LOGO_CONTENT_ID,
                },
              ],
            }
          : {}),
      }),
      // Give up after 10 seconds so a slow email service never hangs the request.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return true;
    console.warn(`[email] Resend answered ${response.status}, email not sent.`);
    return false;
  } catch (error) {
    console.warn("[email] could not reach Resend:", error instanceof Error ? error.name : "unknown error");
    return false;
  }
}

/** A string that looks like an email address, in lowercase, or "". */
function asEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/**
 * The email address for a person, or null when none is known. Looks first in
 * data/private/person-emails.json (read fresh each time, so it can be edited
 * while the server runs), then at the sign-ups made since the server started.
 */
export function emailForPerson(person_id: number): string | null {
  try {
    if (fs.existsSync(PERSON_EMAILS_FILE)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(PERSON_EMAILS_FILE, "utf8"));
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const email = asEmail((parsed as Record<string, unknown>)[String(person_id)]);
        if (email) return email;
      }
    }
  } catch {
    // A missing or malformed file just means no address from it.
    console.warn("[email] data/private/person-emails.json could not be read, skipping it.");
  }

  // The newest sign-up wins, in case a record was ever saved twice.
  const signups = recordsInMemory("new-people.json") as Record<string, unknown>[];
  for (let i = signups.length - 1; i >= 0; i--) {
    if (signups[i].person_id === person_id) {
      const email = asEmail(signups[i].email);
      if (email) return email;
    }
  }
  return null;
}

/** Make text safe to place inside HTML: nothing a person typed can become markup. */
function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * The designed version of the intro email: the logo and name on top, the
 * asker's message set apart with a cardinal rule, then what to do. Mail apps
 * only understand old-style HTML, so the layout is a table with inline styles.
 * `message` is what the asker typed, so it is escaped before it goes in.
 */
export function introEmailHtml({ message, why }: { message: string; why: string }): string {
  const body = escapeHtml(message).replaceAll("\n", "<br>");
  const font = "font-family:Helvetica,Arial,sans-serif;";
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  <tr><td style="padding-bottom:20px;border-bottom:2px solid #111111;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;"><img src="cid:${LOGO_CONTENT_ID}" width="44" height="44" alt="" style="display:block;border:0;"></td>
      <td style="${font}font-size:18px;font-weight:bold;letter-spacing:1px;color:#111111;">TOMMY&#39;S ROSTER</td>
    </tr></table>
  </td></tr>
  <tr><td style="${font}font-size:16px;line-height:24px;color:#111111;padding-top:24px;">
    A USC student sent you this through Tommy&#39;s Roster:
  </td></tr>
  <tr><td style="padding-top:16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="border-left:4px solid #990000;padding:4px 0 4px 16px;${font}font-size:16px;line-height:24px;color:#111111;">${body}</td>
    </tr></table>
  </td></tr>
  <tr><td style="${font}font-size:16px;line-height:24px;color:#111111;font-weight:bold;padding-top:24px;">
    Reply to this email to answer them directly.
  </td></tr>
  <tr><td style="${font}font-size:13px;line-height:20px;color:#555555;padding-top:8px;">
    ${escapeHtml(why)}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
