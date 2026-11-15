import { connection } from "next/server";
import { getCourseDetail } from "@/lib/courses";

// GET /api/courses/[code] → the full course payload (see SPEC.md "API").
// The code can be written any way: "WRIT%20150", "writ150" and "writ-150"
// all resolve to "WRIT 150".
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/courses/[code]">,
) {
  await connection();
  const { code } = await ctx.params;

  try {
    const course = getCourseDetail(code);
    if (!course) {
      return Response.json({ error: "No advice found for this course." }, { status: 404 });
    }
    return Response.json(course);
  } catch (error) {
    console.error("[api/courses/[code]]", error);
    return Response.json({ error: "Could not load this course." }, { status: 500 });
  }
}
