"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/courses";
import type { MatchResult, MatchStatus } from "@/lib/match";
import { AskDialog } from "./AskDialog";
import { errorMessage, getJson, postJson } from "./api";
import { PersonEntry } from "./PersonEntry";

interface MatchFinderProps {
  /** When set, only people who took this course are searched. */
  code?: string;
  /** The heading over the box. On the home page this is the page's main heading. */
  heading: string;
  /** "h1" on the home page; "h2" on a page that already has a main heading. */
  headingLevel: "h1" | "h2";
  /** The sentence under the heading. */
  intro: string;
  /** Example questions shown under the box. Clicking one fills the box. */
  examples: string[];
}

const MAX_QUESTION_CHARS = 300; // same limit as POST /api/match
const STEP_MS = 200; // how long the gold bar rests on each roster row

type RosterRow = Pick<Person, "first_name" | "major" | "grad_year">;

// What the results area is showing right now.
type Results =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: MatchResult };

/**
 * The question box and its results: type what you are trying to figure out,
 * watch the roster being scanned, get up to three people from POST /api/match,
 * and ask one of them.
 */
export function MatchFinder({ code, heading, headingLevel, intro, examples }: MatchFinderProps) {
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState<Results>({ status: "idle" });
  // The person whose "Ask" window is open, if any.
  const [asking, setAsking] = useState<Person | null>(null);
  // A few names from the roster, shown while a search runs.
  const [roster, setRoster] = useState<RosterRow[]>([]);
  // Which roster row the gold bar is on while scanning.
  const [scanRow, setScanRow] = useState(0);

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The scan is decoration: if these names fail to load, the search still works.
  useEffect(() => {
    getJson<RosterRow[]>("/api/roster")
      .then(setRoster)
      .catch(() => {});
  }, []);

  // While searching, move the gold bar down one row at a time, round and round.
  useEffect(() => {
    if (results.status !== "loading" || roster.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setScanRow((row) => (row + 1) % roster.length), STEP_MS);
    return () => clearInterval(id);
  }, [results.status, roster.length]);

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
    setScanRow(0);
    setResults({ status: "loading" });
    try {
      const result = await postJson<MatchResult>("/api/match", { question, code });
      setResults({ status: "done", result });
    } catch (error) {
      setResults({ status: "error", message: errorMessage(error) });
    }
  }

  function fillExample(example: string) {
    setQuestion(example);
    questionRef.current?.focus();
  }

  const Heading = headingLevel;
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
        <Heading
          className={`font-display leading-[0.95] font-bold uppercase ${
            headingLevel === "h1" ? "text-5xl sm:text-7xl" : "text-3xl sm:text-4xl"
          }`}
        >
          <label htmlFor="question">{heading}</label>
        </Heading>
        <p className="mt-4 max-w-xl text-lg text-graphite">{intro}</p>

        <textarea
          id="question"
          ref={questionRef}
          required
          rows={3}
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
          className="mt-7 block w-full resize-none field-sizing-content border-2 border-ink bg-paper px-4 py-3 text-xl leading-snug placeholder:text-[#767676] focus:border-cardinal"
        />
        {charsLeft <= 60 && (
          <p className="mt-2 text-right text-sm text-graphite" aria-live="polite">
            {charsLeft} characters left
          </p>
        )}

        {examples.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {examples.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => fillExample(example)}
                  className="min-h-11 cursor-pointer border border-ink/30 px-3 text-left text-sm transition-colors duration-150 hover:border-ink"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full cursor-pointer bg-cardinal px-8 font-display text-xl font-semibold tracking-wide text-paper uppercase transition-opacity duration-150 disabled:cursor-default disabled:opacity-70 sm:w-auto"
          >
            {loading ? "Scanning…" : "Scan the roster"}
          </button>
        </div>
      </form>

      {/* scroll-mt leaves a little air above the results after scrolling to them. */}
      <section ref={resultsRef} aria-live="polite" className="scroll-mt-6">
        {results.status === "loading" && (
          <div role="status" className="mt-12">
            <p className="font-display text-lg font-semibold tracking-wide uppercase">Scanning the roster</p>
            <ol className="mt-3 border-t-2 border-ink">
              {roster.map((person, row) => (
                <li
                  key={person.first_name + row}
                  className={`flex items-baseline gap-4 border-b border-rule px-3 py-2.5 transition-colors duration-200 ${
                    row === scanRow ? "bg-gold" : ""
                  }`}
                >
                  <span className="w-7 font-display text-lg font-semibold tabular-nums">
                    {String(row + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl font-semibold uppercase">{person.first_name}</span>
                  <span className="ml-auto truncate text-sm">
                    {person.major}, {person.grad_year}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {results.status === "error" && (
          <div role="alert" className="mt-12 border-t-2 border-ink pt-6">
            <p className="font-display text-2xl font-bold uppercase">Couldn&rsquo;t scan the roster</p>
            <p className="mt-1 text-graphite">{results.message}</p>
            <button
              type="button"
              onClick={findPeople}
              className="mt-5 min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              Try again
            </button>
          </div>
        )}

        {results.status === "done" && results.result.matches.length === 0 && (
          <div className="mt-12 border-t-2 border-ink pt-6">
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold uppercase focus:outline-none">
              {noPeopleMessage(results.result.status, code).title}
            </h2>
            <p className="mt-2 max-w-xl text-graphite">{noPeopleMessage(results.result.status, code).body}</p>
            {results.result.status === "unavailable" && (
              <button
                type="button"
                onClick={findPeople}
                className="mt-5 min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {results.status === "done" && results.result.matches.length > 0 && (
          <div className="mt-12">
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-semibold tracking-wide uppercase focus:outline-none">
              {results.result.matches.length === 1 ? "One person who can help" : "People who can help"}
            </h2>
            {/* The model was unavailable: these are simply the latest people from the course. */}
            {results.result.status === "fallback" && (
              <p className="mt-2 max-w-xl text-graphite">
                We couldn&rsquo;t read your question with AI just now, so these are the most
                recent people who took {results.result.matches[0].person.code}.
              </p>
            )}
            <ol className="mt-3 border-t-2 border-ink">
              {results.result.matches.map((match, index) => (
                <PersonEntry
                  key={match.person.person_id}
                  person={match.person}
                  rank={index + 1}
                  reason={match.reason}
                  keyPhrases={match.key_phrases}
                  index={index}
                  onAsk={() => setAsking(match.person)}
                />
              ))}
            </ol>
          </div>
        )}
      </section>

      {asking && results.status === "done" && (
        <AskDialog
          // A new key gives each person a fresh window (message, email, state).
          key={asking.person_id}
          person={asking}
          draft={results.result.draft_message}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}

/**
 * What to say when the API returns nobody. It tells us why (see MatchStatus in
 * lib/match.ts), so the page can be honest about it: text it could not read
 * and a question nobody can answer yet are different situations.
 */
function noPeopleMessage(status: MatchStatus, code?: string): { title: string; body: string } {
  switch (status) {
    case "unclear":
      return {
        title: "We couldn't read that as a question",
        body: "Try a full sentence about a course, for example: How do I prepare for exams in CHEM 105A?",
      };
    case "off_topic":
      return {
        title: "That doesn't look like a question about a course",
        body: "This roster connects you with students who took a class. Ask about a course, its workload, its exams, or which section to take.",
      };
    case "unavailable":
      return {
        title: "Matching isn't available right now",
        body: "We couldn't reach the AI that reads your question. Try again in a minute, or pick a course below to see everyone who took it.",
      };
    default:
      return {
        title: "No one on the roster fits that yet",
        body: code
          ? `Try asking about a specific part of ${code}, like the workload, the exams, or which section to take.`
          : "Try naming the course you're asking about, or pick a course below to see everyone who took it.",
      };
  }
}
