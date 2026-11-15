"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Person } from "@/lib/courses";
import { AskDialog } from "./AskDialog";
import { errorMessage, getJson } from "./api";
import { MatchFinder } from "./MatchFinder";
import { PersonEntry } from "./PersonEntry";

interface CoursePeople {
  code: string;
  title: string;
  people: Person[];
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; course: CoursePeople };

/**
 * One course: its code and title, a question box that only searches people
 * who took it, and then everyone who took it.
 */
export function CourseScreen() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  // Changing this number loads the course again; "Try again" does that.
  const [attempt, setAttempt] = useState(0);
  const [asking, setAsking] = useState<Person | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<CoursePeople>(`/api/courses/${encodeURIComponent(code)}/people`)
      .then((course) => {
        if (!cancelled) setState({ status: "ready", course });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  if (state.status === "loading") {
    return (
      <div role="status" className="pt-10 motion-safe:animate-pulse sm:pt-16">
        <span className="sr-only">Loading the course…</span>
        <div className="h-14 w-56 bg-rule" />
        <div className="mt-4 h-6 w-80 max-w-full bg-rule" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="pt-10 sm:pt-16">
        <h1 className="font-display text-4xl font-bold uppercase">Couldn&rsquo;t open this course</h1>
        <p className="mt-2 text-graphite">{state.message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
            className="min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            Try again
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
            Search all courses
          </Link>
        </div>
      </div>
    );
  }

  const { course } = state;
  const count = course.people.length;

  return (
    <>
      <div className="pt-10 sm:pt-16">
        <h1 className="font-display text-6xl leading-none font-bold uppercase sm:text-8xl">{course.code}</h1>
        <p className="mt-2 text-xl">{course.title}</p>
        <p className="mt-1 text-graphite">
          {count === 0
            ? "No one on the roster has taken this yet."
            : `${count} ${count === 1 ? "student" : "students"} on the roster took this.`}
        </p>
      </div>

      {count > 0 && (
        <div className="mt-12">
          <MatchFinder
            code={course.code}
            heading={`Ask about ${course.code}`}
            headingLevel="h2"
            intro="Describe what you're trying to figure out. We'll pick up to three of the people below who fit your question best."
            examples={[
              "What should I know before taking it?",
              "How do I keep up with the workload?",
              "Which section should I pick?",
            ]}
          />
        </div>
      )}

      <section aria-labelledby="everyone-title" className="mt-16">
        <h2 id="everyone-title" className="font-display text-4xl font-bold uppercase">
          Everyone who took it
        </h2>
        {count === 0 ? (
          <p className="mt-3 border-t-2 border-ink pt-4 text-graphite">
            Nobody yet. If you took {course.code}, you can be the first.
          </p>
        ) : (
          <ul className="mt-3 border-t-2 border-ink">
            {course.people.map((person, index) => (
              <PersonEntry key={person.person_id} person={person} index={Math.min(index, 4)} onAsk={() => setAsking(person)} />
            ))}
          </ul>
        )}

        <p className="mt-8">
          Took {course.code}?{" "}
          <Link href={`/join?code=${encodeURIComponent(course.code)}`} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
            Join the roster
          </Link>
        </p>
      </section>

      {asking && <AskDialog key={asking.person_id} person={asking} draft="" onClose={() => setAsking(null)} />}
    </>
  );
}
