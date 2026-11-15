import { getPeopleRows } from "@/lib/data";
import { errorJson, json, readJsonObject, textField, uscEmail } from "@/lib/http";
import { normalizeCode } from "@/lib/normalize";
import { saveRecord } from "@/lib/store";

const MAX_MESSAGE_CHARS = 1000;

// POST /api/request: ask to be introduced to a person.
// body { person_id, code?, question, from_email } → { ok: true }
// The request is stored, no email is sent in v1.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body.", 400);

  const from_email = uscEmail(body.from_email);
  if (!from_email) return errorJson("Please use your @usc.edu email.", 400);

  const question = textField(body.question);
  if (!question) return errorJson("Please write a message.", 400);
  if (question.length > MAX_MESSAGE_CHARS) {
    return errorJson(`Please keep the message under ${MAX_MESSAGE_CHARS} characters.`, 400);
  }

  const person_id = Number(body.person_id);
  const code = normalizeCode(textField(body.code));

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
    });
    return json({ ok: true });
  } catch (error) {
    console.error("[api/request]", error);
    return errorJson("Could not save your request. Please try again.", 500);
  }
}
