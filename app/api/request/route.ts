// POST /api/request: a student asks to be introduced to a person on the roster.
// The request is always stored; it is also emailed when email is set up and
// an address is known for that person.

import { findCourse } from "@/lib/catalog";
import { getPeopleRows } from "@/lib/data";
import { emailConfigured, emailForPerson, sendEmail } from "@/lib/email";
import { errorJson, json, readJsonObject, textField } from "@/lib/http";
import { normalizeCode } from "@/lib/normalize";
import { SIGN_IN_FIRST, actingEmail, demoSignInAllowed } from "@/lib/session";
import { clientIdField, saveRecord } from "@/lib/store";

const MAX_MESSAGE_CHARS = 1000;

/** The plain-text email the person receives. It never shows the asker's address. */
function introEmail(question: string, code: string, title: string) {
  const subject = code
    ? `A USC student has a question about ${code} ${title}`.trim()
    : "A USC student has a question for you";
  const why = code
    ? `You are getting this because you are on Tommy's Roster for ${code}.`
    : "You are getting this because you are on Tommy's Roster.";
  const text = [
    "A USC student sent you this through Tommy's Roster:",
    "",
    question,
    "",
    "Reply to this email to answer them directly.",
    why,
  ].join("\n");
  return { subject, text };
}

// body { person_id, code?, question, from_email, client_id? }
// → { ok: true, delivery: "emailed" | "saved" }
// The response never contains an email address.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body.", 400);

  // Who is asking. A verified USC Google session always wins over what the
  // page sent, so nobody can send a request in someone else's name. The typed
  // address only counts while demo sign-in is allowed.
  const from_email = await actingEmail(body.from_email);
  if (!from_email) {
    return demoSignInAllowed()
      ? errorJson("Please use your @usc.edu email.", 400)
      : errorJson(SIGN_IN_FIRST, 401);
  }

  const question = textField(body.question);
  if (!question) return errorJson("Please write a message.", 400);
  if (question.length > MAX_MESSAGE_CHARS) {
    return errorJson(`Please keep the message under ${MAX_MESSAGE_CHARS} characters.`, 400);
  }

  const person_id = Number(body.person_id);
  const code = normalizeCode(textField(body.code));
  // Optional browser id, so DELETE /api/me can remove this request later.
  const client_id = clientIdField(body.client_id);

  try {
    // The person must be listed, and listed for that course if one is given.
    const rows = getPeopleRows().filter((row) => row.person_id === person_id);
    if (rows.length === 0) return errorJson("This person is not listed.", 404);
    if (code && !rows.some((row) => row.code === code)) {
      return errorJson("This person is not listed for that course.", 400);
    }

    saveRecord("requests.json", {
      created_at: new Date().toISOString(),
      person_id,
      code,
      question,
      from_email,
      ...(client_id ? { client_id } : {}),
    });
  } catch (error) {
    // Log the message only, never the record: it holds an email.
    console.error("[api/request]", error instanceof Error ? error.message : "unknown error");
    return errorJson("Could not save your request. Please try again.", 500);
  }

  // The request is saved. Emailing it is a bonus: any failure here still
  // answers ok, with delivery "saved".
  let delivery: "emailed" | "saved" = "saved";
  try {
    const to = emailConfigured() ? emailForPerson(person_id) : null;
    if (to) {
      const { subject, text } = introEmail(question, code, code ? (findCourse(code)?.title ?? "") : "");
      if (await sendEmail({ to, replyTo: from_email, subject, text })) delivery = "emailed";
    }
  } catch (error) {
    // Log the error type only: a message could quote an address.
    console.warn("[api/request] email step failed:", error instanceof Error ? error.name : "unknown error");
  }
  return json({ ok: true, delivery });
}
