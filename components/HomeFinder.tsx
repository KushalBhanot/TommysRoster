"use client";

import { MatchFinder } from "./MatchFinder";
import { useCourses } from "./useCourses";

/**
 * The question box on the home page. Its example questions are built from the
 * courses that actually have people, so clicking one always leads somewhere.
 */
export function HomeFinder() {
  const { state } = useCourses();
  const codes = state.status === "ready" ? state.courses.map((course) => course.code) : [];

  // One template per course, most-covered course first. With fewer than three
  // courses there are simply fewer examples.
  const templates = [
    (code: string) => `What should I know before taking ${code}?`,
    (code: string) => `How do I keep up with the workload in ${code}?`,
    (code: string) => `What's the best way to prepare for exams in ${code}?`,
  ];
  const examples = codes.slice(0, templates.length).map((code, i) => templates[i](code));

  return <MatchFinder examples={examples} />;
}
