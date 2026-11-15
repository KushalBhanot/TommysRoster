// Loads data/people.csv into memory, once per server process. There is no
// database: everything the API serves comes from here.

import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import { normalizeCode, normalizeOpenTo, type OpenTo } from "./normalize";

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
  can_help_with: string;
  open_to: Exclude<OpenTo, "no">;
}

const DATA_DIR = path.join(process.cwd(), "data");

export function usingSampleData(): boolean {
  return process.env.USE_SAMPLE_DATA === "true";
}

export function dataPath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

/**
 * Turn CSV text into person rows. A row is skipped when it has no person_id,
 * first_name or code, or when open_to is not a clear opt-in.
 */
export function parsePeopleCsv(text: string): PersonRow[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];

  const columns = header.map((name) => name.trim().toLowerCase());
  const missing = ["person_id", "first_name", "code", "open_to"].filter(
    (c) => !columns.includes(c),
  );
  if (missing.length > 0) {
    throw new Error(`People CSV is missing column(s): ${missing.join(", ")}`);
  }
  if (columns.includes("email")) {
    console.warn(
      "[data] The people CSV has an email column. It is ignored, but the file " +
        "must not be committed like this. Run `npm run prepare-data`.",
    );
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
    const open_to = normalizeOpenTo(cell(row, "open_to"));
    if (!Number.isInteger(person_id) || person_id <= 0) continue;
    if (!first_name || !code || open_to === "no") continue;

    people.push({
      person_id,
      first_name,
      major: cell(row, "major"),
      grad_year: cell(row, "grad_year"),
      code,
      semester: cell(row, "semester"),
      professor: cell(row, "professor"),
      can_help_with: cell(row, "can_help_with"),
      open_to,
    });
  }
  return people;
}

// Rows from the CSV plus people who signed up while the server is running.
// Kept on globalThis, not in a module variable: Next.js can load this file
// once per API route, and every route must see the same list.
const shared = globalThis as typeof globalThis & { __people?: PersonRow[] };

/** Every person row. Loaded from disk on first use, then kept in memory. */
export function getPeopleRows(): PersonRow[] {
  if (shared.__people) return shared.__people;
  let people: PersonRow[];

  const fileName = usingSampleData() ? "sample-people.csv" : "people.csv";
  const file = dataPath(fileName);
  if (fs.existsSync(file)) {
    people = parsePeopleCsv(fs.readFileSync(file, "utf8"));
  } else {
    console.warn(`[data] data/${fileName} not found, serving no people.`);
    people = [];
  }
  shared.__people = people;
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

/** The next unused person_id. */
export function nextPersonId(): number {
  return Math.max(0, ...getPeopleRows().map((row) => row.person_id)) + 1;
}
