"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MAJORS from "@/data/majors.json";
import type { CourseSummary } from "@/lib/courses";
import { MAX_NOTE_CHARS } from "@/lib/note";
import { ABOUT_TAGS, HELP_TAGS } from "@/lib/tags";
import { Chips } from "./Chips";
import { courseHref } from "./CourseSearch";
import { gradYears } from "./Onboarding";
import { errorMessage, getJson, postJson } from "./api";
import { clientId, useProfile, type Profile } from "./profile";

// One course from the catalog, with the semesters it ran and who taught it.
interface CourseDetail {
  code: string;
  title: string;
  semesters: { semester: string; professors: string[] }[];
}

const MAX_HELP_TAGS = 3;
const MAX_ABOUT_TAGS = 2;

// Shared looks for the form's fields.
const FIELD = "mt-2 block h-12 w-full border-2 border-ink bg-paper px-3 text-base focus:border-cardinal disabled:border-rule disabled:text-graphite";
const LABEL = "block font-medium";

/**
 * The sign-up form. Only the first name and the email are typed. Everything
 * else is chosen: major and year from lists, the course from the official
 * catalog, the semester from the semesters that course ran, the professor
 * from who taught it then, and what you can talk about by tapping chips.
 */
export function JoinForm() {
  // The fields take their starting values from the profile, so wait until the
  // browser has read it. The key gives a fresh form if another account signs in.
  const { profile, ready } = useProfile();
  if (!ready) return null;
  return <JoinFields key={profile?.email ?? "signed-out"} profile={profile} />;
}

function JoinFields({ profile }: { profile: Profile | null }) {
  const codeFromLink = useSearchParams().get("code") ?? "";

  // The form starts filled in from what the person gave at onboarding, so
  // joining the roster is mostly choosing a course.
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [major, setMajor] = useState(profile?.major ?? "");
  const [gradYear, setGradYear] = useState(profile?.grad_year ?? "");
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [semester, setSemester] = useState("");
  const [professor, setProfessor] = useState("");
  const [helpTags, setHelpTags] = useState<string[]>([]);
  // What they said about themselves at onboarding is already ticked.
  const [aboutTags, setAboutTags] = useState<string[]>(() => (profile?.about ?? []).slice(0, MAX_ABOUT_TAGS));
  const [note, setNote] = useState("");

  // Course search: what is typed, and what the catalog answered.
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<CourseSummary[] | null>(null);

  const [status, setStatus] = useState<"editing" | "sending" | "done">("editing");
  const [error, setError] = useState("");

  // The same graduation years onboarding offers, plus the one already saved.
  const years = gradYears(profile?.grad_year ?? "");

  /** Load one course's semesters and professors, and make it the chosen course. */
  function chooseCourse(code: string) {
    getJson<CourseDetail>(`/api/catalog/${encodeURIComponent(code)}`)
      .then((detail) => {
        setCourse(detail);
        setSemester("");
        setProfessor("");
        setQuery("");
        setFound(null);
        setError("");
      })
      .catch((err) => setError(errorMessage(err)));
  }

  // Arriving from a course page (/join?code=…) starts with that course chosen.
  useEffect(() => {
    if (codeFromLink) chooseCourse(codeFromLink);
  }, [codeFromLink]);

  // Search the catalog a moment after the person stops typing.
  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getJson<CourseSummary[]>(`/api/catalog?q=${encodeURIComponent(text)}`)
        .then((courses) => {
          if (!cancelled) setFound(courses);
        })
        .catch(() => {
          if (!cancelled) setFound([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const professors = course?.semesters.find((s) => s.semester === semester)?.professors ?? [];

  /**
   * Add or remove a chip, never going over the limit for that group. It works
   * from the latest list (not the one from the last render), so two quick taps
   * are both counted.
   */
  function toggle(tag: string, setChosen: React.Dispatch<React.SetStateAction<string[]>>, max: number) {
    setChosen((chosen) => {
      if (chosen.includes(tag)) return chosen.filter((t) => t !== tag);
      return chosen.length < max ? [...chosen, tag] : chosen;
    });
  }

  async function join(event: React.FormEvent) {
    event.preventDefault();
    // The browser checks the typed fields and the lists; these two it cannot.
    if (!course) return setError("Choose the course you took.");
    if (helpTags.length === 0) return setError("Pick at least one thing you can talk about.");
    if (!email.trim().toLowerCase().endsWith("@usc.edu")) return setError("Use your @usc.edu email.");

    setError("");
    setStatus("sending");
    try {
      await postJson("/api/people", {
        first_name: firstName,
        email,
        major,
        grad_year: gradYear,
        code: course.code,
        semester,
        professor,
        help_tags: helpTags,
        about_tags: aboutTags,
        note,
        // Lets "Delete my data" on the Account page remove this sign-up later.
        client_id: clientId(),
      });
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("editing");
    }
  }

  if (status === "done" && course) {
    return (
      <div role="status" className="pt-10 sm:pt-16">
        <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">You&rsquo;re on the roster</h1>
        <p className="mt-4 max-w-xl text-lg text-graphite">
          Thanks, {firstName.trim()}. Students asking about {course.code} can now be matched with you.
          Their questions will reach you at your USC email, which is never shown on the site.
        </p>
        <p className="mt-8">
          <Link
            href={courseHref(course.code)}
            className="inline-flex min-h-12 items-center bg-cardinal px-8 font-display text-xl font-semibold tracking-wide text-paper uppercase"
          >
            See {course.code}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="pt-10 sm:pt-16">
      <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">Join the roster</h1>
      <p className="mt-4 max-w-xl text-lg text-graphite">
        Took a class? Let the next student ask you about it. It takes about a minute.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="join-name" className={LABEL}>First name</label>
          <input id="join-name" required maxLength={40} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="join-email" className={LABEL}>USC email</label>
          <input id="join-email" type="email" required autoComplete="email" inputMode="email" placeholder="you@usc.edu" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="join-email-note" className={`${FIELD} placeholder:text-[#767676]`} />
          <p id="join-email-note" className="mt-1 text-sm text-graphite">Never shown. Only used to pass questions on to you.</p>
        </div>
        <div>
          <label htmlFor="join-major" className={LABEL}>Major</label>
          <select id="join-major" required value={major} onChange={(e) => setMajor(e.target.value)} className={FIELD}>
            <option value="">Choose your major</option>
            {(MAJORS as string[]).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="join-year" className={LABEL}>Graduation year</label>
          <select id="join-year" required value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={FIELD}>
            <option value="">Choose a year</option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* The course: searched in the official catalog, never typed freely. */}
      <div className="mt-8">
        {course ? (
          <div>
            <p className={LABEL}>Course</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-gold/25 px-3 py-2.5">
              <p>
                <span className="font-display text-xl font-semibold uppercase">{course.code}</span>{" "}
                <span>{course.title}</span>
              </p>
              <button type="button" onClick={() => setCourse(null)} className="min-h-11 cursor-pointer font-medium underline underline-offset-4">
                Change
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Courses named at onboarding are one tap away. */}
            {profile && profile.courses.length > 0 && (
              <div className="mb-4">
                <p className={LABEL}>Courses you said you took</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {profile.courses.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => chooseCourse(code)}
                        className="min-h-11 cursor-pointer border-2 border-ink px-3 font-display text-lg font-semibold uppercase transition-colors duration-150 hover:bg-gold"
                      >
                        {code}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <label htmlFor="join-course" className={LABEL}>Course you took</label>
            <input
              id="join-course"
              type="search"
              autoComplete="off"
              placeholder="Search by code or title, like CSCI 103"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) setFound(null);
              }}
              className={`${FIELD} placeholder:text-[#767676]`}
            />
            <div aria-live="polite">
              {found && found.length === 0 && (
                <p className="mt-2 text-sm text-graphite">No course in the catalog matches that. Try the code, like WRIT 150.</p>
              )}
              {found && found.length > 0 && (
                <ul className="border-x-2 border-b-2 border-ink">
                  {found.map((item) => (
                    <li key={item.code} className="border-t border-rule first:border-t-0">
                      <button
                        type="button"
                        onClick={() => chooseCourse(item.code)}
                        className="grid min-h-11 w-full cursor-pointer grid-cols-[5.5rem_1fr] items-baseline gap-x-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-gold"
                      >
                        <span className="font-display text-lg font-semibold uppercase">{item.code}</span>
                        <span>{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="join-semester" className={LABEL}>Semester</label>
          <select
            id="join-semester"
            required
            disabled={!course}
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setProfessor("");
            }}
            className={FIELD}
          >
            <option value="">{course ? "Choose a semester" : "Choose the course first"}</option>
            {course?.semesters.map((s) => (
              <option key={s.semester}>{s.semester}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="join-professor" className={LABEL}>Professor</label>
          <select
            id="join-professor"
            // Only required when the schedule lists someone to choose from.
            required={professors.length > 0}
            disabled={!semester || professors.length === 0}
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className={FIELD}
          >
            <option value="">
              {!semester ? "Choose the semester first" : professors.length === 0 ? "None listed for that semester" : "Choose your professor"}
            </option>
            {professors.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <Chips
        legend="I can talk about"
        hint={`Pick up to ${MAX_HELP_TAGS}.`}
        tags={HELP_TAGS}
        chosen={helpTags}
        onToggle={(tag) => toggle(tag, setHelpTags, MAX_HELP_TAGS)}
      />
      <Chips
        legend="Any of these describe you?"
        hint={`Optional, up to ${MAX_ABOUT_TAGS}.`}
        tags={ABOUT_TAGS}
        chosen={aboutTags}
        onToggle={(tag) => toggle(tag, setAboutTags, MAX_ABOUT_TAGS)}
      />

      {/* The one thing here that is typed freely. It is what lets a match say
          why this person fits a question, so it is worth a sentence. */}
      <div className="mt-8">
        <label htmlFor="join-note" className="font-medium">
          One sentence about your experience <span className="font-normal text-graphite">Optional.</span>
        </label>
        <input
          id="join-note"
          maxLength={MAX_NOTE_CHARS}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-describedby="join-note-hint"
          placeholder="I had never coded before and can share how I caught up."
          className={`${FIELD} placeholder:text-[#767676]`}
        />
        <p id="join-note-hint" className="mt-1 text-sm text-graphite">
          Shown with your name on the roster. Write about yourself, not about a professor.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-6 font-semibold text-cardinal">
          {error}
        </p>
      )}

      <div className="mt-8">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-12 w-full cursor-pointer bg-cardinal px-8 font-display text-xl font-semibold tracking-wide text-paper uppercase transition-opacity duration-150 disabled:cursor-default disabled:opacity-70 sm:w-auto"
        >
          {status === "sending" ? "Joining…" : "Join the roster"}
        </button>
      </div>
    </form>
  );
}
