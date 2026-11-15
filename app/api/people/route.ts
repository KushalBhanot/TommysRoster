import { addPersonRow, nextPersonId } from "@/lib/data";
import { errorJson, json, readJsonObject, textField, uscEmail } from "@/lib/http";
import { normalizeCode } from "@/lib/normalize";
import { saveRecord } from "@/lib/store";

// A USC course code after normalizing: "WRIT 150", "CSCI 103L", "EE 109L".
const COURSE_CODE = /^[A-Z]{2,5} \d{3}[A-Z]{0,2}$/;

// Longest allowed value for each text field.
const MAX_CHARS = {
  first_name: 40,
  major: 60,
  grad_year: 10,
  semester: 20,
  professor: 60,
  can_help_with: 300,
};

// Sign-ups made since the server started: email → person_id, so one person
// signing up for two courses keeps one id. (Emails of people in the CSV are
// not loaded, so those cannot be matched here.)
const shared = globalThis as typeof globalThis & { __idByEmail?: Map<string, number> };
const idByEmail = (shared.__idByEmail ??= new Map<string, number>());

// POST /api/people: sign up as someone who took a course.
// body { first_name, major, grad_year, email, code, semester, professor?,
//        can_help_with, open_to } → { ok: true }
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body.", 400);

  const email = uscEmail(body.email);
  if (!email) return errorJson("Please use your @usc.edu email.", 400);

  const code = normalizeCode(textField(body.code));
  if (!COURSE_CODE.test(code)) {
    return errorJson('Please enter a course code like "WRIT 150".', 400);
  }

  const open_to = textField(body.open_to);
  if (open_to !== "questions" && open_to !== "questions+coffee") {
    return errorJson('open_to must be "questions" or "questions+coffee".', 400);
  }

  // Read the text fields, checking required ones and lengths in one pass.
  const fields = {
    first_name: textField(body.first_name),
    major: textField(body.major),
    grad_year: textField(body.grad_year),
    semester: textField(body.semester),
    professor: textField(body.professor),
    can_help_with: textField(body.can_help_with),
  };
  for (const [name, value] of Object.entries(fields)) {
    if (!value && name !== "professor") return errorJson(`Please fill in ${name}.`, 400);
    if (value.length > MAX_CHARS[name as keyof typeof MAX_CHARS]) {
      return errorJson(`${name} is too long.`, 400);
    }
  }

  try {
    if (!idByEmail.has(email)) idByEmail.set(email, nextPersonId());
    const person_id = idByEmail.get(email)!;

    // The public row has no email; the private record does.
    const row = addPersonRow({ person_id, ...fields, code, open_to });
    saveRecord("new-people.json", { created_at: new Date().toISOString(), ...row, email });
    return json({ ok: true });
  } catch (error) {
    console.error("[api/people]", error);
    return errorJson("Could not save your sign-up. Please try again.", 500);
  }
}
