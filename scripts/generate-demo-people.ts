// Writes data/demo-people.csv: the fictional students used for the demo.
//
//   npm run generate-demo
//
// The people below are invented (first names only, no real individuals). What
// is NOT invented is everything they are attached to:
// - every course code is in data/catalog.json,
// - every course was offered in the semester it is listed under,
// - every professor is an instructor the official schedule lists for that
//   course in that exact semester (picked here, never typed by hand),
// - every major is in data/majors.json (USC Catalogue list of bachelor's degrees).
// The script checks all of this and refuses to write the file if anything fails.

import fs from "node:fs";
import { toCsv } from "../lib/csv";
import { ABOUT_TAGS, HELP_TAGS, SEMESTERS, type AboutTag, type HelpTag, type Semester } from "../lib/tags";

// Short names for the four help tags, to keep the list below readable.
const [WORKLOAD, EXAMS, CHOOSING, NO_BACKGROUND] = HELP_TAGS;
const [TRANSFER, INTERNATIONAL, FIRST_GEN, SWITCHED, PRE_PROF] = ABOUT_TAGS;

interface CourseTaken {
  code: string;
  semester: Semester;
  help: HelpTag[];
  /** One sentence of personal experience. No claims about the course, no opinions on a professor. */
  note?: string;
}

interface DemoPerson {
  name: string;
  major: string;
  grad: number;
  about: AboutTag[];
  /** First semester at USC. Left out = the fall four years before graduating. */
  entry?: Semester;
  courses: CourseTaken[];
}

const took = (code: string, semester: Semester, help: HelpTag[], note?: string): CourseTaken => ({
  code,
  semester,
  help,
  note,
});

const PEOPLE: DemoPerson[] = [
  {
    name: "Maya", major: "Business Administration", grad: 2028, about: [],
    courses: [
      took("WRIT 150", "Fall 2024", [WORKLOAD, CHOOSING], "I rewrote a lot that semester and can tell you how I learned to start earlier."),
      took("BUAD 304", "Fall 2025", [WORKLOAD]),
    ],
  },
  {
    name: "Diego", major: "Computer Science", grad: 2028, about: [FIRST_GEN],
    courses: [
      took("CSCI 103", "Fall 2024", [NO_BACKGROUND, WORKLOAD], "I started with no coding experience and can tell you how I caught up."),
      took("CSCI 104", "Spring 2025", [WORKLOAD, EXAMS]),
    ],
  },
  {
    name: "Priya", major: "Biological Sciences", grad: 2028, about: [PRE_PROF],
    courses: [
      took("BISC 120", "Fall 2024", [EXAMS, WORKLOAD], "I took this and chemistry in the same semester and can talk about keeping both afloat."),
      took("CHEM 105A", "Fall 2024", [EXAMS]),
      took("CHEM 322A", "Fall 2025", [EXAMS, WORKLOAD], "I was nervous about this one for a whole year beforehand, and I'm happy to tell you how it actually went for me."),
    ],
  },
  {
    name: "Ethan", major: "Economics", grad: 2027, about: [SWITCHED],
    courses: [
      took("ECON 203", "Fall 2024", [NO_BACKGROUND, EXAMS], "I took this as a sophomore before switching into economics, and can talk about how I made that decision."),
      took("ACCT 410", "Fall 2025", [NO_BACKGROUND]),
      took("WRIT 340", "Spring 2026", [WORKLOAD, CHOOSING]),
    ],
  },
  {
    name: "Aaliyah", major: "Psychology", grad: 2029, about: [],
    courses: [
      took("PSYC 100", "Fall 2025", [EXAMS, WORKLOAD], "It was one of my first college classes, so I can tell you what that first month felt like."),
      took("WRIT 150", "Spring 2026", [CHOOSING]),
    ],
  },
  {
    name: "Wei", major: "Electrical and Computer Engineering", grad: 2028, about: [INTERNATIONAL],
    courses: [
      took("PHYS 151", "Fall 2024", [EXAMS, WORKLOAD], "I learned physics in another language first, and can share how I got used to the English vocabulary."),
      took("EE 109", "Spring 2025", [NO_BACKGROUND, WORKLOAD]),
    ],
  },
  {
    name: "Sofia", major: "Communication", grad: 2028, about: [],
    courses: [
      took("COMM 204", "Fall 2024", [NO_BACKGROUND, CHOOSING], "I was terrified of speaking in front of people going in, and I'm happy to share how I got past that."),
      took("JOUR 200", "Spring 2025", [WORKLOAD]),
    ],
  },
  {
    name: "Jordan", major: "Business Administration", grad: 2027, about: [TRANSFER], entry: "Fall 2025",
    courses: [
      took("BUAD 307", "Fall 2025", [WORKLOAD, CHOOSING], "This was my first semester at USC after transferring, and I can tell you what that adjustment was like."),
      took("ECON 351", "Fall 2025", [EXAMS]),
    ],
  },
  {
    name: "Hana", major: "Neuroscience", grad: 2029, about: [PRE_PROF],
    courses: [
      took("BISC 120", "Fall 2025", [EXAMS, WORKLOAD]),
      took("CHEM 105A", "Fall 2025", [EXAMS, NO_BACKGROUND], "My high school chemistry was thin, and I can tell you how I filled in the gaps as I went."),
      took("PSYC 100", "Spring 2026", [WORKLOAD]),
    ],
  },
  {
    name: "Mateo", major: "Mechanical Engineering", grad: 2028, about: [],
    courses: [
      took("MATH 226", "Spring 2025", [EXAMS]),
      took("AME 201", "Fall 2025", [WORKLOAD, EXAMS], "I studied with the same three friends all semester and can tell you how we set that up."),
    ],
  },
  {
    name: "Chloe", major: "Journalism", grad: 2029, about: [],
    courses: [
      took("JOUR 200", "Fall 2025", [NO_BACKGROUND, WORKLOAD]),
      took("WRIT 150", "Fall 2025", [CHOOSING, WORKLOAD], "I thought I was already a strong writer coming in, and I can tell you what changed my mind."),
    ],
  },
  {
    name: "Omar", major: "Computer Science/Business Administration", grad: 2028, about: [],
    courses: [
      took("CSCI 170", "Spring 2025", [EXAMS, WORKLOAD], "Proof-style thinking did not come naturally to me, and I can share what finally made it click."),
      took("CSCI 104", "Fall 2025", [WORKLOAD]),
      took("BUAD 280", "Fall 2025", [NO_BACKGROUND]),
    ],
  },
  {
    name: "Isabella", major: "Cinema and Media Studies", grad: 2028, about: [],
    courses: [
      took("CTCS 190", "Fall 2024", [NO_BACKGROUND, WORKLOAD]),
      took("THTR 101", "Spring 2025", [NO_BACKGROUND], "I had never acted before and can tell you what it was like to walk in as a complete beginner."),
    ],
  },
  {
    name: "Noah", major: "Physics", grad: 2028, about: [],
    courses: [
      took("PHYS 151", "Fall 2024", [EXAMS]),
      took("MATH 226", "Fall 2025", [EXAMS, CHOOSING], "I took it a full year after my last math class and can talk about shaking off the rust."),
    ],
  },
  {
    name: "Zara", major: "International Relations", grad: 2028, about: [INTERNATIONAL],
    courses: [
      took("IR 210", "Fall 2024", [WORKLOAD, NO_BACKGROUND], "I grew up outside the United States and can talk about finding my voice in class as an international student."),
      took("SPAN 150", "Spring 2025", [CHOOSING, NO_BACKGROUND]),
    ],
  },
  {
    name: "Lucas", major: "Accounting and Finance", grad: 2027, about: [],
    courses: [
      took("BUAD 280", "Fall 2024", [EXAMS, NO_BACKGROUND]),
      took("BUAD 304", "Spring 2025", [WORKLOAD, CHOOSING]),
      took("FBE 421", "Fall 2025", [EXAMS, WORKLOAD], "I took this during recruiting season and can talk about balancing interviews with school."),
    ],
  },
  {
    name: "Amara", major: "Sociology", grad: 2029, about: [FIRST_GEN],
    courses: [
      took("SOCI 200", "Fall 2025", [NO_BACKGROUND, WORKLOAD], "I'm the first in my family to go to college, and I can talk about learning how to ask for help early."),
      took("PSYC 100", "Fall 2025", [EXAMS]),
    ],
  },
  {
    name: "Kenji", major: "Computer Engineering and Computer Science", grad: 2029, about: [INTERNATIONAL],
    courses: [
      took("CSCI 103", "Fall 2025", [NO_BACKGROUND, EXAMS]),
      took("EE 109", "Spring 2026", [WORKLOAD], "I had never touched hardware before this and can tell you how I got comfortable with it."),
    ],
  },
  {
    name: "Elena", major: "Political Science", grad: 2028, about: [PRE_PROF],
    courses: [
      took("POSC 130", "Fall 2024", [WORKLOAD, NO_BACKGROUND]),
      took("IR 210", "Spring 2025", [WORKLOAD], "I'm planning on law school and can talk about why I picked these classes with that in mind."),
    ],
  },
  {
    name: "Marcus", major: "Real Estate Development", grad: 2029, about: [],
    courses: [
      took("MATH 118", "Fall 2025", [EXAMS, CHOOSING], "Math was never my subject in high school, and I can share what helped me keep up."),
      took("ECON 351", "Spring 2026", [EXAMS, WORKLOAD]),
    ],
  },
  {
    name: "Nia", major: "Human Biology", grad: 2028, about: [PRE_PROF],
    courses: [
      took("CHEM 105A", "Fall 2024", [EXAMS, CHOOSING]),
      took("BISC 220", "Spring 2025", [EXAMS, WORKLOAD], "I was juggling this with volunteering at a clinic and can talk about how I protected my study time."),
      took("PHYS 135A", "Fall 2025", [NO_BACKGROUND, EXAMS]),
    ],
  },
  {
    name: "Arjun", major: "Computer Science", grad: 2029, about: [INTERNATIONAL],
    courses: [
      took("CSCI 103", "Fall 2025", [WORKLOAD], "I had coded a little before, and I can tell you where that helped and where it didn't."),
      took("CSCI 170", "Spring 2026", [EXAMS]),
    ],
  },
  {
    name: "Camila", major: "Anthropology", grad: 2028, about: [],
    courses: [
      took("SPAN 150", "Fall 2024", [NO_BACKGROUND, WORKLOAD], "I grew up hearing Spanish at home but never studied it formally, and I can talk about what that was like in a classroom."),
      took("ASTR 100", "Spring 2025", [NO_BACKGROUND]),
    ],
  },
  {
    name: "Tyler", major: "Aerospace Engineering", grad: 2029, about: [],
    courses: [
      took("MATH 125", "Fall 2025", [EXAMS, CHOOSING]),
      took("PHYS 151", "Spring 2026", [EXAMS, WORKLOAD]),
      took("AME 201", "Fall 2026", [WORKLOAD], "I'm taking it right now alongside a heavy schedule and can tell you how I'm managing week to week."),
    ],
  },
  {
    name: "Leila", major: "Public Policy", grad: 2028, about: [],
    courses: [
      took("PPD 245", "Fall 2024", [NO_BACKGROUND, WORKLOAD], "I came in undecided and this class is part of why I chose my major, which I'm happy to talk about."),
      took("POSC 130", "Spring 2025", [WORKLOAD]),
    ],
  },
  {
    name: "Daniel", major: "Mathematics", grad: 2028, about: [],
    courses: [
      took("MATH 125", "Fall 2024", [EXAMS, CHOOSING]),
      took("MATH 226", "Fall 2025", [EXAMS, WORKLOAD], "I tutor other students in math now and can share the study habits I wish I'd started with."),
    ],
  },
  {
    name: "Grace", major: "Biomedical Engineering", grad: 2029, about: [],
    courses: [
      took("BME 101", "Fall 2025", [NO_BACKGROUND], "I wasn't sure engineering was for me when I started, and I can talk about how I figured that out."),
      took("CHEM 105A", "Fall 2025", [EXAMS, WORKLOAD]),
    ],
  },
  {
    name: "Andre", major: "Theatre", grad: 2028, about: [FIRST_GEN],
    courses: [
      took("THTR 101", "Fall 2024", [NO_BACKGROUND, CHOOSING]),
      took("MUSC 200", "Fall 2025", [WORKLOAD], "I took it purely out of curiosity and can tell you what it's like as someone outside the music school."),
    ],
  },
  {
    name: "Mei", major: "Business Administration", grad: 2028, about: [INTERNATIONAL],
    courses: [
      took("BUAD 304", "Fall 2025", [WORKLOAD, CHOOSING], "English is my second language, and I can share how I got comfortable speaking up."),
      took("BUAD 307", "Spring 2026", [WORKLOAD]),
    ],
  },
  {
    name: "Samuel", major: "Economics", grad: 2028, about: [],
    courses: [
      took("ECON 203", "Spring 2025", [EXAMS, NO_BACKGROUND]),
      took("ACCT 410", "Fall 2025", [NO_BACKGROUND, WORKLOAD], "I had no accounting background at all and can tell you how I got my footing."),
    ],
  },
  {
    name: "Fatima", major: "Biochemistry", grad: 2027, about: [PRE_PROF],
    courses: [
      took("CHEM 322A", "Fall 2024", [EXAMS, WORKLOAD], "I was thinking about the MCAT the whole time I took this and can talk about how the two fit together for me."),
      took("BISC 220", "Spring 2025", [EXAMS]),
      took("WRIT 340", "Fall 2025", [WORKLOAD, CHOOSING]),
    ],
  },
  {
    name: "Gabriel", major: "Astronomy", grad: 2030, about: [],
    courses: [
      took("ASTR 100", "Fall 2026", [NO_BACKGROUND, WORKLOAD], "I'm a first-year taking it this semester and can tell you what it's like so far."),
      took("PHYS 151", "Fall 2026", [WORKLOAD]),
    ],
  },
  {
    name: "Naomi", major: "Public Relations and Advertising", grad: 2029, about: [],
    courses: [
      took("COMM 204", "Fall 2025", [NO_BACKGROUND, WORKLOAD]),
      took("JOUR 200", "Spring 2026", [WORKLOAD, CHOOSING], "I came from a tiny high school and can talk about finding my people in a new place."),
    ],
  },
  {
    name: "Kai", major: "Computer Science", grad: 2030, about: [],
    courses: [
      took("CSCI 103", "Fall 2026", [NO_BACKGROUND, WORKLOAD], "I'm in it right now as a first-year and can tell you honestly how the first few months have gone."),
      took("MATH 125", "Fall 2026", [EXAMS]),
    ],
  },
  {
    name: "Valentina", major: "Psychology", grad: 2027, about: [TRANSFER, FIRST_GEN], entry: "Fall 2025",
    courses: [
      took("WRIT 340", "Fall 2025", [WORKLOAD, CHOOSING], "I transferred from a community college and can talk about how different the writing expectations felt to me."),
      took("SOCI 200", "Spring 2026", [NO_BACKGROUND]),
    ],
  },
  {
    name: "Ryan", major: "Artificial Intelligence for Business", grad: 2030, about: [],
    courses: [
      took("MATH 118", "Fall 2026", [EXAMS, WORKLOAD]),
      took("WRIT 150", "Fall 2026", [CHOOSING, NO_BACKGROUND], "I'm taking it this semester and can share how I picked my section."),
    ],
  },
  {
    name: "Anika", major: "Data Science", grad: 2028, about: [SWITCHED],
    courses: [
      took("MATH 125", "Fall 2024", [EXAMS]),
      took("TAC 115", "Fall 2025", [NO_BACKGROUND, WORKLOAD], "I switched majors after learning to code here, and I can talk about what pushed me to do it."),
    ],
  },
  {
    name: "Julian", major: "Music Industry", grad: 2028, about: [],
    courses: [
      took("MUSC 200", "Fall 2024", [WORKLOAD]),
      took("CTCS 190", "Fall 2025", [NO_BACKGROUND], "I'm not a film student and took it for fun, so I can tell you what it's like from the outside."),
    ],
  },
  {
    name: "Yuna", major: "Cognitive Science", grad: 2029, about: [INTERNATIONAL],
    courses: [
      took("PSYC 100", "Fall 2025", [EXAMS, NO_BACKGROUND], "I moved to Los Angeles for college and can talk about settling in while keeping up with class."),
      took("TAC 115", "Spring 2026", [NO_BACKGROUND]),
    ],
  },
  {
    name: "Malik", major: "Urban Studies and Planning", grad: 2028, about: [TRANSFER], entry: "Fall 2025",
    courses: [
      took("PPD 245", "Fall 2025", [WORKLOAD, NO_BACKGROUND], "I transferred in as a sophomore and can share how I got oriented in a new department."),
      took("SOCI 200", "Fall 2025", [WORKLOAD]),
    ],
  },
  {
    name: "Sara", major: "Biomedical Engineering", grad: 2028, about: [SWITCHED],
    courses: [
      took("BME 101", "Spring 2025", [NO_BACKGROUND, WORKLOAD], "I switched into engineering from another major and can tell you what catching up looked like for me."),
      took("BISC 220", "Spring 2026", [EXAMS, WORKLOAD]),
    ],
  },
  {
    name: "Ian", major: "Accounting", grad: 2028, about: [],
    courses: [
      took("ECON 351", "Fall 2024", [EXAMS, CHOOSING]),
      took("BUAD 280", "Spring 2025", [EXAMS, WORKLOAD], "I walked in thinking accounting would be dry, and I can tell you why I ended up majoring in it."),
    ],
  },
  {
    name: "Lin", major: "Business Administration", grad: 2027, about: [INTERNATIONAL],
    courses: [
      took("BUAD 307", "Fall 2024", [WORKLOAD, CHOOSING]),
      took("FBE 421", "Fall 2025", [EXAMS], "I took it the same semester I was interviewing for internships and can talk about staying on top of both."),
      took("WRIT 340", "Spring 2026", [WORKLOAD], "Writing in English is still hard for me, and I can share the routine that got me through it."),
    ],
  },
  {
    name: "Rosa", major: "Health Promotion and Disease Prevention Studies", grad: 2029, about: [FIRST_GEN, PRE_PROF],
    courses: [
      took("BISC 120", "Fall 2025", [EXAMS, NO_BACKGROUND], "No one in my family had taken a college science class, and I can talk about finding study partners from scratch."),
      took("PHYS 135A", "Fall 2026", [WORKLOAD]),
    ],
  },
  {
    name: "Theo", major: "Philosophy, Politics and Law", grad: 2028, about: [PRE_PROF],
    courses: [
      took("POSC 130", "Fall 2025", [WORKLOAD]),
      took("IR 210", "Spring 2026", [WORKLOAD, NO_BACKGROUND], "I'm aiming for law school and took this to test whether I liked the subject, which I'm happy to talk about."),
    ],
  },
];

// The "Exams and how to study" tag is only used on courses where exams are a
// safe assumption (math, science, economics, accounting). Writing, performance
// and discussion courses never get it, so no row claims an exam that may not exist.
const EXAM_TAG_COURSES = new Set([
  "BISC 120", "BISC 220", "CHEM 105A", "CHEM 322A", "PHYS 151", "PHYS 135A",
  "MATH 125", "MATH 118", "MATH 226", "ECON 203", "ECON 351", "PSYC 100",
  "CSCI 103", "CSCI 104", "CSCI 170", "BUAD 280", "FBE 421", "AME 201",
]);

// Words a note may not contain: they would be a checkable claim about how the
// course runs, or a comment on whoever taught it.
const NOTE_BANNED =
  /\b(exams?|midterms?|finals?|quiz(zes)?|projects?|grad(e|es|ed|ing)|curved?|professors?|prof|instructors?|teachers?|homework|assignments?|essays?|labs?|lectures?|papers?|syllabus)\b|\d/i;

interface CatalogCourse {
  code: string;
  title: string;
  department: string;
}

function main() {
  const catalog: CatalogCourse[] = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
  const instructors: Record<string, Record<string, string[]>> = JSON.parse(
    fs.readFileSync("data/instructors.json", "utf8"),
  );
  const majors = new Set<string>(JSON.parse(fs.readFileSync("data/majors.json", "utf8")));
  const courseByCode = new Map(catalog.map((course) => [course.code, course]));

  const problems: string[] = [];
  const header = [
    "person_id", "first_name", "major", "grad_year", "code", "semester",
    "professor", "help_tags", "about_tags", "note", "source",
  ];
  const rows: string[][] = [];
  // Instructors already given out for a course in a semester, so the next
  // person who took it then gets a different one when there are several.
  const used = new Map<string, Set<string>>();

  const names = PEOPLE.map((person) => person.name);
  for (const name of names) {
    if (names.filter((n) => n === name).length > 1) problems.push(`${name}: first name used twice`);
  }

  PEOPLE.forEach((person, index) => {
    const who = person.name;
    if (!majors.has(person.major)) problems.push(`${who}: "${person.major}" is not in data/majors.json`);
    if (person.grad < 2027 || person.grad > 2030) problems.push(`${who}: grad year ${person.grad} out of range`);
    if (person.about.length > 2) problems.push(`${who}: more than two about tags`);
    if (person.about.some((tag) => !ABOUT_TAGS.includes(tag))) problems.push(`${who}: unknown about tag`);

    // The earliest semester this person could have taken a class at USC.
    const entry = person.entry ?? `Fall ${person.grad - 4}`;
    const firstAllowed = SEMESTERS.indexOf(entry as Semester); // -1 = before our first semester
    if (person.entry && !person.about.includes(TRANSFER) ) {
      problems.push(`${who}: has a late entry semester but is not marked as a transfer student`);
    }

    for (const course of person.courses) {
      const where = `${who} / ${course.code} / ${course.semester}`;
      if (!courseByCode.has(course.code)) problems.push(`${where}: course is not in the catalog`);
      if (SEMESTERS.indexOf(course.semester) < firstAllowed) {
        problems.push(`${where}: before this person arrived at USC (${entry})`);
      }

      const listed = instructors[course.semester]?.[course.code];
      if (!listed) {
        problems.push(`${where}: course was not offered that semester`);
        continue;
      }
      if (listed.length === 0) {
        problems.push(`${where}: the schedule names no instructor that semester`);
        continue;
      }

      if (course.help.length < 1 || course.help.length > 3) problems.push(`${where}: needs 1 to 3 help tags`);
      if (course.help.some((tag) => !HELP_TAGS.includes(tag))) problems.push(`${where}: unknown help tag`);
      if (course.help.includes(EXAMS) && !EXAM_TAG_COURSES.has(course.code)) {
        problems.push(`${where}: the exams tag is not allowed on this course`);
      }
      if (course.help.includes(CHOOSING) && listed.length < 2) {
        problems.push(`${where}: "choosing a professor" needs at least two instructors that semester`);
      }
      if (course.note && NOTE_BANNED.test(course.note)) problems.push(`${where}: note uses a banned word or a number`);
      if (course.note && (course.note.match(/[.!?]/g) ?? []).length !== 1) {
        problems.push(`${where}: note must be exactly one sentence`);
      }

      // Pick an instructor: start from a position that depends on the person,
      // then take the first one not yet used for this course and semester.
      const key = `${course.code}|${course.semester}`;
      const taken = used.get(key) ?? new Set<string>();
      const start = (index * 7 + course.code.length) % listed.length;
      const rotated = [...listed.slice(start), ...listed.slice(0, start)];
      const professor = rotated.find((name) => !taken.has(name)) ?? rotated[0];
      taken.add(professor);
      used.set(key, taken);

      rows.push([
        String(index + 1),
        person.name,
        person.major,
        String(person.grad),
        course.code,
        course.semester,
        professor,
        course.help.join(";"),
        person.about.join(";"),
        course.note ?? "",
        "demo",
      ]);
    }
  });

  if (problems.length > 0) {
    console.error(`Not writing the file. ${problems.length} problem(s):`);
    for (const problem of problems) console.error("  - " + problem);
    process.exit(1);
  }

  fs.writeFileSync("data/demo-people.csv", toCsv([header, ...rows]));

  // ---- report ----
  const col = (name: string) => header.indexOf(name);
  const peoplePerCourse = new Map<string, number>();
  for (const row of rows) peoplePerCourse.set(row[col("code")], (peoplePerCourse.get(row[col("code")]) ?? 0) + 1);
  const departments = new Set([...peoplePerCourse.keys()].map((code) => courseByCode.get(code)!.department));
  const professors = new Set(rows.map((row) => row[col("professor")]));
  const counts = [...peoplePerCourse.values()];

  console.log("Ten sample rows (every tenth row):\n");
  for (let i = 0; i < rows.length && i < 100; i += 10) {
    const r = rows[i];
    console.log(
      `#${r[0]} ${r[1]}, ${r[2]}, ${r[3]} | ${r[4]} "${courseByCode.get(r[4])!.title}" | ${r[5]} | ${r[6]}\n` +
        `    help: ${r[7]}${r[8] ? `\n    about: ${r[8]}` : ""}${r[9] ? `\n    note: ${r[9]}` : ""}`,
    );
  }

  console.log("\nSummary");
  console.log(`  people:               ${PEOPLE.length}`);
  console.log(`  rows:                 ${rows.length}`);
  console.log(`  rows with a note:     ${rows.filter((row) => row[col("note")]).length}`);
  console.log(`  courses:              ${peoplePerCourse.size}`);
  console.log(`  departments covered:  ${departments.size}`);
  console.log(`  distinct instructors: ${professors.size}`);
  console.log(`  people per course:    min ${Math.min(...counts)}, max ${Math.max(...counts)}`);
  console.log(`  courses per person:   ${[1, 2, 3].map((n) => `${PEOPLE.filter((p) => p.courses.length === n).length} with ${n}`).join(", ")}`);
  console.log(`  grad years:           ${[2027, 2028, 2029, 2030].map((y) => `${y}: ${PEOPLE.filter((p) => p.grad === y).length}`).join(", ")}`);
  console.log(`  departments:          ${[...departments].sort().join(", ")}`);
}

main();
