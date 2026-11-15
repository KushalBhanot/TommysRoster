import { errorJson, json, readJsonObject, textField } from "@/lib/http";
import { matchPeople } from "@/lib/match";
import { normalizeCode } from "@/lib/normalize";

const MAX_QUESTION_CHARS = 300;
const MAX_ASKER_FIELD_CHARS = 60;

// An optional short text field; anything too long is treated as not given.
function optionalText(value: unknown): string {
  const text = textField(value);
  return text.length <= MAX_ASKER_FIELD_CHARS ? text : "";
}

// POST /api/match
// body { question, asker_major?, asker_year?, code? }
// → { matches: [{ person, code, courses, reason }], draft_message }
export async function POST(request: Request) {
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
      asker_year: optionalText(body.asker_year),
      code: typeof body.code === "string" ? normalizeCode(body.code) : "",
    });
    return json(result);
  } catch (error) {
    console.error("[api/match]", error);
    return errorJson("Could not find matches right now. Please try again.", 500);
  }
}
