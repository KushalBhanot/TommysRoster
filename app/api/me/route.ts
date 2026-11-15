// DELETE /api/me: "Delete my data". Removes the intro requests and roster
// sign-ups that belong to the caller. Two things tie a record to a person:
// - the random browser id (client_id) the page sent with it, and
// - the USC address, but only for a caller whose address Google verified
//   (then records made in their other browsers are removed too).
// A typed, unverified address never counts: it would let anyone delete
// someone else's records.

import { removePersonRows } from "@/lib/data";
import { errorJson, json, readJsonObject } from "@/lib/http";
import { verifiedEmail } from "@/lib/session";
import { clientIdField, recordsInMemory, removeRecords } from "@/lib/store";

// body { client_id? } → { ok: true, removed: { requests, signups } }
export async function DELETE(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return errorJson("Send a JSON body.", 400);

  const client_id = clientIdField(body.client_id);
  const email = await verifiedEmail();
  if (!client_id && !email) return errorJson("Send the browser id (client_id) to delete its data.", 400);

  try {
    const mine = (record: Record<string, unknown>) =>
      (client_id !== "" && record.client_id === client_id) ||
      // Requests keep the address as from_email, sign-ups as email.
      (email !== null && (record.from_email === email || record.email === email));

    // Note which roster rows these sign-ups made before the records are gone.
    // Only sign-ups from this server's lifetime are on the roster in memory.
    const onRoster = (recordsInMemory("new-people.json") as Record<string, unknown>[])
      .filter(mine)
      .map((record) => ({ person_id: record.person_id, code: record.code }));

    const requests = removeRecords("requests.json", mine);
    const signups = removeRecords("new-people.json", mine);

    // removePersonRows only ever touches rows whose source is "real".
    removePersonRows((row) =>
      onRoster.some((made) => made.person_id === row.person_id && made.code === row.code),
    );

    return json({ ok: true, removed: { requests, signups } });
  } catch (error) {
    console.error("[api/me]", error instanceof Error ? error.message : "unknown error");
    return errorJson("Could not delete your data. Please try again.", 500);
  }
}
