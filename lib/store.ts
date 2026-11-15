// Keeps records that arrive while the server is running: intro requests and
// new sign-ups. Both contain emails, so they are written under data/private/
// (gitignored) and never served by any API route.
//
// Saving to disk is best effort. Some hosts (Vercel included) have a
// read-only or temporary disk, so every record is also kept in memory.

import fs from "node:fs";
import path from "node:path";

const PRIVATE_DIR = path.join(process.cwd(), "data", "private");

// On globalThis so every API route shares one copy (see lib/data.ts).
const shared = globalThis as typeof globalThis & { __records?: Map<string, unknown[]> };
const inMemory = (shared.__records ??= new Map<string, unknown[]>());

/** Add one record to data/private/<fileName> (a JSON array) and to memory. */
export function saveRecord(fileName: string, record: Record<string, unknown>): void {
  if (!inMemory.has(fileName)) inMemory.set(fileName, []);
  inMemory.get(fileName)!.push(record);

  try {
    fs.mkdirSync(PRIVATE_DIR, { recursive: true });
    const file = path.join(PRIVATE_DIR, fileName);
    const existing: unknown[] = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : [];
    existing.push(record);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2) + "\n");
  } catch (error) {
    // Do not fail the request, and do not log the record: it holds an email.
    console.warn(
      `[store] could not write data/private/${fileName}, kept in memory only:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Remove every record in data/private/<fileName> that matches, both from
 * memory and from the file (best effort, like saveRecord). Returns how many
 * were removed. Records saved in this process are in memory and usually in the
 * file too, so the larger of the two counts is the number of distinct records.
 */
export function removeRecords(
  fileName: string,
  matches: (record: Record<string, unknown>) => boolean,
): number {
  const memory = (inMemory.get(fileName) ?? []) as Record<string, unknown>[];
  const keptInMemory = memory.filter((record) => !matches(record));
  inMemory.set(fileName, keptInMemory);
  const removedFromMemory = memory.length - keptInMemory.length;

  let removedFromFile = 0;
  try {
    const file = path.join(PRIVATE_DIR, fileName);
    if (fs.existsSync(file)) {
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      const existing = (Array.isArray(parsed) ? parsed : []) as Record<string, unknown>[];
      const kept = existing.filter((record) => !matches(record));
      removedFromFile = existing.length - kept.length;
      if (removedFromFile > 0) fs.writeFileSync(file, JSON.stringify(kept, null, 2) + "\n");
    }
  } catch (error) {
    console.warn(
      `[store] could not update data/private/${fileName}, removed from memory only:`,
      error instanceof Error ? error.message : error,
    );
  }
  return Math.max(removedFromMemory, removedFromFile);
}

/** A browser id sent by the page: letters, digits and hyphens, at most 80 characters. Otherwise "". */
export function clientIdField(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9-]{1,80}$/.test(value) ? value : "";
}

/** The records saved since this server process started. */
export function recordsInMemory(fileName: string): unknown[] {
  return inMemory.get(fileName) ?? [];
}
