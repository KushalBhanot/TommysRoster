// The match endpoint: checks the request, then hands it to lib/match.ts.

import { errorJson, json, readJsonObject, textField } from "@/lib/http";
import { askerCourses, askerLevel, matchPeople } from "@/lib/match";
import { normalizeCode } from "@/lib/normalize";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { SIGN_IN_FIRST, mayUseSite } from "@/lib/session";

const MAX_QUESTION_CHARS = 300;
const MAX_ASKER_FIELD_CHARS = 60;

// Each match request calls a paid model, so one IP gets 10 per minute.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

// An optional short text field; anything too long is treated as not given.
function optionalText(value: unknown): string {
  const text = textField(value);
  return text.length <= MAX_ASKER_FIELD_CHARS ? text : "";
}

// POST /api/match
// body { question, asker_major?, asker_level?, asker_year?, asker_courses?, code? }
// → { status, matches: [{ person, reason, key_phrases }], draft_message }
// asker_level is "undergraduate" or "graduate" (anything else is ignored);
// asker_courses is a list of course codes (unknown ones are dropped, at most 40).
export async function POST(request: Request) {
  // The AI costs money per call: when only USC Google sign-in is accepted,
  // it answers signed-in USC accounts and nobody else.
  if (!(await mayUseSite())) return errorJson(SIGN_IN_FIRST, 401);

  if (!allowRequest(clientIp(request), RATE_LIMIT, RATE_WINDOW_MS)) {
    return errorJson("Too many questions in a short time. Please wait a minute and try again.", 429);
  }

  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body with a question.", 400);

  const question = textField(body.question);
  if (!question) return errorJson("Please type a question.", 400);
  if (question.length > MAX_QUESTION_CHARS) {
    return errorJson(`Please keep the question under ${MAX_QUESTION_CHARS} characters.`, 400);
  }

  try {
    const result = await matchPeople({
      question,
      asker_major: optionalText(body.asker_major),
      asker_level: askerLevel(body.asker_level),
      asker_year: optionalText(body.asker_year),
      asker_courses: askerCourses(body.asker_courses),
      code: typeof body.code === "string" ? normalizeCode(body.code) : "",
    });
    return json(result);
  } catch (error) {
    console.error("[api/match]", error);
    return errorJson("Could not find matches right now. Please try again.", 500);
  }
}
