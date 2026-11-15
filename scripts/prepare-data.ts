// Turns the raw Google Form export (which contains emails) into the CSV the
// app loads and the repo commits: same rows, same order, email column removed.
//
//   npm run prepare-data                      reads data/private/form-export.csv
//   npm run prepare-data -- path/to/file.csv  reads another file
//
// Row order is kept exactly, so advice id N is still row N of the raw export.
// That is how an intro request can later be matched to an email by a human.

import fs from "node:fs";
import path from "node:path";
import { parseCsv, toCsv } from "../lib/csv";
import { parseAdviceCsv } from "../lib/data";

// Column order of the form, as listed in SPEC.md "Data".
const FORM_COLUMNS = [
  "timestamp", "code", "semester", "professor", "hours", "know_before",
  "tip", "avoid", "first_name", "major_year", "email", "open_to",
];
const EMAIL_PATTERN = /[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/i;

const inputFile = path.resolve(process.argv[2] ?? "data/private/form-export.csv");
const outputFile = path.resolve("data/advice.csv");

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
  rawHeader.forEach((name, i) => console.log(`  ${FORM_COLUMNS[i].padEnd(12)} ← "${name}"`));
  header = [...FORM_COLUMNS];
}

// Drop the email column from the header and from every row.
const emailIndex = header.indexOf("email");
const withoutEmail = (row: string[]) => row.filter((_, i) => i !== emailIndex);
const output = [withoutEmail(header), ...rows.map(withoutEmail)];

fs.writeFileSync(outputFile, toCsv(output));

// Report what the app will actually load, and flag emails typed into
// free-text answers (the column is gone, but a student may have written one).
const loaded = parseAdviceCsv(fs.readFileSync(outputFile, "utf8"));
console.log(`Wrote ${path.relative(process.cwd(), outputFile)}`);
console.log(`  ${rows.length} form rows, ${loaded.length} usable, ${rows.length - loaded.length} skipped`);

output.slice(1).forEach((row, i) => {
  if (row.some((value) => EMAIL_PATTERN.test(value))) {
    console.warn(`  WARNING: row id ${i + 1} has an email address inside an answer. Remove it by hand.`);
  }
});
