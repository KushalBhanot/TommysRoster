// Small helpers for cleaning what people type: course codes and semesters.

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
