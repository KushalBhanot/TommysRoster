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
    (code: string) => `I have no background in this. Is ${code} doable?`,
    (code: string) => `How do I keep up with the workload in ${code}?`,
    (code: string) => `Which ${code} section should I pick?`,
  ];
  const examples = codes.slice(0, templates.length).map((code, i) => templates[i](code));

  return (
    <MatchFinder
      heading="Who on the roster can answer this?"
      headingLevel="h1"
      intro="Describe what you're trying to figure out. We'll scan the students who took the class and pull up to three who can help."
      examples={examples}
    />
  );
}
