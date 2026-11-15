import { findCourse, instructorsFor, semestersOffered } from "@/lib/catalog";
import { addPersonRow, nextPersonId } from "@/lib/data";
import { errorJson, json, readJsonObject, textField, uscEmail } from "@/lib/http";
import { saveRecord } from "@/lib/store";
import { ABOUT_TAGS, HELP_TAGS, type AboutTag, type HelpTag } from "@/lib/tags";
import MAJORS from "@/data/majors.json";

const MAX_NAME_CHARS = 40;

// Sign-ups made since the server started: email → person_id, so one person
// signing up for two courses keeps one id.
const shared = globalThis as typeof globalThis & { __idByEmail?: Map<string, number> };
const idByEmail = (shared.__idByEmail ??= new Map<string, number>());

/** The values in a JSON array that are on the allowed list, each once. */
function chosenFrom<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)].filter((item): item is T => (allowed as readonly unknown[]).includes(item));
}

// POST /api/people: sign up as someone who took a course.
// body { first_name, email, major, grad_year, code, semester, professor,
//        help_tags, about_tags? } → { ok: true }
// Apart from the first name and the email, every value must be one the form
// offered: a major from the official list, a course from the catalog, a
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

  const email = uscEmail(body.email);
  if (!email) return errorJson("Please use your @usc.edu email.", 400);

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

  try {
    if (!idByEmail.has(email)) idByEmail.set(email, nextPersonId());
    const person_id = idByEmail.get(email)!;

    // The public row has no email; the private record does.
    const row = addPersonRow({
      person_id, first_name, major, grad_year, code: course.code, semester, professor,
      help_tags, about_tags, note: "", source: "real",
    });
    saveRecord("new-people.json", { created_at: new Date().toISOString(), ...row, email });
    return json({ ok: true });
  } catch (error) {
    console.error("[api/people]", error);
    return errorJson("Could not save your sign-up. Please try again.", 500);
  }
}
