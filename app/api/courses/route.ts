import { connection } from "next/server";
import { listCourses } from "@/lib/courses";

// GET /api/courses → [{ code, advice_count, has_briefing }], most advice first.
export async function GET() {
  // Run on every request instead of being prerendered at build time, so
  // advice added while the server is running shows up in the counts.
  await connection();

  try {
    return Response.json(listCourses());
  } catch (error) {
    console.error("[api/courses]", error);
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }
}
