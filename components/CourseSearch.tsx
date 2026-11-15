"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CourseSummary } from "@/lib/courses";
import { errorMessage, getJson } from "./api";
import { useCourses } from "./useCourses";

// How many courses to list before the person has typed anything.
const TOP_COURSES = 8;

/** "WRIT 150" → "/course/writ150" (the course page accepts any spelling). */
export function courseHref(code: string): string {
  return `/course/${code.replace(/[^A-Za-z0-9]/g, "").toLowerCase()}`;
}

type Search =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: CourseSummary[] };

/**
 * Course search. With nothing typed it lists the courses with the most people
 * (GET /api/courses). Typing searches the whole official catalog by code or
 * title (GET /api/catalog), so a course nobody has joined yet can still be found.
 */
export function CourseSearch() {
  const top = useCourses();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<Search>({ status: "idle" });

  // Search a moment after the person stops typing, and ignore an answer that
  // arrives after they have typed something else.
  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getJson<CourseSummary[]>(`/api/catalog?q=${encodeURIComponent(text)}`)
        .then((courses) => {
          if (!cancelled) setSearch({ status: "ready", courses });
        })
        .catch((error) => {
          if (!cancelled) setSearch({ status: "error", message: errorMessage(error) });
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const typing = query.trim() !== "";

  return (
    <section aria-labelledby="courses-title">
      <h2 id="courses-title" className="font-display text-4xl font-bold uppercase">
        Browse by course
      </h2>

      <label htmlFor="course-search" className="mt-4 block text-sm text-graphite">
        Course code or title
      </label>
      <input
        id="course-search"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSearch(event.target.value.trim() ? { status: "loading" } : { status: "idle" });
        }}
        placeholder="WRIT 150, or Calculus"
        autoComplete="off"
        className="mt-2 block h-12 w-full border-2 border-ink px-4 text-base placeholder:text-[#767676] focus:border-cardinal sm:max-w-sm"
      />

      <div className="mt-6" aria-live="polite">
        {typing ? (
          <>
            {search.status === "loading" && <Placeholder label="Searching the catalog…" />}
            {search.status === "error" && <p role="alert" className="border-t-2 border-ink pt-4 text-graphite">{search.message}</p>}
            {search.status === "ready" && search.courses.length === 0 && (
              <p className="border-t-2 border-ink pt-4 text-graphite">
                No course in the catalog matches &ldquo;{query.trim()}&rdquo;. Try the code, like CSCI 103.
              </p>
            )}
            {search.status === "ready" && search.courses.length > 0 && <CourseRows courses={search.courses} />}
          </>
        ) : (
          <>
            {top.state.status === "loading" && <Placeholder label="Loading courses…" />}
            {top.state.status === "error" && (
              <div role="alert" className="border-t-2 border-ink pt-4">
                <p className="font-semibold">Couldn&rsquo;t load the courses.</p>
                <p className="mt-1 text-graphite">{top.state.message}</p>
                <button
                  type="button"
                  onClick={top.retry}
                  className="mt-4 min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
                >
                  Try again
                </button>
              </div>
            )}
            {top.state.status === "ready" && top.state.courses.length === 0 && (
              <p className="border-t-2 border-ink pt-4 text-graphite">
                No one has joined the roster yet.{" "}
                <Link href="/join" className="text-ink underline underline-offset-4">Be the first</Link>.
              </p>
            )}
            {top.state.status === "ready" && top.state.courses.length > 0 && (
              <>
                <CourseRows courses={top.state.courses.slice(0, TOP_COURSES)} />
                {top.state.courses.length > TOP_COURSES && (
                  <p className="mt-3 text-sm text-graphite">
                    The {TOP_COURSES} courses with the most students. Search to find any other course.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CourseRows({ courses }: { courses: CourseSummary[] }) {
  return (
    <ul className="border-t-2 border-ink">
      {courses.map((course) => (
        <li key={course.code} className="border-b border-rule">
          <Link
            href={courseHref(course.code)}
            className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-3 px-3 py-3 transition-colors duration-150 hover:bg-gold sm:grid-cols-[6.5rem_1fr_auto]"
          >
            <span className="font-display text-xl font-semibold uppercase">{course.code}</span>
            <span>{course.title}</span>
            <span className="col-start-2 text-sm text-graphite sm:col-start-3">
              {course.people_count === 0
                ? "No one yet"
                : `${course.people_count} ${course.people_count === 1 ? "student" : "students"} took this`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div role="status" className="border-t-2 border-ink">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((row) => (
        <div key={row} className="border-b border-rule px-3 py-4 motion-safe:animate-pulse">
          <div className="h-5 w-2/3 bg-rule" />
        </div>
      ))}
    </div>
  );
}
