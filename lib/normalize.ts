// Cleaning rules for raw form answers. Used by the data loader now and by
// POST /api/advice later, so both paths normalize the same way.

export const HOURS_BUCKETS = ["0-3", "4-6", "7-10", "11-15", "15+"] as const;
export type Hours = (typeof HOURS_BUCKETS)[number];
export type OpenTo = "no" | "questions" | "questions+coffee";

/**
 * "writ150", " Writ-150 ", "WRIT 150" → "WRIT 150".
 * Uppercase, punctuation/spaces removed, then one space between the letters
 * and the number part. Returns "" when nothing usable is left.
 */
export function normalizeCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]+)(\d+[A-Z]*)$/);
  return match ? `${match[1]} ${match[2]}` : compact;
}

/**
 * Map an hours answer to one of the five buckets, tolerating en dashes,
 * spaces and a trailing "hours". Returns "" when it is not a known bucket,
 * so a bad value can never be counted in the distribution.
 */
export function normalizeHours(raw: string): Hours | "" {
  const cleaned = raw
    .toLowerCase()
    .replace(/[‒-―]/g, "-") // en/em dashes → hyphen
    .replace(/hours?|hrs?|\s/g, "");
  return (HOURS_BUCKETS as readonly string[]).includes(cleaned)
    ? (cleaned as Hours)
    : "";
}

/**
 * Map the form's wording to the three allowed values. Anything unclear
 * becomes "no": we never list a person who did not clearly opt in.
 */
export function normalizeOpenTo(raw: string): OpenTo {
  const answer = raw.trim().toLowerCase();
  if (answer === "" || answer.startsWith("no")) return "no";
  if (answer.includes("coffee")) return "questions+coffee";
  if (answer.includes("question") || answer.startsWith("yes")) return "questions";
  return "no";
}

/**
 * Sortable number for a semester string: "Fall 2025" → 20253,
 * "Spring 2026" → 20261. Unparseable text → 0 (sorts as oldest).
 */
export function semesterRank(semester: string): number {
  const text = semester.toLowerCase();
  const yearMatch = text.match(/\b(20\d{2})\b/) ?? text.match(/(\d{2})\b/);
  if (!yearMatch) return 0;
  const year =
    yearMatch[1].length === 4 ? Number(yearMatch[1]) : 2000 + Number(yearMatch[1]);
  const term = text.includes("spring") || text.startsWith("sp")
    ? 1
    : text.includes("summer") || text.startsWith("su")
      ? 2
      : text.includes("fall") || text.startsWith("fa")
        ? 3
        : 0;
  return year * 10 + term;
}
