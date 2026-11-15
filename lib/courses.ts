// Builds the JSON shapes the API returns about courses and the people who took
// them (see the "API" section of SPEC.md) from the in-memory person rows.

import { courseTitle, findCourse } from "./catalog";
import { getPeopleRows, type PersonRow } from "./data";
import { semesterRank } from "./normalize";

export interface CourseSummary {
  code: string;
  title: string;
  people_count: number;
}

/** A person as the API returns them: one person in one course. Never an email. */
export interface Person {
  person_id: number;
  first_name: string;
  major: string;
  grad_year: string;
  code: string;
  /** The course's official title, from the catalog. */
  title: string;
  semester: string;
  professor: string;
  help_tags: string[];
  about_tags: string[];
  note: string;
  source: "demo" | "real";
}

export function toPerson(row: PersonRow): Person {
  return {
    person_id: row.person_id,
    first_name: row.first_name,
    major: row.major,
    grad_year: row.grad_year,
    code: row.code,
    title: courseTitle(row.code),
    semester: row.semester,
    professor: row.professor,
    help_tags: row.help_tags,
    about_tags: row.about_tags,
    note: row.note,
    source: row.source,
  };
}

/** Most recent semester first; ties keep the lower person_id first. */
export function newestFirst(rows: PersonRow[]): PersonRow[] {
  return [...rows].sort(
    (a, b) => semesterRank(b.semester) - semesterRank(a.semester) || a.person_id - b.person_id,
  );
}

/**
 * The rows for one course, newest first, one per person. Accepts any spelling
 * of the code. If someone signed up twice for the same course, only their
 * most recent row is kept.
 */
export function getCourseRows(rawCode: string): PersonRow[] {
  const code = findCourse(rawCode)?.code;
  if (!code) return [];
  const seen = new Set<number>();
  return newestFirst(getPeopleRows().filter((row) => row.code === code)).filter((row) => {
    if (seen.has(row.person_id)) return false;
    seen.add(row.person_id);
    return true;
  });
}

/** How many different people took each course. */
function peopleCounts(): Map<string, number> {
  // A Set per course, so a person who signed up twice is counted once.
  const peopleByCourse = new Map<string, Set<number>>();
  for (const row of getPeopleRows()) {
    if (!peopleByCourse.has(row.code)) peopleByCourse.set(row.code, new Set());
    peopleByCourse.get(row.code)!.add(row.person_id);
  }
  return new Map([...peopleByCourse].map(([code, ids]) => [code, ids.size]));
}

export function peopleCount(code: string): number {
  return peopleCounts().get(code) ?? 0;
}

/** All courses with at least one person, most people first. */
export function listCourses(): CourseSummary[] {
  return [...peopleCounts()]
    .map(([code, people_count]) => ({ code, title: courseTitle(code), people_count }))
    .sort((a, b) => b.people_count - a.people_count || a.code.localeCompare(b.code));
}

/** Everyone who took a course, newest first. */
export function getCoursePeople(rawCode: string): Person[] {
  return getCourseRows(rawCode).map(toPerson);
}

/** A few people from the roster (name, major, year only), one row per person. */
export function rosterSample(limit: number): Pick<Person, "first_name" | "major" | "grad_year">[] {
  const seen = new Set<number>();
  const sample = [];
  for (const row of getPeopleRows()) {
    if (seen.has(row.person_id)) continue;
    seen.add(row.person_id);
    sample.push({ first_name: row.first_name, major: row.major, grad_year: row.grad_year });
    if (sample.length === limit) break;
  }
  return sample;
}
