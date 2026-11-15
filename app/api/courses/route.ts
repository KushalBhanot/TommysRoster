import { connection } from "next/server";
import { listCourses } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";

// GET /api/courses → [{ code, title, people_count }], most people first.
export async function GET() {
  // Run on every request instead of being prerendered at build time, so
  // people who sign up while the server is running show up in the counts.
  await connection();

  try {
    return json(listCourses());
  } catch (error) {
    console.error("[api/courses]", error);
    return errorJson("Could not load courses.", 500);
  }
}
