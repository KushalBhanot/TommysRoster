import type { Person } from "@/lib/courses";

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
          {[...person.help_tags, ...person.about_tags].map((tag) => (
            <li key={tag} className="border border-ink/25 px-2 py-0.5 text-xs">
              {tag}
            </li>
          ))}
          {person.source === "demo" && (
            <li className="border border-dashed border-ink/40 px-2 py-0.5 text-xs text-graphite">Demo profile</li>
          )}
        </ul>

        {person.note && <p className="mt-3 text-sm text-graphite">&ldquo;{person.note}&rdquo;</p>}

        <button
          type="button"
          onClick={onAsk}
          className="mt-4 min-h-11 cursor-pointer border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
        >
          Ask {person.first_name}
        </button>
      </div>
    </li>
  );
}
