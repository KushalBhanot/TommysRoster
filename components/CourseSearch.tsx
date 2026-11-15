"use client";

import Link from "next/link";
import { useState } from "react";
import { useCourses } from "./useCourses";

// How many courses to list before the person has typed anything.
const TOP_COURSES = 8;

/** "writ 150", "WRIT-150" → "WRIT150", so spacing and case don't matter. */
function compact(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "WRIT 150" → "/course/writ150" (the course page accepts any spelling). */
function courseHref(code: string): string {
  return `/course/${compact(code).toLowerCase()}`;
}

/** Search box over GET /api/courses, with the most-covered courses listed first. */
export function CourseSearch() {
  const { state, retry } = useCourses();
  const [query, setQuery] = useState("");

  return (
    <section aria-labelledby="courses-title">
      <h2 id="courses-title" className="text-2xl font-semibold">
        Browse by course
      </h2>

      <label htmlFor="course-search" className="mt-5 block text-sm text-graphite">
        Course code
      </label>
      <input
        id="course-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="WRIT 150"
        autoComplete="off"
        className="mt-2 block h-12 w-full rounded-2xl border border-ink/30 px-4 text-base caret-cardinal placeholder:text-ink/35 sm:max-w-xs"
      />

      <div className="mt-6" aria-live="polite">
        {state.status === "loading" && (
          <div role="status">
            <span className="sr-only">Loading courses…</span>
            {[0, 1, 2].map((row) => (
              <div key={row} className="border-t border-rule py-4 motion-safe:animate-pulse">
                <div className="h-5 w-40 rounded bg-rule" />
              </div>
            ))}
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="border-t border-rule pt-6">
            <p className="font-semibold">Couldn&rsquo;t load the courses.</p>
            <p className="mt-1 text-graphite">{state.message}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 h-11 rounded-full border border-ink px-5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && <CourseList courses={state.courses} query={query} />}
      </div>
    </section>
  );
}

function CourseList({
  courses,
  query,
}: {
  courses: { code: string; people_count: number }[];
  query: string;
}) {
  if (courses.length === 0) {
    return (
      <p className="border-t border-rule pt-6 text-graphite">
        No one has joined the roster yet.{" "}
        <Link href="/join" className="text-ink underline underline-offset-4">
          Be the first
        </Link>
        .
      </p>
    );
  }

  const wanted = compact(query);
  const matching = wanted
    ? courses.filter((course) => compact(course.code).includes(wanted))
    : courses.slice(0, TOP_COURSES);

  if (matching.length === 0) {
    return (
      <p className="border-t border-rule pt-6 text-graphite">
        No one has signed up for &ldquo;{query.trim()}&rdquo; yet. Took it?{" "}
        <Link
          href={`/join?code=${encodeURIComponent(query.trim())}`}
          className="text-ink underline underline-offset-4"
        >
          Join the roster
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <ul className="border-b border-rule">
        {matching.map((course) => (
          <li key={course.code} className="border-t border-rule">
            <Link
              href={courseHref(course.code)}
              className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:bg-ink/[0.03]"
            >
              <span className="text-lg font-semibold">{course.code}</span>
              <span className="text-graphite">
                {course.people_count} {course.people_count === 1 ? "student" : "students"} took this
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!wanted && courses.length > TOP_COURSES && (
        <p className="mt-4 text-sm text-graphite">
          Showing the {TOP_COURSES} courses with the most students. Search to find the other{" "}
          {courses.length - TOP_COURSES}.
        </p>
      )}
    </>
  );
}
