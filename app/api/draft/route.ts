// The draft endpoint: checks the request, finds the person, then hands it to lib/draft.ts.

import { draftMessage, findPersonRow } from "@/lib/draft";
import { errorJson, json, readJsonObject, textField } from "@/lib/http";
import { askerAbout, askerCourses, askerLevel } from "@/lib/match";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { SIGN_IN_FIRST, mayUseSite } from "@/lib/session";

const MAX_QUESTION_CHARS = 300;
const MAX_ASKER_FIELD_CHARS = 60;
const MAX_FIRST_NAME_CHARS = 40;

// Each draft calls a paid model, so one IP gets 20 per minute. The key has its
// own prefix so drafts do not use up the same allowance as /api/match.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

// An optional short text field; anything too long is treated as not given.
function optionalText(value: unknown): string {
  const text = textField(value);
  return text.length <= MAX_ASKER_FIELD_CHARS ? text : "";
}

// A first name: letters (any alphabet), spaces, apostrophes and hyphens only.
// Anything else is ignored rather than rejected, since it is only a sign-off.
function firstName(value: unknown): string {
  const name = textField(value).replace(/\s+/g, " ");
  if (name.length > MAX_FIRST_NAME_CHARS) return "";
  return /^\p{L}[\p{L} '\-]*$/u.test(name) ? name : "";
}

// POST /api/draft
// body { person_id, code, question?, asker_first_name?, asker_major?,
//        asker_level?, asker_year?, asker_courses?, asker_about? }
// → { draft, source: "ai" | "template" }
export async function POST(request: Request) {
  // The AI costs money per call: when only USC Google sign-in is accepted,
  // it answers signed-in USC accounts and nobody else.
  if (!(await mayUseSite())) return errorJson(SIGN_IN_FIRST, 401);

  if (!allowRequest(`draft:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return errorJson("Too many drafts in a short time. Please wait a minute and try again.", 429);
  }

  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body with a person_id and a course code.", 400);

  const personId = Number(body.person_id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return errorJson("Send the person_id of the person you want to write to.", 400);
  }
  const code = textField(body.code);
  if (!code) return errorJson("Send the course code this message is about.", 400);

  const question = textField(body.question);
  if (question.length > MAX_QUESTION_CHARS) {
    return errorJson(`Please keep the question under ${MAX_QUESTION_CHARS} characters.`, 400);
  }

  const row = findPersonRow(personId, code);
  if (!row) return errorJson("That person is not listed for this course. Go back to the course page and pick someone there.", 404);

  try {
    const result = await draftMessage(row, {
      question,
      asker_first_name: firstName(body.asker_first_name),
      asker_major: optionalText(body.asker_major),
      asker_level: askerLevel(body.asker_level),
      asker_year: optionalText(body.asker_year),
      asker_courses: askerCourses(body.asker_courses),
      asker_about: askerAbout(body.asker_about),
    });
    return json(result);
  } catch (error) {
    console.error("[api/draft]", error);
    return errorJson("Could not write a draft right now. Please try again.", 500);
  }
}
