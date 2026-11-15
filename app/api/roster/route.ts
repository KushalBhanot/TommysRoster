import { connection } from "next/server";
import { rosterSample } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";

// GET /api/roster → [{ first_name, major, grad_year }]
// A handful of people from the roster. The home page shows these names while
// a search is running.
export async function GET() {
  await connection();
  try {
    return json(rosterSample(7));
  } catch (error) {
    console.error("[api/roster]", error);
    return errorJson("Could not load the roster.", 500);
  }
}
