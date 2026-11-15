import { findCourse, instructorsFor, semestersOffered } from "@/lib/catalog";
import { errorJson, json } from "@/lib/http";

// GET /api/catalog/[code] → { code, title, semesters: [{ semester, professors }] }
// One course from the official catalog, with the semesters it was actually
// offered in (newest first) and who taught it each time. The sign-up form
// builds its semester and professor choices from this, so nobody can pick a
// semester the course did not run in or a professor who did not teach it.
export async function GET(_request: Request, ctx: RouteContext<"/api/catalog/[code]">) {
  const { code } = await ctx.params;

  try {
    const course = findCourse(code);
    if (!course) return errorJson("We don't have a course with that code.", 404);
    return json({
      code: course.code,
      title: course.title,
      semesters: semestersOffered(course.code).map((semester) => ({
        semester,
        professors: instructorsFor(course.code, semester),
      })),
    });
  } catch (error) {
    console.error("[api/catalog/[code]]", error);
    return errorJson("Could not load this course.", 500);
  }
}
