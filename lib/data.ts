// Loads the people on the roster into memory, once per server process. There
// is no database: everything the API serves about people comes from here.
//
// The file is data/demo-people.csv, written by scripts/generate-demo-people.ts.
// People who sign up while the server is running are added to the same list
// in memory (see addPersonRow).

import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import { normalizeCode } from "./normalize";
import { ABOUT_TAGS, HELP_TAGS, type AboutTag, type HelpTag } from "./tags";

/**
 * One person in one course (a person who took three courses has three rows
 * with the same person_id). There is deliberately no email field: the loader
 * never reads one, so no API response can leak it.
 */
export interface PersonRow {
  person_id: number;
  first_name: string;
  major: string;
  grad_year: string;
  code: string;
  semester: string;
  professor: string;
  /** What they can talk about for this course (from the fixed list). */
  help_tags: HelpTag[];
  /** Optional things they said about themselves (from the fixed list). */
  about_tags: AboutTag[];
  /** One sentence in their own words. Only demo profiles have one. */
  note: string;
  /** "demo" = an invented profile for the prototype, "real" = someone who signed up. */
  source: "demo" | "real";
}

const PEOPLE_FILE = path.join(process.cwd(), "data", "demo-people.csv");

/** "A;B" → ["A", "B"], keeping only values that are on the allowed list. */
function parseTags<T extends string>(cell: string, allowed: readonly T[]): T[] {
  return cell
    .split(";")
    .map((tag) => tag.trim())
    .filter((tag): tag is T => (allowed as readonly string[]).includes(tag));
}

/** Turn CSV text into person rows. A row with no person_id, name or code is skipped. */
export function parsePeopleCsv(text: string): PersonRow[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];

  const columns = header.map((name) => name.trim().toLowerCase());
  const missing = ["person_id", "first_name", "code"].filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new Error(`People CSV is missing column(s): ${missing.join(", ")}`);
  }

  // Read a cell by column name; a column that is absent reads as "".
  const cell = (row: string[], name: string) => {
    const index = columns.indexOf(name);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };

  const people: PersonRow[] = [];
  for (const row of rows) {
    const person_id = Number(cell(row, "person_id"));
    const first_name = cell(row, "first_name");
    const code = normalizeCode(cell(row, "code"));
    if (!Number.isInteger(person_id) || person_id <= 0 || !first_name || !code) continue;

    people.push({
      person_id,
      first_name,
      major: cell(row, "major"),
      grad_year: cell(row, "grad_year"),
      code,
      semester: cell(row, "semester"),
      professor: cell(row, "professor"),
      help_tags: parseTags(cell(row, "help_tags"), HELP_TAGS),
      about_tags: parseTags(cell(row, "about_tags"), ABOUT_TAGS),
      note: cell(row, "note"),
      source: cell(row, "source") === "real" ? "real" : "demo",
    });
  }
  return people;
}

// Rows from the CSV plus people who signed up while the server is running.
// Kept on globalThis, not in a module variable: Next.js can load this file
// once per API route, and every route must see the same list.
const shared = globalThis as typeof globalThis & {
  __people?: PersonRow[];
  /** Which version of the file __people was read from (its last-changed time). */
  __peopleVersion?: number;
  /** The highest person_id handed out since the server started, so a deleted one is never reused. */
  __lastPersonId?: number;
};

/**
 * Every person row. Read from disk on first use, then kept in memory. If the
 * file is replaced while the server is running (the demo data is regenerated),
 * it is read again, so nobody has to remember to restart the server.
 */
export function getPeopleRows(): PersonRow[] {
  const version = fs.existsSync(PEOPLE_FILE) ? fs.statSync(PEOPLE_FILE).mtimeMs : 0;
  if (shared.__people && shared.__peopleVersion === version) return shared.__people;

  let people: PersonRow[];
  if (version) {
    people = parsePeopleCsv(fs.readFileSync(PEOPLE_FILE, "utf8"));
  } else {
    console.warn("[data] data/demo-people.csv not found, serving no people.");
    people = [];
  }
  shared.__people = people;
  shared.__peopleVersion = version;
  return people;
}

/**
 * Add someone who signed up while the server is running, so they show up in
 * the lists right away. Returns the row that was added.
 */
export function addPersonRow(row: PersonRow): PersonRow {
  getPeopleRows().push(row);
  return row;
}

/**
 * Take sign-ups off the roster: removes the rows of people who signed up
 * while the server is running ("real" rows) that match. Demo rows are never
 * removed. Returns how many rows were removed.
 */
export function removePersonRows(matches: (row: PersonRow) => boolean): number {
  const people = getPeopleRows();
  let removed = 0;
  // Walk backwards so splicing does not skip the next row.
  for (let i = people.length - 1; i >= 0; i--) {
    if (people[i].source === "real" && matches(people[i])) {
      people.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

/**
 * A person_id nobody has had. It never goes back down when people are
 * removed: if a deleted person's id were handed to the next sign-up, an Ask
 * window still open on the old card would reach the new person instead.
 */
export function nextPersonId(): number {
  const highest = Math.max(0, shared.__lastPersonId ?? 0, ...getPeopleRows().map((row) => row.person_id));
  shared.__lastPersonId = highest + 1;
  return shared.__lastPersonId;
}
