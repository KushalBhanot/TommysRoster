"use client";

import { useEffect, useRef, useState } from "react";

export type Phase = "idle" | "loading" | "done";

// How long the pretend search takes, so each design's loading moment is visible.
const LOADING_MS = 1600;

/**
 * The state every design preview shares: the question, the optional fields,
 * and a pretend search that goes idle → loading → done on a timer.
 */
export function useMockSearch() {
  const [question, setQuestion] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Put this on the element that should be in view once a search starts
  // (usually the results area, which on a phone is below the screen edge).
  const resultsRef = useRef<HTMLElement>(null);

  // Stop the timer if the page is left mid-search.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!question.trim()) return;
    if (timer.current) clearTimeout(timer.current);
    setPhase("loading");
    timer.current = setTimeout(() => setPhase("done"), LOADING_MS);
    // Wait one frame so the loading state is on the page before scrolling to it.
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  return {
    question, setQuestion,
    major, setMajor,
    year, setYear,
    optionalOpen, toggleOptional: () => setOptionalOpen((open) => !open),
    phase, submit, resultsRef,
  };
}

/** True when the person has asked their system for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
