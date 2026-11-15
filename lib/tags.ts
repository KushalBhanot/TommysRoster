// The fixed lists people choose from, so nothing about a person is free text
// that would need moderating. The same lists are used by the sign-up form, the
// demo data generator, and the matcher.

/** What a person can talk about for a course they took. */
export const HELP_TAGS = [
  "Workload and time management",
  "Exams and how to study",
  "Choosing a professor or section",
  "Taking it with no background",
] as const;

/** Optional things a person says about themselves. */
export const ABOUT_TAGS = [
  "Transfer student",
  "International student",
  "First-generation student",
  "Switched majors",
  "Pre-med or pre-law",
] as const;

export type HelpTag = (typeof HELP_TAGS)[number];
export type AboutTag = (typeof ABOUT_TAGS)[number];
