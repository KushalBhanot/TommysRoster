"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXAMPLES, MATCHES, ROSTER } from "../_shared/mock";
import { prefersReducedMotion, useMockSearch } from "../_shared/useMockSearch";

// Design 1, "Roster Board".
// The idea: the product is a roster, so show the roster. After you ask, a gold
// bar walks down the list of names; the three people who match stay gold, the
// rest fall away, and the matches open into full entries.
// Type: Barlow Condensed (names, numbers, headings) + Barlow (everything else).

const MATCH_NAMES = new Set(MATCHES.map((m) => m.first_name));
const STEP_MS = 200; // how long the gold bar rests on each row

export function RosterBoard() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();
  // Which roster row the gold bar is on while scanning (-1 = not started).
  const [scanRow, setScanRow] = useState(-1);

  // Scanning starts only when the form is sent (not in an effect), so the bar
  // always begins at the first row.
  function scan(event: React.FormEvent) {
    setScanRow(prefersReducedMotion() ? ROSTER.length : 0);
    s.submit(event);
  }

  // While loading, move the bar down one row at a time.
  useEffect(() => {
    if (s.phase !== "loading" || scanRow >= ROSTER.length) return;
    const id = setTimeout(() => setScanRow((row) => row + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [s.phase, scanRow]);

  return (
    <div className="design-root bg-white text-black">
      {/* Wordmark: three bars with the middle one gold, like a highlighted roster row. */}
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-5 pt-6">
        <span aria-hidden="true" className="flex flex-col gap-[3px]">
          <span className="h-[5px] w-7 bg-[#990000]" />
          <span className="h-[5px] w-7 bg-[#FFCC00]" />
          <span className="h-[5px] w-7 bg-[#990000]" />
        </span>
        <span className="d-display text-xl font-semibold tracking-wide uppercase">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:pt-16">
        <form onSubmit={scan}>
          <h1 className="d-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">
            <label htmlFor="q1">Who on the roster can answer this?</label>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[#4a4a4a]">
            Describe what you&rsquo;re trying to figure out. We&rsquo;ll scan the students who took
            the class and pull up to three who can help.
          </p>

          <textarea
            id="q1"
            required
            rows={3}
            maxLength={300}
            value={s.question}
            onChange={(e) => s.setQuestion(e.target.value)}
            placeholder="I'm taking the class next semester and I'm worried about…"
            className="mt-7 block w-full resize-none border-2 border-black bg-white px-4 py-3 text-xl leading-snug placeholder:text-[#767676] focus:border-[#990000]"
          />

          <ul className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => s.setQuestion(example)}
                  className="min-h-11 border border-black/30 px-3 text-left text-sm transition-colors duration-150 hover:border-black"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={s.toggleOptional}
            aria-expanded={s.optionalOpen}
            className="mt-4 min-h-11 text-sm font-medium underline underline-offset-4"
          >
            {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
          </button>
          {s.optionalOpen && (
            <div className="d-fade mt-1 grid max-w-md grid-cols-2 gap-3">
              <label className="text-sm">
                Major
                <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full border border-black/40 px-3 text-base" />
              </label>
              <label className="text-sm">
                Grad year
                <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full border border-black/40 px-3 text-base" />
              </label>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={s.phase === "loading"}
              className="d-display min-h-12 w-full bg-[#990000] px-8 text-xl font-semibold tracking-wide text-white uppercase transition-opacity duration-150 disabled:opacity-70 sm:w-auto"
            >
              {s.phase === "loading" ? "Scanning…" : "Scan the roster"}
            </button>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-12 scroll-mt-6">
          {s.phase === "loading" && (
            <div role="status">
              <p className="d-display text-lg font-semibold tracking-wide uppercase">Scanning the roster</p>
              <ol className="mt-3 border-t-2 border-black">
                {ROSTER.map((person, row) => {
                  const passed = row < scanRow;
                  const lit = row === scanRow || (passed && MATCH_NAMES.has(person.first_name));
                  return (
                    <li
                      key={person.first_name}
                      className={`flex items-baseline gap-4 border-b border-black/15 px-3 py-2.5 transition-colors duration-200 ${
                        lit ? "bg-[#FFCC00]" : ""
                      } ${passed && !lit ? "text-black/35" : ""}`}
                    >
                      <span className="d-display w-7 text-lg font-semibold tabular-nums">{String(row + 1).padStart(2, "0")}</span>
                      <span className="d-display text-xl font-semibold uppercase">{person.first_name}</span>
                      <span className="ml-auto truncate text-sm">{person.major}, {person.grad_year}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {s.phase === "done" && (
            <>
              <h2 className="d-display text-lg font-semibold tracking-wide uppercase">Three people who can help</h2>
              <ol className="mt-3 border-t-2 border-black">
                {MATCHES.map((m, i) => (
                  <li key={m.first_name} className="d-rise border-b border-black/15 py-6 sm:grid sm:grid-cols-[4.5rem_1fr] sm:gap-4" style={{ "--i": i } as React.CSSProperties}>
                    {/* The gold block is the "lit" roster row carried over from the scan. */}
                    <div className="d-display mb-3 inline-flex h-11 w-14 items-center justify-center bg-[#FFCC00] text-2xl font-bold tabular-nums sm:mb-0">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="text-xl leading-snug font-semibold sm:text-2xl">{m.reason}</p>
                      <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
                        <span className="d-display text-2xl font-bold uppercase">{m.first_name}</span>
                        <span className="text-[#4a4a4a]">{m.major}, class of {m.grad_year}</span>
                      </p>
                      <p className="mt-1 text-sm text-[#4a4a4a]">
                        {m.code} {m.title}, {m.semester}, {m.professor}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {[...m.help_tags, ...m.about_tags].map((tag) => (
                          <li key={tag} className="border border-black/25 px-2 py-0.5 text-xs">{tag}</li>
                        ))}
                        <li className="border border-dashed border-black/40 px-2 py-0.5 text-xs text-[#4a4a4a]">Demo profile</li>
                      </ul>
                      <p className="mt-3 text-sm text-[#4a4a4a]">&ldquo;{m.note}&rdquo;</p>
                      <button type="button" className="d-display mt-4 min-h-11 border-2 border-black px-5 text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-black hover:text-white">
                        Ask {m.first_name}
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <p className="mt-14 text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All five designs</Link>
        </p>
      </main>
    </div>
  );
}
