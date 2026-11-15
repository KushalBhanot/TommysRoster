import { connection } from "next/server";
import { findCourse } from "@/lib/catalog";
import { getCoursePeople } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";
import { SIGN_IN_FIRST, mayUseSite } from "@/lib/session";

// GET /api/courses/[code]/people → { code, title, people: Person[] }
// People are listed most recent semester first. The code can be written any
// way ("writ150", "WRIT%20150"). A course that is in the catalog but that
// nobody has signed up for returns an empty people list; a code that is not
// in the catalog at all is a 404.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/courses/[code]/people">,
) {
  await connection();
  // Who is on the roster is for signed-in USC accounts, when sign-in is required.
  if (!(await mayUseSite())) return errorJson(SIGN_IN_FIRST, 401);
  const { code } = await ctx.params;

  try {
    const course = findCourse(code);
    if (!course) return errorJson("We don't have a course with that code.", 404);
    return json({ code: course.code, title: course.title, people: getCoursePeople(course.code) });
  } catch (error) {
    console.error("[api/courses/[code]/people]", error);
    return errorJson("Could not load the people for this course.", 500);
  }
}
