// The official course catalog and instructor lists, read from the two files
// scripts/fetch-catalog.ts writes (data/catalog.json, data/instructors.json).
//
// Nothing about courses, semesters or professors is typed by hand anywhere in
// the app: titles come from here, the list of semesters is whatever semesters
// instructors.json contains, and a professor can only be chosen from the names
// the schedule lists for that course in that semester. Rerunning the script at
// the start of a semester is all it takes to add the new one.

import fs from "node:fs";
import path from "node:path";
import { normalizeCode, semesterRank } from "./normalize";

export interface CatalogCourse {
  code: string;
  title: string;
  department: string;
}

interface Catalog {
  courses: CatalogCourse[];
  byCode: Map<string, CatalogCourse>;
  /** semester → course code → instructor names */
  instructors: Record<string, Record<string, string[]>>;
  /** Every semester in the data, newest first. */
  semesters: string[];
}

// On globalThis so every API route shares one copy (see lib/data.ts).
const shared = globalThis as typeof globalThis & { __catalog?: Catalog };

function readJson<T>(fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", fileName), "utf8")) as T;
}

function load(): Catalog {
  if (shared.__catalog) return shared.__catalog;
  const courses = readJson<CatalogCourse[]>("catalog.json");
  const instructors = readJson<Record<string, Record<string, string[]>>>("instructors.json");
  shared.__catalog = {
    courses,
    byCode: new Map(courses.map((course) => [course.code, course])),
    instructors,
    semesters: Object.keys(instructors).sort((a, b) => semesterRank(b) - semesterRank(a)),
  };
  return shared.__catalog;
}

/**
 * Find a course however it was typed: "csci103", "CSCI 103", "csci-103L".
 * The catalog drops the flag letters USC adds to a number (L for lab, g for
 * general education), so if the exact code is unknown, trailing letters are
 * removed one at a time until a course is found.
 */
export function findCourse(rawCode: string): CatalogCourse | null {
  const { byCode } = load();
  let code = normalizeCode(rawCode);
  while (code) {
    const course = byCode.get(code);
    if (course) return course;
    if (!/[A-Z]$/.test(code) || !/\d/.test(code)) return null;
    code = code.slice(0, -1);
  }
  return null;
}

/** The title of a course, or "" if the code is not in the catalog. */
export function courseTitle(code: string): string {
  return load().byCode.get(code)?.title ?? "";
}

/** Every semester the app knows, newest first. */
export function allSemesters(): string[] {
  return load().semesters;
}

/** The semesters a course was actually offered in, newest first. */
export function semestersOffered(code: string): string[] {
  const { semesters, instructors } = load();
  return semesters.filter((semester) => code in (instructors[semester] ?? {}));
}

/** The instructors the schedule lists for a course in one semester ([] if none). */
export function instructorsFor(code: string, semester: string): string[] {
  return load().instructors[semester]?.[code] ?? [];
}

/**
 * Courses whose code or title matches what was typed, best first: a code that
 * starts with the text, then a code that contains it, then a title that
 * contains it.
 */
export function searchCatalog(query: string, limit: number): CatalogCourse[] {
  const compact = query.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const words = query.trim().toLowerCase();
  if (!compact && !words) return [];

  const scored: { course: CatalogCourse; score: number }[] = [];
  for (const course of load().courses) {
    const code = course.code.replace(" ", "");
    let score = 0;
    if (compact && code.startsWith(compact)) score = 3;
    else if (compact && code.includes(compact)) score = 2;
    else if (words.length >= 3 && course.title.toLowerCase().includes(words)) score = 1;
    if (score > 0) scored.push({ course, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.course.code.localeCompare(b.course.code))
    .slice(0, limit)
    .map((entry) => entry.course);
}
