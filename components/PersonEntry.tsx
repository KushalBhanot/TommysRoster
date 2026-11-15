"use client";

// One person on the roster, as a ruled row: who they are, what they took, the
// AI's reason when the row came from a match, and the button to ask them.
// If this browser already sent them a request for this course, the button
// says "Ask again" and shows when (read from the Sent list in profile.ts).

import type { Person } from "@/lib/courses";
import { useProfile, useSent } from "./profile";

interface PersonEntryProps {
  person: Person;
  /** Position in a ranked list (1, 2, 3). Left out on pages that are not ranked. */
  rank?: number;
  /** The AI's one-sentence reason. Left out, or null, when there is none. */
  reason?: string | null;
  /** Pieces of the reason to show in bold. */
  keyPhrases?: string[];
  /** Position in the list (0, 1, 2), used to stagger the entrance. */
  index?: number;
  onAsk: () => void;
}

/** "2028" → "class of 2028"; anything else is shown the way it was typed. */
function formatGradYear(gradYear: string): string {
  return /^\d{4}$/.test(gradYear) ? `class of ${gradYear}` : gradYear;
}

/** "CSCI 103L", "csci  103l" → "CSCI 103L", so codes typed two ways still match. */
function sameCode(a: string, b: string): boolean {
  const tidy = (code: string) => code.trim().replace(/\s+/g, " ").toUpperCase();
  return tidy(a) === tidy(b);
}

/** An ISO date → "Nov 14", in the person's own time zone. */
function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * The reason with its key phrases in bold. The sentence is cut at each key
 * phrase, so only words that are really in the sentence can become bold.
 */
function Reason({ text, keyPhrases }: { text: string; keyPhrases: string[] }) {
  // Find where each phrase sits in the sentence, in reading order.
  const marks = keyPhrases
    .map((phrase) => ({ start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length }))
    .filter((mark) => mark.start !== -1)
    .sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let position = 0;
  for (const mark of marks) {
    if (mark.start < position) continue; // overlaps the previous phrase
    parts.push(text.slice(position, mark.start));
    parts.push(<strong key={mark.start} className="font-bold">{text.slice(mark.start, mark.end)}</strong>);
    position = mark.end;
  }
  parts.push(text.slice(position));

  return <p className="mt-2 text-lg leading-snug">{parts}</p>;
}

/** One person on the roster: who they are, what they took, and how to ask them. */
export function PersonEntry({ person, rank, reason, keyPhrases = [], index = 0, onAsk }: PersonEntryProps) {
  const details = [person.major, formatGradYear(person.grad_year)].filter(Boolean).join(", ");
  const course = [`${person.code} ${person.title}`.trim(), person.semester, person.professor]
    .filter(Boolean)
    .join(", ");

  // The Sent list is newest first, so this is the latest request to this
  // person about this course, if there is one.
  const lastAsked = useSent().find((sent) => sent.person_id === person.person_id && sameCode(sent.code, person.code));
  const askedOn = lastAsked ? shortDate(lastAsked.sent_at) : "";
  // What the reader ticked about themselves at onboarding or on /account.
  const mine = useProfile().profile?.about ?? [];

  return (
    <li
      className={`rise border-b border-rule py-6 ${rank ? "sm:grid sm:grid-cols-[4.5rem_1fr] sm:gap-4" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* The gold block is the lit roster row: it marks a match. */}
      {rank && (
        <div className="mb-3 inline-flex h-11 w-14 items-center justify-center bg-gold font-display text-2xl font-bold tabular-nums sm:mb-0">
          {String(rank).padStart(2, "0")}
        </div>
      )}

      <div>
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-2xl font-bold uppercase">{person.first_name}</span>
          {details && <span className="text-graphite">{details}</span>}
        </p>

        {reason && <Reason text={reason} keyPhrases={keyPhrases} />}

        <p className="mt-2 text-sm text-graphite">{course}</p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {person.help_tags.map((tag) => (
            <li key={tag} className="border border-ink/25 px-2 py-0.5 text-xs">
              {tag}
            </li>
          ))}
          {/* Something this person has in common with the reader is lit in
              gold and says so, so the shared path is seen at a glance. */}
          {person.about_tags.map((tag) =>
            mine.includes(tag) ? (
              <li key={tag} className="border border-ink bg-gold px-2 py-0.5 text-xs font-semibold">
                {tag}, like you
              </li>
            ) : (
              <li key={tag} className="border border-ink/25 px-2 py-0.5 text-xs">
                {tag}
              </li>
            ),
          )}
          {person.source === "demo" && (
            <li className="border border-dashed border-ink/40 px-2 py-0.5 text-xs text-graphite">Demo profile</li>
          )}
        </ul>

        {person.note && <p className="mt-3 text-sm text-graphite">&ldquo;{person.note}&rdquo;</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={onAsk}
            className="min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper motion-reduce:transition-none"
          >
            {lastAsked ? `Ask ${person.first_name} again` : `Ask ${person.first_name}`}
          </button>
          {askedOn && (
            <p className="text-sm text-graphite">
              You asked on <time dateTime={lastAsked?.sent_at}>{askedOn}</time>.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
