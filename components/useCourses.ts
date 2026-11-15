"use client";

import { useEffect, useState } from "react";
import type { CourseSummary } from "@/lib/courses";
import { errorMessage, getJson } from "./api";

type CoursesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: CourseSummary[] };

// The request in flight (or finished), shared by every component on the page
// that needs the course list, so GET /api/courses runs once, not once each.
let shared: Promise<CourseSummary[]> | null = null;

/** The course list from GET /api/courses, with loading and error states. */
export function useCourses() {
  const [state, setState] = useState<CoursesState>({ status: "loading" });
  // Changing this number runs the effect again; "Try again" does that.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false; // set when the component goes away mid-request
    shared ??= getJson<CourseSummary[]>("/api/courses");
    shared
      .then((courses) => {
        if (!cancelled) setState({ status: "ready", courses });
      })
      .catch((error) => {
        shared = null; // let the next attempt make a fresh request
        if (!cancelled) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
