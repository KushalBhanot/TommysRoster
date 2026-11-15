// Builds the JSON shapes for GET /api/courses and GET /api/courses/[code]/people
// (see the "API" section of SPEC.md) from the in-memory person rows.

import { getPeopleRows, type PersonRow } from "./data";
import { normalizeCode, semesterRank } from "./normalize";

export interface CourseSummary {
  code: string;
  people_count: number;
}

/** A person as the API returns them: one person in one course. */
export interface Person {
  person_id: number;
  first_name: string;
  major: string;
  grad_year: string;
  semester: string;
  professor: string;
  can_help_with: string;
  open_to: string;
}

export function toPerson(row: PersonRow): Person {
  return {
    person_id: row.person_id,
    first_name: row.first_name,
    major: row.major,
    grad_year: row.grad_year,
    semester: row.semester,
    professor: row.professor,
    can_help_with: row.can_help_with,
    open_to: row.open_to,
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
  const code = normalizeCode(rawCode);
  const seen = new Set<number>();
  return newestFirst(getPeopleRows().filter((row) => row.code === code)).filter((row) => {
    if (seen.has(row.person_id)) return false;
    seen.add(row.person_id);
    return true;
  });
}

/** All courses with at least one person, most people first. */
export function listCourses(): CourseSummary[] {
  // A Set per course, so a person who signed up twice is counted once.
  const peopleByCourse = new Map<string, Set<number>>();
  for (const row of getPeopleRows()) {
    if (!peopleByCourse.has(row.code)) peopleByCourse.set(row.code, new Set());
    peopleByCourse.get(row.code)!.add(row.person_id);
  }

  return [...peopleByCourse.entries()]
    .map(([code, ids]) => ({ code, people_count: ids.size }))
    .sort((a, b) => b.people_count - a.people_count || a.code.localeCompare(b.code));
}

/** Everyone who took a course and is open to questions, newest first. */
export function getCoursePeople(rawCode: string): Person[] {
  return getCourseRows(rawCode).map(toPerson);
}
