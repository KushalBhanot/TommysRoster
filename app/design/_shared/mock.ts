// Fixed content for the five design previews. Nothing here calls the API:
// every variant shows the same question, the same three matches and the same
// roster, so the only thing that differs between them is the design.
//
// The three people are rows from data/demo-people.csv (fictional students,
// real course and instructor data).

export interface MockMatch {
  first_name: string;
  major: string;
  grad_year: string;
  code: string;
  title: string;
  semester: string;
  professor: string;
  help_tags: string[];
  about_tags: string[];
  note: string;
  /** The AI's one-sentence reason: the most prominent line on a match. */
  reason: string;
}

export const EXAMPLES = [
  "I've never coded before. Is CSCI 103 doable?",
  "How do I keep up with the workload in CHEM 105A?",
  "Which WRIT 150 section should I pick?",
];

export const MATCHES: MockMatch[] = [
  {
    first_name: "Diego",
    major: "Computer Science",
    grad_year: "2028",
    code: "CSCI 103",
    title: "Object Oriented Programming",
    semester: "Fall 2024",
    professor: "Carter Slocum",
    help_tags: ["Taking it with no background", "Workload and time management"],
    about_tags: ["First-generation student"],
    note: "I started with no coding experience and can tell you how I caught up.",
    reason: "They started CSCI 103 with no coding experience and offered to talk about taking it with no background.",
  },
  {
    first_name: "Kai",
    major: "Computer Science",
    grad_year: "2030",
    code: "CSCI 103",
    title: "Object Oriented Programming",
    semester: "Fall 2026",
    professor: "Andrew Goodney",
    help_tags: ["Taking it with no background", "Workload and time management"],
    about_tags: [],
    note: "I'm in it right now as a first-year and can tell you honestly how the first few months have gone.",
    reason: "They are in CSCI 103 right now as a first-year, so they can tell you how the first months really go.",
  },
  {
    first_name: "Arjun",
    major: "Computer Science",
    grad_year: "2029",
    code: "CSCI 103",
    title: "Object Oriented Programming",
    semester: "Fall 2025",
    professor: "Andrew Goodney",
    help_tags: ["Workload and time management"],
    about_tags: ["International student"],
    note: "I had coded a little before, and I can tell you where that helped and where it didn't.",
    reason: "They had only coded a little before the class and can say where that helped and where it didn't.",
  },
];

/** A slice of the roster, in order, for designs that show the search happening. */
export const ROSTER = [
  { first_name: "Maya", major: "Business Administration", grad_year: "2028" },
  { first_name: "Diego", major: "Computer Science", grad_year: "2028" },
  { first_name: "Priya", major: "Biological Sciences", grad_year: "2028" },
  { first_name: "Kai", major: "Computer Science", grad_year: "2030" },
  { first_name: "Sofia", major: "Communication", grad_year: "2028" },
  { first_name: "Arjun", major: "Computer Science", grad_year: "2029" },
  { first_name: "Hana", major: "Neuroscience", grad_year: "2029" },
];

export const VARIANTS = [
  {
    id: 1,
    name: "Roster Board",
    summary: "A team roster you watch being scanned: a gold bar moves down the rows and the three matches light up and open.",
  },
  {
    id: 2,
    name: "Trojan Card",
    summary: "Each match is dealt onto the table as a campus ID card, with the AI's reason printed where the photo caption would be.",
  },
  {
    id: 3,
    name: "The Feature",
    summary: "A magazine page: one huge serif headline, a single ruled line to write on, and matches set as numbered pull quotes.",
  },
  {
    id: 4,
    name: "Ask Around",
    summary: "A conversation: your question is a chat bubble, and each match arrives as a reply introducing a person.",
  },
  {
    id: 5,
    name: "Cardinal",
    summary: "A full-bleed cardinal poster that shrinks to a bar once you ask, with white match cards rising over its edge.",
  },
];
