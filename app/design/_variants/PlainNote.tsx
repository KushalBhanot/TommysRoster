"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 9, "Plain Note" (simple).
// The idea: no interface to learn. The page reads top to bottom like a short
// note, in one column of comfortable text. The people come back as a numbered
// list written in full sentences, with no cards and no chips. The only color is
// the button, and a gold highlighter stroke on each name.
// Type: Source Serif 4 (the note itself) + Source Sans 3 (fields and buttons).

/** "A, B and C" from a list of tags, in lower case so it reads as a sentence. */
function sentence(tags: string[]): string {
  const items = tags.map((tag) => tag.charAt(0).toLowerCase() + tag.slice(1));
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function PlainNote() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-white text-[#1a1a1a]">
      <main className="d-display mx-auto max-w-xl px-5 pt-10 pb-16 text-[1.125rem] leading-relaxed sm:pt-16">
        <p className="d-text text-sm font-semibold">Tommy&rsquo;s Roster</p>

        <form onSubmit={s.submit} className="mt-8">
          <h1 className="text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
            <label htmlFor="q9">Describe what you&rsquo;re trying to figure out.</label>
          </h1>
          <p className="mt-3 text-[#4d4d4d]">
            Write it the way you&rsquo;d ask a friend. You&rsquo;ll get up to three students who
            already took the class.
          </p>

          <textarea
            id="q9"
            required
            rows={4}
            maxLength={300}
            value={s.question}
            onChange={(e) => s.setQuestion(e.target.value)}
            placeholder="I'm taking the class next semester and I'm worried about…"
            className="mt-5 block w-full resize-none rounded-md border border-[#8c8c8c] px-4 py-3 text-[1.2rem] leading-snug placeholder:text-[#737373]"
          />

          <p className="mt-4 text-[#4d4d4d]">For example:</p>
          <ul>
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button type="button" onClick={() => s.setQuestion(example)} className="flex min-h-11 items-center text-left underline underline-offset-4">
                  {example}
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={s.toggleOptional} aria-expanded={s.optionalOpen} className="d-text mt-2 min-h-11 text-base underline underline-offset-4">
            {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
          </button>
          {s.optionalOpen && (
            <div className="d-fade d-text grid max-w-sm grid-cols-2 gap-3 text-base">
              <label>
                Major
                <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full rounded-md border border-[#8c8c8c] px-3" />
              </label>
              <label>
                Grad year
                <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full rounded-md border border-[#8c8c8c] px-3" />
              </label>
            </div>
          )}

          <div className="mt-5">
            <button
              type="submit"
              disabled={s.phase === "loading"}
              className="d-text min-h-12 w-full rounded-md bg-[#990000] px-8 text-lg font-semibold text-white transition-opacity duration-150 disabled:opacity-70 sm:w-auto"
            >
              {s.phase === "loading" ? "Finding people…" : "Find people"}
            </button>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-12 scroll-mt-6">
          {s.phase === "loading" && (
            <p role="status" className="text-[#4d4d4d]">
              Finding people
              {[0, 1, 2].map((i) => (
                <span key={i} aria-hidden="true" className="d-dot" style={{ "--i": i } as React.CSSProperties}>.</span>
              ))}
            </p>
          )}

          {s.phase === "done" && (
            <>
              <h2 className="text-[1.5rem] font-semibold">Three people can help.</h2>
              <ol className="mt-2">
                {MATCHES.map((m, i) => (
                  <li key={m.first_name} className="d-fade border-t border-[#d9d9d9] py-7 first:border-t-0" style={{ "--i": i } as React.CSSProperties}>
                    <p className="text-[1.45rem] leading-snug font-semibold">
                      {i + 1}. {m.reason}
                    </p>
                    <p className="mt-3">
                      {/* The gold highlighter marks the person. */}
                      <mark className="bg-[#FFCC00] px-1 font-semibold text-[#1a1a1a]">{m.first_name}</mark> is a{" "}
                      {m.major} major, class of {m.grad_year}, who took {m.code} {m.title} in{" "}
                      {m.semester} with {m.professor}.
                    </p>
                    <p className="mt-2 text-[#4d4d4d]">
                      Can talk about {sentence(m.help_tags)}.
                      {m.about_tags.length > 0 && ` ${m.about_tags.join(", ")}.`}
                    </p>
                    <p className="mt-2 text-[#4d4d4d]">In their words: &ldquo;{m.note}&rdquo;</p>
                    <div className="d-text mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <button type="button" className="min-h-11 rounded-md border border-[#1a1a1a] px-5 text-base font-semibold transition-colors duration-150 hover:bg-[#1a1a1a] hover:text-white">
                        Ask {m.first_name}
                      </button>
                      <span className="text-sm text-[#4d4d4d]">Demo profile</span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <p className="d-text mt-10 text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All ten designs</Link>
        </p>
      </main>
    </div>
  );
}
