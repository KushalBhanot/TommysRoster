// Sends intro request emails through Resend's REST API (no SDK, just fetch),
// and finds the email address for a person on the roster.
//
// Email is optional. Without RESEND_API_KEY nothing is sent and the request
// is only stored. Addresses are never logged and never returned by an API.

import fs from "node:fs";
import path from "node:path";
import { recordsInMemory } from "./store";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Tommy's Roster <onboarding@resend.dev>";
const TIMEOUT_MS = 10_000;

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
}: {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
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
