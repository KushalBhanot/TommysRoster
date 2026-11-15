// Builds the course catalog and the instructor lists from the official USC
// Schedule of Classes (classes.usc.edu), using the same public JSON endpoints
// the site's own pages call.
//
//   npm run fetch-catalog              uses the disk cache when it has a file
//   npm run fetch-catalog -- --refresh downloads everything again
//
// It asks USC which semesters exist, then makes one request per department
// per semester (plus one per semester for the department list), waits between
// requests, and saves every response under .cache/usc-soc/. A second run only
// downloads what is new, so running it at the start of a semester adds that
// semester; --refresh also re-downloads the ones already saved.
//
// Output:
//   data/catalog.json      [{ code, title, department }]
//   data/instructors.json  { "<semester>": { "<code>": ["First Last", ...] } }
//                          a course appears under a semester only if it was
//                          actually offered then; its list is empty when the
//                          schedule names no instructor.

import fs from "node:fs";
import path from "node:path";
import { courseCode } from "../lib/catalog-code";

const BASE = "https://classes.usc.edu/api";
const USER_AGENT = "Mozilla/5.0 (compatible; course-catalog-script)";
const DELAY_MS = 500;
const CACHE_DIR = path.resolve(".cache/usc-soc");

// The oldest semester the site lists. Every fall and spring semester from
// this one up to the one in session now is fetched, so nothing here needs
// editing when a new semester starts: rerun the script and it is picked up.
const FIRST_TERM = 20243; // Fall 2024

interface UscTerm {
  termCode: number;
  season: string; // "Fall", "Spring" or "Summer"
  year: number;
}

/**
 * A semester counts once it has begun: spring in January, fall in August.
 * USC publishes the next semester's schedule months ahead for registration,
 * and nobody can have taken a class in a semester that has not started.
 */
function hasStarted(term: UscTerm, today = new Date()): boolean {
  const firstMonth = term.season === "Spring" ? 0 : 7; // January, August
  return today >= new Date(term.year, firstMonth, 1);
}

/** The semesters to fetch, newest first (the newest title wins when a course was renamed). */
async function findTerms(): Promise<{ code: number; semester: string }[]> {
  // Always asked fresh, never from the cache: this list is how new semesters are found.
  const all = await getJson<UscTerm[]>("terms.json", `${BASE}/Terms/All`, false);
  return all
    .filter((term) => term.season === "Fall" || term.season === "Spring")
    .filter((term) => term.termCode >= FIRST_TERM && hasStarted(term))
    .sort((a, b) => b.termCode - a.termCode)
    .map((term) => ({ code: term.termCode, semester: `${term.season} ${term.year}` }));
}

// Undergraduate departments across the schools. ITP was renamed TAC, so both
// are listed; a prefix that does not exist in a term is skipped for that term.
const DEPARTMENTS = [
  // Dornsife
  "WRIT", "PSYC", "BISC", "CHEM", "PHYS", "MATH", "ECON", "SOCI", "POSC", "IR",
  "SPAN", "ASTR", "AMST", "ENGL", "HIST", "PHIL", "HBIO",
  // Annenberg, Cinematic Arts, Dramatic Arts, Music, Dance, Architecture, Price
  "COMM", "JOUR", "CTCS", "THTR", "MUSC", "DANC", "ARCH", "PPD",
  // Marshall, Leventhal
  "BUAD", "ACCT", "FBE",
  // Viterbi
  "CSCI", "EE", "ITP", "TAC", "AME", "BME",
];

// Section types led by a teaching assistant rather than the course instructor.
const ASSISTANT_SECTION_TYPES = new Set(["Discussion", "Lab", "Quiz"]);
// Courses numbered 500 and above are graduate courses.
const FIRST_GRADUATE_NUMBER = 500;

interface Program {
  prefix: string;
  name: string;
  schools: { prefix: string }[] | null;
}
interface Section {
  isCancelled: boolean;
  rnrMode: string | null;
  instructors: { firstName: string | null; lastName: string | null }[] | null;
}
interface Course {
  prefix: string;
  classNumber: string;
  sequence: string | null;
  name: string;
  sections: Section[] | null;
}

const refresh = process.argv.includes("--refresh");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let requestsMade = 0;

/** GET a JSON document, from the disk cache when it is there (unless useCache is false). */
async function getJson<T>(cacheName: string, url: string, useCache = true): Promise<T> {
  const file = path.join(CACHE_DIR, cacheName);
  if (useCache && !refresh && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  }

  for (let attempt = 1; ; attempt++) {
    await sleep(DELAY_MS);
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      requestsMade++;
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, text);
      return JSON.parse(text) as T;
    } catch (error) {
      if (attempt === 3) throw new Error(`${url} failed three times: ${error}`);
      console.warn(`  retrying ${cacheName} (${error})`);
    }
  }
}

/** "Jane" + "Doe" → "Jane Doe"; null when the schedule gives no usable name. */
function instructorName(first: string | null, last: string | null): string | null {
  const name = `${first ?? ""} ${last ?? ""}`.replace(/\s+/g, " ").trim();
  return name && !/^(tba|staff)$/i.test(name) ? name : null;
}

async function main() {
  const TERMS = await findTerms();
  console.log(`Semesters: ${TERMS.map((term) => term.semester).reverse().join(", ")}\n`);

  const catalog = new Map<string, { code: string; title: string; department: string }>();
  const instructors: Record<string, Record<string, string[]>> = {};
  const sectionTypes = new Map<string, number>();

  for (const term of TERMS) {
    const programs = await getJson<Program[]>(
      `programs-${term.code}.json`,
      `${BASE}/Programs/TermCode?termCode=${term.code}`,
    );
    const byPrefix = new Map(programs.map((program) => [program.prefix, program]));
    const offered: Record<string, string[]> = {};
    const skipped: string[] = [];

    for (const prefix of DEPARTMENTS) {
      const program = byPrefix.get(prefix);
      const school = program?.schools?.[0]?.prefix;
      if (!program || !school) {
        skipped.push(prefix);
        continue;
      }

      const data = await getJson<{ courses: Course[] | null }>(
        `${term.code}-${prefix}.json`,
        `${BASE}/Courses/CoursesByTermSchoolProgram?termCode=${term.code}&school=${school}&program=${prefix}`,
      );

      for (const course of data.courses ?? []) {
        // A department's list also carries cross-listed courses that belong
        // to another department; keep only its own.
        if (course.prefix !== prefix) continue;
        if (Number.parseInt(course.classNumber, 10) >= FIRST_GRADUATE_NUMBER) continue;

        const sections = (course.sections ?? []).filter((section) => !section.isCancelled);
        if (sections.length === 0) continue; // listed but not actually offered

        const code = courseCode(course.prefix, course.classNumber, course.sequence);
        if (!catalog.has(code)) {
          catalog.set(code, { code, title: course.name.trim(), department: program.name });
        }

        const names = new Set<string>(offered[code] ?? []);
        for (const section of sections) {
          const type = section.rnrMode ?? "(none)";
          sectionTypes.set(type, (sectionTypes.get(type) ?? 0) + 1);
          if (ASSISTANT_SECTION_TYPES.has(type)) continue;
          for (const person of section.instructors ?? []) {
            const name = instructorName(person.firstName, person.lastName);
            if (name) names.add(name);
          }
        }
        offered[code] = [...names].sort();
      }
    }

    instructors[term.semester] = Object.fromEntries(
      Object.entries(offered).sort(([a], [b]) => a.localeCompare(b)),
    );
    const withNames = Object.values(offered).filter((names) => names.length > 0).length;
    console.log(
      `${term.semester}: ${Object.keys(offered).length} courses offered, ${withNames} with a named instructor` +
        (skipped.length ? `; not in this term: ${skipped.join(", ")}` : ""),
    );
  }

  const courses = [...catalog.values()].sort((a, b) => a.code.localeCompare(b.code));
  fs.writeFileSync("data/catalog.json", JSON.stringify(courses, null, 2) + "\n");
  // Oldest semester first reads more naturally in the file.
  const ordered = Object.fromEntries(TERMS.map((t) => [t.semester, instructors[t.semester]]).reverse());
  fs.writeFileSync("data/instructors.json", JSON.stringify(ordered, null, 1) + "\n");

  console.log(`\nWrote data/catalog.json: ${courses.length} courses in ${new Set(courses.map((c) => c.department)).size} departments`);
  console.log("Wrote data/instructors.json");
  console.log(`Network requests made this run: ${requestsMade}`);
  console.log(
    "Section types seen:",
    [...sectionTypes].sort((a, b) => b[1] - a[1]).map(([type, n]) => `${type} ${n}`).join(", "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
