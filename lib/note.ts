// The optional sentence a person may add when they join a course roster.
// It is the one piece of free text on the site, so it is checked in code
// before it is stored: short, about themselves, no contact details, no markup,
// and no comment on whoever taught the course. There is no human moderation.

export const MAX_NOTE_CHARS = 140;

// Words that point at the teacher. A note is about the writer's own
// experience; opinions about a professor are not what this site is for.
const ABOUT_A_TEACHER = /\b(professors?|prof|instructors?|teachers?|lecturers?|ta|tas|dr)\b/i;
// An email address, a link, or a run of digits long enough to be a phone number.
const CONTACT_DETAILS = /@|https?:|www\.|\.(com|edu|net|org)\b|\d{5,}/i;
// A phone number written with separators, like 555-123-4567 or (555) 123 4567:
// seven or more digits once spaces, dashes, dots, brackets and "+" are removed.
const SEPARATED_PHONE = /\d{7,}/;
// Characters that would be markup or code rather than a sentence.
const MARKUP = /[[\]{}<>|`\\*_#=~^]/;

/**
 * Tidies a note and says what is wrong with it, if anything.
 * Returns { note } ("" when nothing was written) or { error } to show the person.
 */
export function checkNote(value: unknown): { note: string } | { error: string } {
  if (value === undefined || value === null || value === "") return { note: "" };
  if (typeof value !== "string") return { error: "Please write your note as one sentence." };
  const note = value.replace(/\s+/g, " ").trim();
  if (!note) return { note: "" };
  if (note.length > MAX_NOTE_CHARS) return { error: `Please keep your note under ${MAX_NOTE_CHARS} characters.` };
  if (MARKUP.test(note)) return { error: "Please write your note as a plain sentence, without symbols." };
  if (CONTACT_DETAILS.test(note) || SEPARATED_PHONE.test(note.replace(/[\s().+-]/g, ""))) return { error: "Please leave contact details and links out of your note." };
  if (ABOUT_A_TEACHER.test(note)) {
    return { error: "Please write about your own experience, not about a professor or TA." };
  }
  // End it like a sentence, so it reads cleanly next to the others.
  return { note: /[.!?]$/.test(note) ? note : `${note}.` };
}
