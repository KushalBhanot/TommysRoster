// POST /api/people: someone who took a course adds themselves to the roster.
// The public row has no email; the email lives only in the private record.

import { findCourse, instructorsFor, semestersOffered } from "@/lib/catalog";
import { addPersonRow, nextPersonId } from "@/lib/data";
import { errorJson, json, readJsonObject, textField } from "@/lib/http";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { SIGN_IN_FIRST, actingEmail, demoSignInAllowed } from "@/lib/session";
import { checkNote } from "@/lib/note";
import { clientIdField, recordsInMemory, saveRecord } from "@/lib/store";
import { ABOUT_TAGS, HELP_TAGS, type AboutTag, type HelpTag } from "@/lib/tags";
import MAJORS from "@/data/majors.json";

const MAX_NAME_CHARS = 40;

/**
 * The person_id this email already has from an earlier sign-up since the
 * server started, so one person signing up for two courses keeps one id.
 * Read from the stored records (not a separate list) so that DELETE /api/me
 * removing those records also forgets the email here.
 */
function existingIdFor(email: string): number | undefined {
  const signups = recordsInMemory("new-people.json") as Record<string, unknown>[];
  const match = signups.find((record) => record.email === email && typeof record.person_id === "number");
  return match?.person_id as number | undefined;
}

/** The values in a JSON array that are on the allowed list, each once. */
function chosenFrom<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)].filter((item): item is T => (allowed as readonly unknown[]).includes(item));
}

// POST /api/people: sign up as someone who took a course.
// body { first_name, email, major, grad_year, code, semester, professor,
//        help_tags, about_tags?, note?, client_id? } → { ok: true }
// Apart from the first name, the email and the optional one-sentence note
// (checked by lib/note.ts), every value must be one the form offered: a major from the official list, a course from the catalog, a
// semester the course ran in, a professor listed for it then, and tags from
// the two fixed lists. That is why nothing here needs moderating.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body.", 400);

  const first_name = textField(body.first_name);
  if (!first_name) return errorJson("Please enter your first name.", 400);
  if (first_name.length > MAX_NAME_CHARS || !/^[\p{L}][\p{L} '.-]*$/u.test(first_name)) {
    return errorJson("Please enter just your first name.", 400);
  }

  // A verified USC Google session always wins over the address the page
  // sent, so nobody can put someone else on the roster. The typed address
  // only counts while demo sign-in is allowed.
  const email = await actingEmail(body.email);
  if (!email) {
    return demoSignInAllowed()
      ? errorJson("Please use your @usc.edu email.", 400)
      : errorJson(SIGN_IN_FIRST, 401);
  }

  // Sign-ups add public rows to the roster, so one person on one connection
  // gets 8 in an hour (enough for every course they took).
  if (!allowRequest(`people:${email}:${clientIp(request)}`, 8, 60 * 60_000)) {
    return errorJson("You have signed up for several courses in a short time. Please try again later.", 429);
  }

  const major = textField(body.major);
  if (!(MAJORS as string[]).includes(major)) return errorJson("Please choose your major from the list.", 400);

  const grad_year = textField(body.grad_year);
  const thisYear = new Date().getFullYear();
  if (!/^\d{4}$/.test(grad_year) || Number(grad_year) < thisYear - 1 || Number(grad_year) > thisYear + 6) {
    return errorJson("Please choose your graduation year.", 400);
  }

  const course = findCourse(textField(body.code));
  if (!course) return errorJson("Please choose a course from the catalog.", 400);

  const semester = textField(body.semester);
  if (!semestersOffered(course.code).includes(semester)) {
    return errorJson(`${course.code} was not offered in that semester.`, 400);
  }

  // The professor must be one the schedule lists for that course and semester
  // (or blank, in the rare case the schedule names nobody).
  const professor = textField(body.professor);
  const listed = instructorsFor(course.code, semester);
  if (listed.length > 0 ? !listed.includes(professor) : professor !== "") {
    return errorJson("Please choose your professor from the list.", 400);
  }

  const help_tags: HelpTag[] = chosenFrom(body.help_tags, HELP_TAGS);
  if (help_tags.length === 0) return errorJson("Please pick at least one thing you can talk about.", 400);
  const about_tags: AboutTag[] = chosenFrom(body.about_tags, ABOUT_TAGS);
  // The one free-text field: an optional sentence about their own experience.
  // It is shown on the roster and read by the AI, so it is checked first.
  const checked = checkNote(body.note);
  if ("error" in checked) return errorJson(checked.error, 400);
  // Optional browser id, kept in the private record only, so DELETE /api/me
  // can take this sign-up off the roster later.
  const client_id = clientIdField(body.client_id);

  try {
    const person_id = existingIdFor(email) ?? nextPersonId();

    // The public row has no email; the private record does.
    const row = addPersonRow({
      person_id, first_name, major, grad_year, code: course.code, semester, professor,
      help_tags, about_tags, note: checked.note, source: "real",
    });
    saveRecord("new-people.json", {
      created_at: new Date().toISOString(),
      ...row,
      email,
      ...(client_id ? { client_id } : {}),
    });
    return json({ ok: true });
  } catch (error) {
    // Log the message only, never the record: it holds an email.
    console.error("[api/people]", error instanceof Error ? error.message : "unknown error");
    return errorJson("Could not save your sign-up. Please try again.", 500);
  }
}
