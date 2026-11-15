"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { prefersReducedMotion, useMockSearch } from "../_shared/useMockSearch";

// Design 11, "Shortlist".
// One idea carried all the way through: the logo is three bars with the
// middle one gold, so the interface is three rows with one gold marker.
// - The page is white and almost empty: a headline and one composed field.
// - The answer arrives in a single black panel, a "stage" for three people.
//   Cardinal is only ever used on white (the one action); gold is only ever
//   used on black (the marker), because that is where each looks best.
// - While it searches, the logo's three bars are the loader and the gold
//   marker steps through three empty rows.
// - In the results, the gold marker sits on the row you are reading. The best
//   match is open to begin with; choosing another row moves the marker there.
// Type: Instrument Sans (interface and the AI's reasons) + Newsreader italic
// (only for words a student wrote).

/** The logo: three bars. `gold` says which bar is lit (the middle one by default). */
function Mark({ gold = 1, onDark = false }: { gold?: number; onDark?: boolean }) {
  return (
    <span aria-hidden="true" className="inline-flex flex-col gap-[3px]">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={`h-[3px] w-[18px] rounded-full transition-colors duration-200 ${
            bar === gold ? "bg-[#FFCC00]" : onDark ? "bg-white/30" : "bg-black"
          }`}
        />
      ))}
    </span>
  );
}

export function Shortlist() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();
  // While searching, the gold marker steps through three empty rows: 0, 1, 2, 0, …
  const [scanRow, setScanRow] = useState(0);
  // In the results, the marker sits on the row that is open. The best match
  // (the first row) is open to begin with.
  const [openRow, setOpenRow] = useState(0);

  function find(event: React.FormEvent) {
    setScanRow(0);
    setOpenRow(0);
    s.submit(event);
  }

  // While searching, move the marker to the next row every quarter second.
  useEffect(() => {
    if (s.phase !== "loading" || prefersReducedMotion()) return;
    const id = setInterval(() => setScanRow((row) => (row + 1) % 3), 240);
    return () => clearInterval(id);
  }, [s.phase]);

  return (
    <div className="design-root bg-white text-black">
      <header className="mx-auto flex max-w-4xl items-center gap-2.5 px-5 pt-6">
        <Mark />
        <span className="text-[15px] font-semibold tracking-tight">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-20">
        <form onSubmit={find} className="pt-14 sm:pt-24">
          <h1 className="text-[2.6rem] leading-[1.03] font-semibold tracking-[-0.035em] text-balance sm:text-[4.5rem]">
            <label htmlFor="q11">Describe what you&rsquo;re trying to figure out.</label>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[#6e6e73] sm:text-xl">
            You&rsquo;ll get a shortlist of three students who already took the class.
          </p>

          {/* The composer: the field and its one action are a single object. */}
          <div className="mt-8 max-w-3xl rounded-[22px] border border-[#d2d2d7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)] transition-[border-color,box-shadow] duration-200 focus-within:border-black focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-16px_rgba(0,0,0,0.28)]">
            <textarea
              id="q11"
              required
              rows={3}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              // Cmd+Return (Mac) or Ctrl+Enter sends the question from inside the field.
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
              }}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="block w-full resize-none rounded-t-[22px] bg-transparent px-5 pt-5 text-xl leading-snug tracking-[-0.01em] placeholder:text-[#6e6e73] focus:outline-none sm:px-6 sm:text-[1.4rem]"
            />
            <div className="flex items-center justify-between gap-3 p-2.5 pl-5 sm:pl-6">
              <button
                type="button"
                onClick={s.toggleOptional}
                aria-expanded={s.optionalOpen}
                className="min-h-11 text-left text-sm text-[#6e6e73] transition-colors duration-150 hover:text-black"
              >
                {s.optionalOpen ? "Hide major and year" : "Add major and year"}
              </button>
              <div className="flex items-center gap-3">
                <kbd className="hidden rounded-md border border-[#d2d2d7] px-1.5 py-0.5 text-xs text-[#6e6e73] sm:inline" style={{ fontFamily: "inherit" }}>
                  ⌘ Return
                </kbd>
                <button
                  type="submit"
                  disabled={s.phase === "loading"}
                  className="h-11 rounded-full bg-[#990000] px-6 font-semibold text-white transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-70"
                >
                  {s.phase === "loading" ? "Finding…" : "Find people"}
                </button>
              </div>
            </div>
            {s.optionalOpen && (
              <div className="d-fade grid grid-cols-2 gap-2.5 border-t border-[#e8e8ed] p-2.5">
                <label className="text-xs text-[#6e6e73]">
                  <span className="pl-3">Major</span>
                  <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full rounded-2xl bg-[#f5f5f7] px-3.5 text-base text-black" />
                </label>
                <label className="text-xs text-[#6e6e73]">
                  <span className="pl-3">Grad year</span>
                  <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full rounded-2xl bg-[#f5f5f7] px-3.5 text-base text-black" />
                </label>
              </div>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => s.setQuestion(example)}
                  className="min-h-11 rounded-full bg-[#f5f5f7] px-4 text-left text-sm transition-colors duration-150 hover:bg-[#e8e8ed]"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </form>

        {/* The black stage. Inside it the focus ring is white. */}
        <section
          ref={resultsRef}
          aria-live="polite"
          className="scroll-mt-5"
          style={{ "--ring": "#ffffff" } as React.CSSProperties}
        >
          {s.phase !== "idle" && (
            <div className="d-settle mt-14 rounded-[28px] bg-black px-2 pt-2 pb-2 text-white shadow-[0_40px_70px_-40px_rgba(0,0,0,0.55)] sm:mt-20 sm:px-3">
              <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                <h2 className="text-sm font-semibold tracking-tight text-[#a1a1a6]" role={s.phase === "loading" ? "status" : undefined}>
                  {s.phase === "loading" ? "Finding people…" : "Your shortlist, best match first"}
                </h2>
                {/* The logo is the loader: its gold bar moves while the search runs. */}
                <Mark onDark gold={s.phase === "loading" ? scanRow : 1} />
              </div>

              {s.phase === "loading" && (
                <ul>
                  {[0, 1, 2].map((row) => (
                    <li key={row} className="relative border-t border-white/[0.12] px-4 py-7 sm:px-6">
                      <span className={`absolute top-5 bottom-5 left-0 w-[3px] rounded-full bg-[#FFCC00] transition-opacity duration-200 ${scanRow === row ? "opacity-100" : "opacity-0"}`} />
                      <div className={`h-5 rounded-full bg-white/[0.14] transition-opacity duration-200 ${scanRow === row ? "opacity-100" : "opacity-50"}`} style={{ width: `${[78, 64, 71][row]}%` }} />
                      <div className="mt-3 h-3.5 w-2/5 rounded-full bg-white/[0.08]" />
                    </li>
                  ))}
                </ul>
              )}

              {s.phase === "done" && (
                <ol>
                  {MATCHES.map((m, i) => {
                    const open = openRow === i;
                    return (
                      <li
                        key={m.first_name}
                        className={`d-settle relative rounded-[20px] transition-colors duration-200 ${open ? "bg-white/[0.07]" : ""}`}
                        style={{ "--i": i + 1 } as React.CSSProperties}
                      >
                        {/* A hairline above every row but the first, hidden next to the open row. */}
                        {i > 0 && (
                          <span
                            aria-hidden="true"
                            className={`absolute inset-x-4 top-0 h-px bg-white/[0.12] transition-opacity duration-200 sm:inset-x-6 ${open || openRow === i - 1 ? "opacity-0" : ""}`}
                          />
                        )}
                        {/* The gold marker: on the row that is open. */}
                        <span
                          aria-hidden="true"
                          className={`absolute top-6 bottom-6 left-0 w-[3px] origin-center rounded-full bg-[#FFCC00] transition-[transform,opacity] duration-200 ${open ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}`}
                        />

                        <div className="grid gap-x-6 px-4 pt-6 sm:grid-cols-[1fr_auto] sm:px-6">
                          {/* The row itself is a button: choosing it moves the marker here. */}
                          <button type="button" onClick={() => setOpenRow(i)} aria-expanded={open} className="grid grid-cols-[2.25rem_1fr] rounded-lg pb-6 text-left">
                            <span className="pt-1.5 text-sm font-medium text-[#8e8e93] tabular-nums">0{i + 1}</span>
                            <span>
                              {i === 0 && <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#FFCC00]">Best match</span>}
                              <span className="block text-[1.4rem] leading-[1.2] font-medium tracking-[-0.02em] text-balance sm:text-[1.75rem]">{m.reason}</span>
                              <span className="mt-3 block text-[15px] text-[#a1a1a6]">
                                <span className="font-semibold text-white">{m.first_name}</span>, {m.major}, class of {m.grad_year}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="mb-6 ml-9 h-11 justify-self-start rounded-full bg-white px-6 font-semibold text-black transition-transform duration-150 active:scale-[0.97] sm:mt-1 sm:ml-0"
                          >
                            Ask {m.first_name}
                          </button>
                        </div>

                        {/* Details open under the row that is open, and close under the others. */}
                        <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-6 pl-[3.25rem] text-[15px] text-[#a1a1a6] sm:px-6 sm:pl-[3.75rem]">
                              <p>
                                Took <span className="text-white">{m.code} {m.title}</span> in {m.semester} with {m.professor}.
                              </p>
                              {/* Serif italic: the student's own words. */}
                              <p className="d-display mt-3 text-[1.2rem] leading-snug text-white italic">&ldquo;{m.note}&rdquo;</p>
                              <ul className="mt-4 flex flex-wrap gap-1.5">
                                {[...m.help_tags, ...m.about_tags].map((tag) => (
                                  <li key={tag} className="rounded-full border border-white/20 px-2.5 py-1 text-xs text-[#e5e5ea]">{tag}</li>
                                ))}
                                <li className="px-1 py-1 text-xs text-[#8e8e93]">Demo profile</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </section>

        <p className="mt-12 text-sm text-[#6e6e73]">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All designs</Link>
        </p>
      </main>
    </div>
  );
}
