// Minimal CSV reader/writer (RFC 4180): handles quoted fields, escaped quotes
// ("") and commas / line breaks inside quotes, which Google Forms exports use
// for long free-text answers. Written by hand so the app needs no CSV dependency.

/** Parse CSV text into rows of string cells. Fully empty lines are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  // Strip the byte-order mark some spreadsheet exports put at the start.
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"'; // "" inside quotes is a literal quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++; // Windows line ending
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  // Last line without a trailing newline.
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Turn rows of cells back into CSV text, quoting only where needed. */
export function toCsv(rows: string[][]): string {
  const escape = (cell: string) =>
    /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  return rows.map((r) => r.map(escape).join(",")).join("\n") + "\n";
}
