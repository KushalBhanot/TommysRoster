import { connection } from "next/server";
import { rosterSample } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";
import { SIGN_IN_FIRST, mayUseSite } from "@/lib/session";

// GET /api/roster → [{ first_name, major, grad_year }]
// A handful of people from the roster. The home page shows these names while
// a search is running.
export async function GET() {
  await connection();
  // Names on the roster are for signed-in USC accounts, when sign-in is required.
  if (!(await mayUseSite())) return errorJson(SIGN_IN_FIRST, 401);
  try {
    return json(rosterSample(7));
  } catch (error) {
    console.error("[api/roster]", error);
    return errorJson("Could not load the roster.", 500);
  }
}
