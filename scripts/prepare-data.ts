// Turns the raw Google Form export (which contains emails) into the CSV the
// app loads and the repo commits: data/people.csv, with no email in it.
//
//   npm run prepare-data                      reads data/private/form-export.csv
//   npm run prepare-data -- path/to/file.csv  reads another file
//
// What it does:
// - gives each person a person_id from their email (same email → same id,
//   numbered in order of first appearance, so ids do not change when new
//   responses are appended to the export)
// - drops the email and timestamp columns
// - drops rows with no email, or whose open_to answer is not a clear opt-in
// - writes data/private/person-emails.csv (person_id,email), which stays out
//   of git, so a human can forward an intro request to the right person

import fs from "node:fs";
import path from "node:path";
import { parseCsv, toCsv } from "../lib/csv";
import { parsePeopleCsv } from "../lib/data";
import { normalizeCode, normalizeOpenTo } from "../lib/normalize";

// Column order of the form, as listed in SPEC.md "Data".
const FORM_COLUMNS = [
  "timestamp", "first_name", "major", "grad_year", "email", "code",
  "semester", "professor", "can_help_with", "open_to",
];
// Columns of data/people.csv.
const OUTPUT_COLUMNS = [
  "person_id", "first_name", "major", "grad_year", "code", "semester",
  "professor", "can_help_with", "open_to",
];
const EMAIL_PATTERN = /[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/i;

const inputFile = path.resolve(process.argv[2] ?? "data/private/form-export.csv");
const outputFile = path.resolve("data/people.csv");
const emailsFile = path.resolve("data/private/person-emails.csv");

if (!fs.existsSync(inputFile)) {
  console.error(`Not found: ${inputFile}`);
  console.error("Download the form responses as CSV and save them there.");
  process.exit(1);
}

const [rawHeader, ...rows] = parseCsv(fs.readFileSync(inputFile, "utf8"));
if (!rawHeader) {
  console.error("The export is empty.");
  process.exit(1);
}

// Use the header names if they already match the spec. A Google Form export
// has the question text as headers instead, so fall back to column position,
// but only when the column count matches, and print the mapping to check.
let header = rawHeader.map((name) => name.trim().toLowerCase());
const namesMatch = FORM_COLUMNS.every((name) => header.includes(name));
if (!namesMatch) {
  if (header.length !== FORM_COLUMNS.length) {
    console.error(
      `Expected ${FORM_COLUMNS.length} columns (${FORM_COLUMNS.join(", ")}) ` +
        `but the export has ${header.length}. Fix the header row and rerun.`,
    );
    process.exit(1);
  }
  console.log("Header names differ from SPEC.md, mapping by position. Please check:");
  rawHeader.forEach((name, i) => console.log(`  ${FORM_COLUMNS[i].padEnd(14)} ← "${name}"`));
  header = [...FORM_COLUMNS];
}

const cell = (row: string[], name: string) => (row[header.indexOf(name)] ?? "").trim();

const idByEmail = new Map<string, number>();
const output: string[][] = [OUTPUT_COLUMNS];
let noEmail = 0;
let notOptedIn = 0;

rows.forEach((row, i) => {
  const email = cell(row, "email").toLowerCase();
  if (!email) {
    noEmail++;
    console.warn(`  Skipped form row ${i + 1}: no email, so this person could not be contacted.`);
    return;
  }
  // Give the id before the opt-in check, so ids never depend on who opted in.
  if (!idByEmail.has(email)) idByEmail.set(email, idByEmail.size + 1);

  if (normalizeOpenTo(cell(row, "open_to")) === "no") {
    notOptedIn++;
    console.warn(`  Skipped form row ${i + 1}: open_to is "${cell(row, "open_to")}", not an opt-in.`);
    return;
  }

  // Write the cleaned values, so the committed file matches SPEC.md exactly.
  const cleaned: Record<string, string> = {
    person_id: String(idByEmail.get(email)),
    code: normalizeCode(cell(row, "code")),
    open_to: normalizeOpenTo(cell(row, "open_to")),
  };
  output.push(OUTPUT_COLUMNS.map((name) => cleaned[name] ?? cell(row, name)));
});

fs.writeFileSync(outputFile, toCsv(output));
fs.mkdirSync(path.dirname(emailsFile), { recursive: true });
fs.writeFileSync(
  emailsFile,
  toCsv([["person_id", "email"], ...[...idByEmail].map(([email, id]) => [String(id), email])]),
);

// Report what the app will actually load, and flag emails typed into
// free-text answers (the column is gone, but someone may have written one).
const loaded = parsePeopleCsv(fs.readFileSync(outputFile, "utf8"));
const people = new Set(loaded.map((row) => row.person_id)).size;
const courses = new Set(loaded.map((row) => row.code)).size;
console.log(`Wrote ${path.relative(process.cwd(), outputFile)}`);
console.log(
  `  ${rows.length} form rows → ${loaded.length} usable rows ` +
    `(${people} people, ${courses} courses); skipped ${noEmail} with no email, ` +
    `${notOptedIn} not opted in, ${output.length - 1 - loaded.length} missing a name or course code`,
);
console.log(`Wrote ${path.relative(process.cwd(), emailsFile)} (private, gitignored)`);

output.slice(1).forEach((row) => {
  if (row.some((value) => EMAIL_PATTERN.test(value))) {
    console.warn(
      `  WARNING: an answer of person_id ${row[0]} (${row[4]}) contains an email address. Remove it by hand.`,
    );
  }
});
