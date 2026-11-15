// Loads the advice CSV and the derived JSON files into memory, once per server
// process. There is no database: everything the API serves comes from here.

import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import {
  normalizeCode,
  normalizeHours,
  normalizeOpenTo,
  type Hours,
  type OpenTo,
} from "./normalize";

/**
 * One student's advice for one course. There is deliberately no email field:
 * the loader never reads that column, so no API response can leak it.
 */
export interface Advice {
  id: number;
  timestamp: string;
  code: string;
  semester: string;
  professor: string;
  hours: Hours | "";
  know_before: string;
  tip: string;
  avoid: string;
  first_name: string;
  major_year: string;
  open_to: OpenTo;
}

export type ModerationReason =
  | "personal_attack"
  | "academic_integrity"
  | "pii"
  | "off_topic";

export interface ModerationEntry {
  ok: boolean;
  reason?: ModerationReason;
}

export interface Point {
  point: string;
  source_ids: number[];
  professor?: string;
}

export interface Briefing {
  know_before: Point[];
  how_to_do_well: Point[];
  watch_out: Point[];
}

const DATA_DIR = path.join(process.cwd(), "data");

export function usingSampleData(): boolean {
  return process.env.USE_SAMPLE_DATA === "true";
}

/**
 * Sample data gets its own derived files, because moderation and briefings
 * are keyed by row id and sample ids mean nothing for the real CSV.
 */
export function dataFileNames() {
  const sample = usingSampleData();
  return {
    advice: sample ? "sample-advice.csv" : "advice.csv",
    moderation: sample ? "sample-moderation.json" : "moderation.json",
    briefings: sample ? "sample-briefings.json" : "briefings.json",
  };
}

export function dataPath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

/**
 * Turn CSV text into advice rows.
 * - id = position of the row in the file (first data row is 1), assigned
 *   before any row is skipped, so ids stay stable as long as rows are only
 *   appended (which is how a Google Form export grows).
 * - Rows missing a code, or missing both know_before and tip, are skipped.
 */
export function parseAdviceCsv(text: string): Advice[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];

  const columns = header.map((name) => name.trim().toLowerCase());
  const missing = ["code", "know_before", "tip"].filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new Error(`Advice CSV is missing column(s): ${missing.join(", ")}`);
  }
  if (columns.includes("email")) {
    console.warn(
      "[data] The advice CSV has an email column. It is ignored, but the file " +
        "must not be committed like this. Run `npm run prepare-data`.",
    );
  }

  // Read a cell by column name; a column that is absent reads as "".
  const cell = (row: string[], name: string) => {
    const index = columns.indexOf(name);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };

  const advice: Advice[] = [];
  rows.forEach((row, i) => {
    const code = normalizeCode(cell(row, "code"));
    const know_before = cell(row, "know_before");
    const tip = cell(row, "tip");
    if (!code || (!know_before && !tip)) return;

    advice.push({
      id: i + 1,
      timestamp: cell(row, "timestamp"),
      code,
      semester: cell(row, "semester"),
      professor: cell(row, "professor"),
      hours: normalizeHours(cell(row, "hours")),
      know_before,
      tip,
      avoid: cell(row, "avoid"),
      first_name: cell(row, "first_name"),
      major_year: cell(row, "major_year"),
      open_to: normalizeOpenTo(cell(row, "open_to")),
    });
  });
  return advice;
}

function readJsonIfExists<T>(fileName: string): T | null {
  const file = dataPath(fileName);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

interface Store {
  advice: Advice[];
  /** null = the moderation script has not been run for this dataset yet. */
  moderation: Record<string, ModerationEntry> | null;
  briefings: Record<string, Briefing>;
}

let store: Store | null = null;

function loadStore(): Store {
  if (store) return store;

  const files = dataFileNames();
  const csvFile = dataPath(files.advice);

  let advice: Advice[] = [];
  if (fs.existsSync(csvFile)) {
    advice = parseAdviceCsv(fs.readFileSync(csvFile, "utf8"));
  } else {
    console.warn(`[data] data/${files.advice} not found, serving no advice.`);
  }

  const moderation = readJsonIfExists<Record<string, ModerationEntry>>(files.moderation);
  if (!moderation) {
    console.warn(
      `[data] data/${files.moderation} not found, so every row is treated as ok. ` +
        "Run the moderation script before a real demo.",
    );
  }

  const briefings = readJsonIfExists<Record<string, Briefing>>(files.briefings) ?? {};

  store = { advice, moderation, briefings };
  return store;
}

/**
 * Advice rows that passed moderation. Once a moderation file exists, a row
 * needs an explicit ok:true entry to be shown: unreviewed rows stay hidden.
 */
export function getOkAdvice(): Advice[] {
  const { advice, moderation } = loadStore();
  if (!moderation) return advice;
  return advice.filter((row) => moderation[String(row.id)]?.ok === true);
}

export function getBriefing(code: string): Briefing | null {
  return loadStore().briefings[code] ?? null;
}
