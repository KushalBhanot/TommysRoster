import { searchCatalog } from "@/lib/catalog";
import { peopleCount } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";

const MAX_RESULTS = 8;

// GET /api/catalog?q=writ → [{ code, title, people_count }]
// Search over the official course catalog by code or title, for the course
// search boxes. people_count is how many people on the roster took the course.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > 60) return errorJson("That search is too long.", 400);

  try {
    return json(
      searchCatalog(query, MAX_RESULTS).map((course) => ({
        code: course.code,
        title: course.title,
        people_count: peopleCount(course.code),
      })),
    );
  } catch (error) {
    console.error("[api/catalog]", error);
    return errorJson("Could not search the catalog.", 500);
  }
}
