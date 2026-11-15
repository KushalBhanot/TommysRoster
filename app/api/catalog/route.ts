import { searchCatalog } from "@/lib/catalog";
import { peopleCount } from "@/lib/courses";
import { errorJson, json } from "@/lib/http";

// How many courses come back unless the caller asks for more.
const DEFAULT_RESULTS = 8;
// The most a caller may ask for (the onboarding course picker lists a whole prefix).
const MAX_RESULTS = 60;

// GET /api/catalog?q=writ&limit=8 → [{ code, title, people_count }]
// Search over the official course catalog by code or title, for the course
// search boxes. people_count is how many people on the roster took the course.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  if (query.length > 60) return errorJson("That search is too long.", 400);

  const asked = Number(params.get("limit"));
  const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MAX_RESULTS) : DEFAULT_RESULTS;

  try {
    return json(
      searchCatalog(query, limit).map((course) => ({
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
