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

/** The records saved since this server process started. */
export function recordsInMemory(fileName: string): unknown[] {
  return inMemory.get(fileName) ?? [];
}
