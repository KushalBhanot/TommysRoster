// How a course in the official USC schedule becomes the code this app uses.
//
// The schedule writes a course as prefix + number + an optional sequence
// letter + optional flag letters, for example "CHEM 105aLg": sequence "a"
// (first half of a two-part course), then flags "L" (has a lab) and "g"
// (counts for general education). Students just say "CHEM 105A", so the app's
// code keeps the sequence letter and drops the flags.

/** ("CHEM", "105", "a") → "CHEM 105A"; ("WRIT", "150", null) → "WRIT 150". */
export function courseCode(prefix: string, number: string, sequence: string | null): string {
  return `${prefix.trim().toUpperCase()} ${number.trim()}${(sequence ?? "").trim().toUpperCase()}`;
}
