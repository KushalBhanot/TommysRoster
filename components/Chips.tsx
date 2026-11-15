"use client";

/** A group of chips that can each be switched on or off. */
export function Chips({
  legend,
  hint,
  tags,
  chosen,
  onToggle,
}: {
  legend: string;
  hint: string;
  tags: readonly string[];
  chosen: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <fieldset className="mt-8">
      <legend className="font-medium">
        {legend} <span className="font-normal text-graphite">{hint}</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const on = chosen.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(tag)}
              // A chosen chip is filled black and gains a check mark, so the
              // state is not shown by color alone.
              className={`min-h-11 cursor-pointer border-2 border-ink px-3 text-left text-sm font-medium transition-colors duration-150 ${
                on ? "bg-ink text-paper" : "hover:bg-gold/40"
              }`}
            >
              {on && <span aria-hidden="true">✓ </span>}
              {tag}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Switch one tag on or off in a list, keeping at most `max` switched on. */
export function toggleTag(chosen: string[], tag: string, max: number): string[] {
  if (chosen.includes(tag)) return chosen.filter((t) => t !== tag);
  return chosen.length >= max ? chosen : [...chosen, tag];
}
