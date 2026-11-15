"use client";

import { useEffect, useRef, useState } from "react";
import type { Match, MatchResult } from "@/lib/match";
import { AskDialog } from "./AskDialog";
import { errorMessage, postJson } from "./api";
import { PersonEntry } from "./PersonEntry";

interface MatchFinderProps {
  /** When set, only people who took this course are searched. */
  code?: string;
  /** Example questions shown under the box. Clicking one fills the box. */
  examples: string[];
}

const MAX_QUESTION_CHARS = 300; // same limit as POST /api/match

// What the results area is showing right now.
type Results =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: MatchResult };

/**
 * The question box and its results: type what you are trying to figure out,
 * get up to three people from POST /api/match, and ask one of them.
 */
export function MatchFinder({ code, examples }: MatchFinderProps) {
  const [question, setQuestion] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [results, setResults] = useState<Results>({ status: "idle" });
  // The match whose "Ask" window is open, if any.
  const [asking, setAsking] = useState<Match | null>(null);

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Results appear below the form, which on a phone is below the screen edge,
  // so bring them into view when a search starts. When they arrive, move
  // keyboard and screen-reader focus to their heading.
  useEffect(() => {
    if (results.status === "loading") {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultsRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
    if (results.status === "done") {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [results.status]);

  async function findPeople() {
    setResults({ status: "loading" });
    try {
      const result = await postJson<MatchResult>("/api/match", {
        question,
        asker_major: major,
        asker_year: year,
        code,
      });
      setResults({ status: "done", result });
    } catch (error) {
      setResults({ status: "error", message: errorMessage(error) });
    }
  }

  function fillExample(example: string) {
    setQuestion(example);
    questionRef.current?.focus();
  }

  const charsLeft = MAX_QUESTION_CHARS - question.length;
  const loading = results.status === "loading";

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          findPeople();
        }}
      >
        <h1 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
          <label htmlFor="question">Describe what you&rsquo;re trying to figure out</label>
        </h1>
        <p className="mt-3 max-w-xl text-graphite">
          {code
            ? `We'll match you with up to three students who took ${code} and offered to answer questions.`
            : "We'll match you with up to three USC students who already took the course and offered to answer questions."}
        </p>

        {/* The one bold element on the page: your question, set large in serif. */}
        <textarea
          id="question"
          ref={questionRef}
          required
          rows={4}
          maxLength={MAX_QUESTION_CHARS}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          // Cmd+Enter (Mac) or Ctrl+Enter sends the form from inside the box.
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="I'm taking the class next semester and I'm worried about…"
          className="mt-8 block min-h-40 w-full resize-none field-sizing-content rounded-3xl border-[1.5px] border-ink px-5 py-4 font-serif text-2xl leading-snug caret-cardinal placeholder:text-ink/30 focus:border-cardinal focus:outline-none sm:px-6 sm:py-5 sm:text-[1.75rem]"
        />
        {charsLeft <= 60 && (
          <p className="mt-2 text-right text-sm text-graphite" aria-live="polite">
            {charsLeft} characters left
          </p>
        )}

        {examples.length > 0 && (
          <div className="mt-5">
            <p className="text-sm text-graphite">Or start from one of these</p>
            <ul className="mt-2 space-y-1">
              {examples.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => fillExample(example)}
                    className="py-1.5 text-left font-serif leading-snug text-graphite underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <label htmlFor="asker-major" className="block text-sm text-graphite">
              Your major (optional)
            </label>
            <input
              id="asker-major"
              value={major}
              maxLength={60}
              onChange={(event) => setMajor(event.target.value)}
              placeholder="Economics"
              className="mt-2 block h-12 w-full rounded-2xl border border-ink/30 px-4 text-base caret-cardinal placeholder:text-ink/35"
            />
          </div>
          <div>
            <label htmlFor="asker-year" className="block text-sm text-graphite">
              Grad year (optional)
            </label>
            <input
              id="asker-year"
              value={year}
              maxLength={10}
              inputMode="numeric"
              onChange={(event) => setYear(event.target.value)}
              placeholder="2029"
              className="mt-2 block h-12 w-full rounded-2xl border border-ink/30 px-4 text-base caret-cardinal placeholder:text-ink/35"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 h-13 w-full rounded-full bg-cardinal px-8 text-lg font-semibold text-paper transition-opacity disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Finding people…" : "Find people"}
        </button>
      </form>

      {/* scroll-mt leaves a little air above the results after scrolling to them. */}
      <section ref={resultsRef} aria-live="polite" className="scroll-mt-6">
        {results.status === "loading" && <LoadingRows />}

        {results.status === "error" && (
          <div role="alert" className="mt-12 border-t border-rule pt-8">
            <p className="font-semibold">Couldn&rsquo;t find people for that.</p>
            <p className="mt-1 text-graphite">{results.message}</p>
            <button
              type="button"
              onClick={findPeople}
              className="mt-5 h-11 rounded-full border border-ink px-5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Try again
            </button>
          </div>
        )}

        {results.status === "done" && results.result.matches.length === 0 && (
          <div className="mt-12 border-t border-rule pt-8">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
              No one on the roster fits that yet
            </h2>
            <p className="mt-2 max-w-xl text-graphite">
              {code
                ? `Try asking about a specific part of ${code}, like the exams, the workload or a project.`
                : "Try naming the course you're asking about, or pick a course below to see everyone who took it."}
            </p>
          </div>
        )}

        {results.status === "done" && results.result.matches.length > 0 && (
          <div className="mt-12">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
              People who can help
            </h2>
            {/* The model was unavailable: the API still returns people, with no reason. */}
            {results.result.matches.every((match) => match.reason === null) && (
              <p className="mt-2 max-w-xl text-graphite">
                We couldn&rsquo;t rank people against your question just now, so these are the
                most recent people on the roster.
              </p>
            )}
            <ul className="mt-6 border-b border-rule">
              {results.result.matches.map((match, index) => (
                <PersonEntry
                  key={match.person.person_id}
                  person={match.person}
                  code={match.code}
                  courses={match.courses}
                  reason={match.reason}
                  index={index}
                  onAsk={() => setAsking(match)}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {asking && results.status === "done" && (
        <AskDialog
          // A new key gives each person a fresh window (message, email, state).
          key={asking.person.person_id}
          person={asking.person}
          code={asking.code}
          draft={results.result.draft_message}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}

/** Three grey placeholder rows shown while the matches are being found. */
function LoadingRows() {
  return (
    <div className="mt-12" role="status">
      <p className="mb-6 text-xl font-semibold">Finding people who can help…</p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="border-t border-rule py-8 motion-safe:animate-pulse">
          <div className="h-5 w-32 rounded bg-rule" />
          <div className="mt-3 h-4 w-56 max-w-full rounded bg-rule" />
          <div className="mt-6 h-4 w-full rounded bg-rule" />
          <div className="mt-3 h-4 w-4/5 rounded bg-rule" />
        </div>
      ))}
    </div>
  );
}
