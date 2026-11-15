"use client";

// /welcome: the three onboarding steps a person goes through right after
// signing in (first name; major, level and graduation year; courses taken),
// followed by the privacy notice they must accept.
//
// Each step is saved to the browser store (components/profile.ts) as soon as
// the person presses Next, so a reload brings them back to where they were.
//
// This file also exports the pieces the Account page reuses: the course
// picker, the undergraduate / graduate choice and the list of graduation years.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MAJORS from "@/data/majors.json";
import type { CourseSummary } from "@/lib/courses";
import { ABOUT_TAGS } from "@/lib/tags";
import { Chips, toggleTag } from "./Chips";
import { PrivacyNotice } from "./PrivacyNotice";
import { getJson, errorMessage } from "./api";
import { signOutLocally, updateProfile, useProfile, type Profile } from "./profile";
import { endSession } from "./session";

// Shared looks for fields and buttons (the same as the Join form).
export const FIELD =
  "mt-2 block h-12 w-full border-2 border-ink bg-paper px-3 text-base focus:border-cardinal disabled:border-rule disabled:text-graphite";
export const LABEL = "block font-medium";
export const PRIMARY_BUTTON =
  "min-h-12 cursor-pointer bg-cardinal px-8 font-display text-xl font-semibold tracking-wide text-paper uppercase transition-opacity duration-150 disabled:cursor-default disabled:opacity-70";
export const SECONDARY_BUTTON =
  "min-h-12 cursor-pointer border-2 border-ink px-6 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper";

const MAX_NAME_CHARS = 40;
/** How many "about you" tags a person may pick. */
export const MAX_ABOUT = 2;

/**
 * Graduation years to offer: this year through six years from now. A year
 * already saved that falls outside that range is kept in the list, so editing
 * an older profile never silently drops it.
 */
export function gradYears(saved = ""): string[] {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => String(thisYear + i));
  if (saved && !years.includes(saved)) years.unshift(saved);
  return years;
}

/** The first step that still needs an answer, so a reload resumes there. */
function firstOpenStep(profile: Profile): 1 | 2 | 3 {
  if (!profile.first_name) return 1;
  if (!profile.major || !profile.level || !profile.grad_year) return 2;
  return 3;
}

/**
 * The /welcome screen. It waits until the browser has read the profile, sends
 * signed-out people to /signin and finished people to the home page, and
 * otherwise shows the steps (or the privacy notice once the steps are done).
 */
export function Onboarding() {
  const router = useRouter();
  const { profile, ready } = useProfile();

  const signedOut = ready && !profile;
  const finished = Boolean(profile?.onboarded && profile.privacy_seen);

  useEffect(() => {
    if (signedOut) router.replace("/signin");
    else if (finished) router.replace("/");
  }, [signedOut, finished, router]);

  if (!ready || !profile || finished) return null;

  // Steps done but the notice not accepted yet (also after a reload).
  if (profile.onboarded) {
    return (
      <>
        <div className="pt-10 sm:pt-16">
          <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">Almost done</h1>
          <p className="mt-4 max-w-xl text-lg text-graphite">Read how your information is used, then you&rsquo;re in.</p>
        </div>
        <PrivacyNotice
          mode="accept"
          onAccept={() => {
            updateProfile({ privacy_seen: true });
            router.replace("/");
          }}
        />
      </>
    );
  }

  return (
    <>
      <Steps profile={profile} />
      <WrongAccount email={profile.email} />
    </>
  );
}

/**
 * Under the steps: which account this is, and a way out. Without it, someone
 * who signed in with the wrong account would have to finish onboarding before
 * they could reach "Sign out" on the Account page.
 */
function WrongAccount({ email }: { email: string }) {
  const router = useRouter();

  async function startOver() {
    // The server forgets its session first, then the browser the profile.
    await endSession();
    signOutLocally();
    router.replace("/signin");
  }

  return (
    <p className="mt-12 border-t border-rule pt-4 text-sm text-graphite">
      Signed in as <span className="break-all text-ink">{email}</span>.{" "}
      <button type="button" onClick={startOver} className="min-h-11 cursor-pointer underline underline-offset-4">
        Not you? Sign out
      </button>
    </p>
  );
}

/**
 * The three steps themselves. It starts from the saved profile, so typed
 * answers survive a reload once Next has been pressed.
 */
function Steps({ profile }: { profile: Profile }) {
  const [step, setStep] = useState<1 | 2 | 3>(() => firstOpenStep(profile));
  const [firstName, setFirstName] = useState(profile.first_name);
  const [major, setMajor] = useState(profile.major);
  const [level, setLevel] = useState(profile.level);
  const [gradYear, setGradYear] = useState(profile.grad_year);
  const [courses, setCourses] = useState(profile.courses);
  const [about, setAbout] = useState(profile.about ?? []);
  const [error, setError] = useState("");

  // Move keyboard and screen reader focus to the new heading when the step
  // changes, so the change is announced. Not on the first render.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function goTo(next: 1 | 2 | 3) {
    setError("");
    setStep(next);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 1) {
      const name = firstName.trim();
      if (!name) return setError("Enter your first name.");
      updateProfile({ first_name: name });
      return goTo(2);
    }
    if (step === 2) {
      if (!major) return setError("Choose your major.");
      if (!level) return setError("Choose undergraduate or graduate.");
      if (!gradYear) return setError("Choose your graduation year.");
      updateProfile({ major, level, grad_year: gradYear, about });
      return goTo(3);
    }
    // Step 3 is optional. Finishing it marks onboarding done, which makes
    // the parent show the privacy notice.
    updateProfile({ courses, onboarded: true });
  }

  const headings = { 1: "What's your first name?", 2: "What are you studying?", 3: "Courses you've taken" };

  return (
    <form onSubmit={submit} noValidate className="pt-10 sm:pt-16">
      <p className="font-display text-lg font-semibold tracking-wide text-graphite uppercase">Step {step} of 3</p>
      {/* A thin progress bar: one segment per step, filled up to this one. */}
      <div className="mt-2 grid grid-cols-3 gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 transition-colors duration-200 ${n <= step ? "bg-cardinal" : "bg-rule"}`} />
        ))}
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-5xl leading-[0.95] font-bold uppercase outline-none sm:text-7xl"
      >
        {headings[step]}
      </h1>

      <div key={step} className="rise mt-8">
        {step === 1 && (
          <div className="max-w-md">
            <label htmlFor="welcome-name" className={LABEL}>First name</label>
            <input
              id="welcome-name"
              required
              autoFocus
              maxLength={MAX_NAME_CHARS}
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-describedby="welcome-name-note"
              className={FIELD}
            />
            <p id="welcome-name-note" className="mt-1 text-sm text-graphite">
              Used to sign the messages we draft for you. Never sent to the AI.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6">
            <div>
              <label htmlFor="welcome-major" className={LABEL}>Major</label>
              <select id="welcome-major" required value={major} onChange={(e) => setMajor(e.target.value)} className={FIELD}>
                <option value="">Choose your major</option>
                {(MAJORS as string[]).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <LevelChoice name="welcome-level" value={level} onChange={setLevel} />
            <div className="max-w-xs">
              <label htmlFor="welcome-year" className={LABEL}>Graduation year</label>
              <select id="welcome-year" required value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={FIELD}>
                <option value="">Choose a year</option>
                {gradYears(gradYear).map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>
            {/* Optional. Lets a match prefer people on a path like theirs
                without them having to say so in every question. */}
            <div className="-mt-8">
              <Chips
                legend="Any of these describe you?"
                hint="Optional. Helps us find people on a path like yours."
                tags={ABOUT_TAGS}
                chosen={about}
                onToggle={(tag) => setAbout((chosen) => toggleTag(chosen, tag, MAX_ABOUT))}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <CoursePicker
            selected={courses}
            onChange={(next) => {
              setCourses(next);
              updateProfile({ courses: next }); // keep picks across a reload
            }}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-6 font-semibold text-cardinal">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="submit" className={PRIMARY_BUTTON}>
          {step === 3 ? "Finish" : "Next"}
        </button>
        {step > 1 && (
          <button type="button" onClick={() => goTo((step - 1) as 1 | 2)} className={SECONDARY_BUTTON}>
            Back
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Undergraduate or graduate, as two large buttons. They are real radio
 * buttons inside big labels, so arrow keys and screen readers work as usual.
 */
export function LevelChoice({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Profile["level"];
  onChange: (level: Profile["level"]) => void;
}) {
  const options = [
    { value: "undergraduate", label: "Undergraduate" },
    { value: "graduate", label: "Graduate" },
  ] as const;

  return (
    <fieldset>
      <legend className={LABEL}>Level</legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            // The chosen one is tinted gold and its radio dot is filled, so the
            // state is not shown by color alone.
            className="flex min-h-14 cursor-pointer items-center gap-2 border-2 border-ink px-3 font-display text-lg font-semibold uppercase transition-colors duration-150 hover:bg-gold/40 has-checked:bg-gold/25 sm:gap-3 sm:px-4 sm:text-xl"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-5 shrink-0 cursor-pointer accent-ink"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// What the course filter is showing.
type Results =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; courses: CourseSummary[] }
  | { state: "error"; message: string };

const MAX_RESULTS = 50;

/**
 * "Courses you've taken": a filter box over the catalog, the matching courses
 * as checkboxes, and the chosen ones as removable chips above, so they stay
 * visible when the filter text changes. Any number may be chosen, or none.
 */
export function CoursePicker({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ state: "idle" });
  // Bumped by "Try again" so the search below runs once more.
  const [attempt, setAttempt] = useState(0);

  // Ask the catalog a moment after typing stops. Older answers are ignored.
  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getJson<CourseSummary[]>(`/api/catalog?q=${encodeURIComponent(text)}&limit=${MAX_RESULTS}`)
        .then((courses) => {
          if (!cancelled) setResults({ state: "done", courses });
        })
        .catch((err) => {
          if (!cancelled) setResults({ state: "error", message: errorMessage(err) });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, attempt]);

  function changeQuery(text: string) {
    setQuery(text);
    setResults(text.trim() ? { state: "loading" } : { state: "idle" });
  }

  function toggle(code: string) {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  return (
    <div>
      <p className="max-w-xl text-graphite">
        Optional. It helps the AI suggest people on a path like yours. You can add these later in Account.
      </p>

      {/* The chosen courses, kept visible whatever the filter shows. */}
      <div className="mt-5" aria-live="polite">
        <p className={LABEL}>
          Chosen <span className="font-normal text-graphite">({selected.length})</span>
        </p>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-graphite">None yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selected.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => toggle(code)}
                  aria-label={`Remove ${code}`}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-ink bg-ink px-3 font-display text-lg font-semibold text-paper uppercase transition-colors duration-150 hover:bg-paper hover:text-ink"
                >
                  {code}
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="course-filter" className={LABEL}>Find a course</label>
        <input
          id="course-filter"
          type="search"
          autoComplete="off"
          placeholder="Type a prefix or code, like csci or buad312"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          className={`${FIELD} placeholder:text-[#767676]`}
        />
      </div>

      <div aria-live="polite" className="mt-2">
        {results.state === "idle" && (
          <p className="text-sm text-graphite">Type a department prefix to list its courses.</p>
        )}
        {results.state === "loading" && <p className="text-sm text-graphite">Searching the catalog…</p>}
        {results.state === "error" && (
          <p className="text-sm font-semibold text-cardinal">
            {results.message}{" "}
            <button
              type="button"
              onClick={() => {
                setResults({ state: "loading" });
                setAttempt((n) => n + 1);
              }}
              className="min-h-11 cursor-pointer underline underline-offset-4"
            >
              Try again
            </button>
          </p>
        )}
        {results.state === "done" && results.courses.length === 0 && (
          <p className="text-sm text-graphite">No course in the catalog matches that. Try a prefix like WRIT or a code like WRIT 150.</p>
        )}
        {/* For screen readers: say how many, without reading the whole list out. */}
        {results.state === "done" && results.courses.length > 0 && (
          <p className="sr-only">
            {results.courses.length} {results.courses.length === 1 ? "course matches" : "courses match"}. The list is
            below.
          </p>
        )}
      </div>

      <div className="mt-2">
        {results.state === "done" && results.courses.length > 0 && (
          <fieldset>
            <legend className="sr-only">Courses matching &ldquo;{query.trim()}&rdquo;</legend>
            <ul className="max-h-96 overflow-y-auto border-2 border-ink">
              {results.courses.map((course) => {
                const checked = selected.includes(course.code);
                return (
                  <li key={course.code} className="border-t border-rule first:border-t-0">
                    <label
                      className={`grid min-h-11 cursor-pointer grid-cols-[auto_5.5rem_1fr] items-baseline gap-x-3 px-3 py-2 transition-colors duration-150 hover:bg-gold/40 ${
                        checked ? "bg-gold/25" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(course.code)}
                        className="size-5 translate-y-0.5 cursor-pointer accent-ink"
                      />
                      <span className="font-display text-lg font-semibold uppercase">{course.code}</span>
                      <span>{course.title}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {results.courses.length === MAX_RESULTS && (
              <p className="mt-2 text-sm text-graphite">Showing the first {MAX_RESULTS}. Type more of the code to narrow it down.</p>
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}
