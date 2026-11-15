import type { Person } from "@/lib/courses";

interface PersonEntryProps {
  person: Person;
  /** The course this entry is about (the semester and professor belong to it). */
  code: string;
  /** Every course the person is signed up for; others are listed as "Also took". */
  courses?: string[];
  /** The AI's one-sentence reason. Left out, or null, when there is none. */
  reason?: string | null;
  /** Position in the list (0, 1, 2), used to stagger the entrance. */
  index?: number;
  onAsk: () => void;
}

/** "2028" → "class of 2028"; anything else is shown the way it was typed. */
function formatGradYear(gradYear: string): string {
  return /^\d{4}$/.test(gradYear) ? `class of ${gradYear}` : gradYear;
}

// One labelled line of the entry. The label sits above the value on a phone
// and beside it from the "sm" width up, so values line up like a roster.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sm:grid sm:grid-cols-[9.5rem_1fr] sm:gap-4">
      <dt className="text-sm text-graphite sm:pt-0.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** One person on the roster: who they are, what they took, and how to ask them. */
export function PersonEntry({ person, code, courses = [], reason, index = 0, onAsk }: PersonEntryProps) {
  const otherCourses = courses.filter((c) => c !== code);
  const details = [person.major, formatGradYear(person.grad_year)].filter(Boolean).join(", ");

  return (
    <li
      className="rise border-t border-rule py-8"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl font-semibold">{person.first_name}</h3>
        {person.open_to === "questions+coffee" && (
          <span className="inline-flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-gold" />
            Open to coffee chats
          </span>
        )}
      </div>
      {details && <p className="mt-1 text-graphite">{details}</p>}

      <dl className="mt-5 space-y-4">
        <Row label="Took">
          <span className="font-semibold">{code}</span>
          {person.semester && ` in ${person.semester}`}
          {person.professor && ` with ${person.professor}`}
        </Row>

        {otherCourses.length > 0 && <Row label="Also took">{otherCourses.join(", ")}</Row>}

        {person.can_help_with && (
          <Row label="Can help with">
            {/* Serif: these are the student's own words. */}
            <span className="font-serif text-lg leading-snug">{person.can_help_with}</span>
          </Row>
        )}

        {reason && <Row label="Why this match">{reason}</Row>}
      </dl>

      <button
        type="button"
        onClick={onAsk}
        className="mt-6 h-11 rounded-full border border-ink px-5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
      >
        Ask {person.first_name}
      </button>
    </li>
  );
}
