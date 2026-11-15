import { connection } from "next/server";
import { getCoursePeople } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";

// GET /api/courses/[code]/people → Person[], most recent semester first.
// The code can be written any way: "WRIT%20150", "writ150" and "writ-150"
// all resolve to "WRIT 150". A course with nobody signed up returns [].
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/courses/[code]/people">,
) {
  await connection();
  const { code } = await ctx.params;

  try {
    return json(getCoursePeople(code));
  } catch (error) {
    console.error("[api/courses/[code]/people]", error);
    return errorJson("Could not load the people for this course.", 500);
  }
}
