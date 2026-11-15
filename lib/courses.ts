// Builds the JSON shapes for GET /api/courses and GET /api/courses/[code]
// (see the "API" section of SPEC.md) from the in-memory advice rows.

import { getBriefing, getOkAdvice, type Advice, type Briefing } from "./data";
import { HOURS_BUCKETS, normalizeCode, semesterRank, type Hours } from "./normalize";

export interface CourseSummary {
  code: string;
  advice_count: number;
  has_briefing: boolean;
}

export interface HoursPerWeek {
  median: string;
  distribution: Record<string, number>;
}

export interface Source {
  id: number;
  semester: string;
  professor: string;
  hours: string;
  know_before: string;
  tip: string;
  avoid: string;
}

export interface CourseDetail {
  code: string;
  advice_count: number;
  hours_per_week: HoursPerWeek;
  briefing: Briefing | null;
  sources: Source[];
  people_count: number;
}

/** Ok advice rows for one course. Accepts any spelling of the code. */
export function getCourseAdvice(rawCode: string): Advice[] {
  const code = normalizeCode(rawCode);
  return getOkAdvice().filter((row) => row.code === code);
}

/** Rows a student can be asked through: opted in and has a name to show. */
export function getPeopleRows(rows: Advice[]): Advice[] {
  return rows.filter((row) => row.open_to !== "no" && row.first_name !== "");
}

/**
 * Count of answers per bucket plus the median bucket. Pure arithmetic, no LLM.
 * With an even number of answers the median is the lower of the two middle
 * ones. Rows with no valid hours answer are left out; if none are valid the
 * median is "".
 */
export function hoursPerWeek(rows: Advice[]): HoursPerWeek {
  const distribution: Record<string, number> = {};
  for (const bucket of HOURS_BUCKETS) distribution[bucket] = 0;

  const answered = rows.map((row) => row.hours).filter((h): h is Hours => h !== "");
  for (const hours of answered) distribution[hours] += 1;

  // Sort answers by bucket order, then take the middle one.
  const sorted = answered
    .map((hours) => HOURS_BUCKETS.indexOf(hours))
    .sort((a, b) => a - b);
  const median =
    sorted.length === 0 ? "" : HOURS_BUCKETS[sorted[Math.floor((sorted.length - 1) / 2)]];

  return { median, distribution };
}

/** All courses that have at least one ok row, most advice first. */
export function listCourses(): CourseSummary[] {
  const counts = new Map<string, number>();
  for (const row of getOkAdvice()) {
    counts.set(row.code, (counts.get(row.code) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([code, advice_count]) => ({
      code,
      advice_count,
      has_briefing: getBriefing(code) !== null,
    }))
    .sort((a, b) => b.advice_count - a.advice_count || a.code.localeCompare(b.code));
}

/** Full course payload, or null when the course has no ok rows. */
export function getCourseDetail(rawCode: string): CourseDetail | null {
  const rows = getCourseAdvice(rawCode);
  if (rows.length === 0) return null;

  // Newest semester first; within a semester, the latest submission first.
  const newestFirst = [...rows].sort(
    (a, b) => semesterRank(b.semester) - semesterRank(a.semester) || b.id - a.id,
  );

  const code = rows[0].code;
  return {
    code,
    advice_count: rows.length,
    hours_per_week: hoursPerWeek(rows),
    briefing: getBriefing(code),
    sources: newestFirst.map((row) => ({
      id: row.id,
      semester: row.semester,
      professor: row.professor,
      hours: row.hours,
      know_before: row.know_before,
      tip: row.tip,
      avoid: row.avoid,
    })),
    people_count: getPeopleRows(rows).length,
  };
}
