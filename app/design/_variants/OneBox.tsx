"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 8, "One Box" (simple).
// The idea: it works like a search engine, which everyone already knows how to
// use. A name, one box in the middle of the page, and nothing else. The people
// come back as a plain list of results: the AI's reason is the result's title.
// Type: DM Serif Display (the name only) + Figtree (everything else).

export function OneBox() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();
  const asked = s.phase !== "idle";

  return (
    <div className="design-root bg-white text-[#1f1f1f]">
      {/* Before a search the box sits a third of the way down; afterwards it moves up. */}
      <main className={`mx-auto max-w-2xl px-5 pb-16 transition-[padding] duration-200 ease-out ${asked ? "pt-8" : "pt-[16vh]"}`}>
        <form onSubmit={s.submit}>
          <p className={`d-display text-center transition-[font-size] duration-200 ease-out ${asked ? "text-2xl" : "text-5xl sm:text-6xl"}`}>
            Tommy&rsquo;s <span className="text-[#990000]">Roster</span>
          </p>
          <h1 className={`text-center text-[#5f6368] ${asked ? "sr-only" : "mt-4 text-lg"}`}>
            <label htmlFor="q8">Describe what you&rsquo;re trying to figure out</label>
          </h1>

          <div className="mt-6 rounded-[1.75rem] border border-[#dadce0] bg-white p-2 pl-5 transition-shadow duration-150 focus-within:border-transparent focus-within:shadow-[0_1px_8px_rgba(32,33,36,0.28)] hover:shadow-[0_1px_8px_rgba(32,33,36,0.2)]">
            <div className="flex items-end gap-2">
              <textarea
                id="q8"
                required
                rows={2}
                maxLength={300}
                value={s.question}
                onChange={(e) => s.setQuestion(e.target.value)}
                placeholder="I'm taking the class next semester and I'm worried about…"
                className="block min-h-14 flex-1 resize-none bg-transparent py-2 text-lg leading-snug placeholder:text-[#70757a] focus:outline-none"
              />
              <button
                type="submit"
                disabled={s.phase === "loading"}
                className="h-12 shrink-0 rounded-full bg-[#990000] px-6 font-semibold text-white transition-opacity duration-150 disabled:opacity-70"
              >
                {s.phase === "loading" ? "Finding…" : "Find people"}
              </button>
            </div>
          </div>

          {!asked && (
            <>
              <ul className="mt-5 flex flex-col items-center">
                {EXAMPLES.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => s.setQuestion(example)}
                      className="min-h-11 text-center text-[#5f6368] underline decoration-[#dadce0] underline-offset-4 transition-colors duration-150 hover:text-[#1f1f1f] hover:decoration-[#1f1f1f]"
                    >
                      {example}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="text-center">
                <button type="button" onClick={s.toggleOptional} aria-expanded={s.optionalOpen} className="min-h-11 text-sm font-medium text-[#1f1f1f]">
                  {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
                </button>
              </div>
              {s.optionalOpen && (
                <div className="d-fade mx-auto grid max-w-sm grid-cols-2 gap-3">
                  <label className="text-sm text-[#5f6368]">
                    Major
                    <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full rounded-full border border-[#dadce0] px-4 text-base text-[#1f1f1f]" />
                  </label>
                  <label className="text-sm text-[#5f6368]">
                    Grad year
                    <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full rounded-full border border-[#dadce0] px-4 text-base text-[#1f1f1f]" />
                  </label>
                </div>
              )}
            </>
          )}
        </form>

        <section ref={resultsRef} aria-live="polite" className="scroll-mt-4">
          {s.phase === "loading" && (
            <div role="status" className="mt-8">
              <span className="sr-only">Finding people…</span>
              {/* A thin line moving under the box, then grey lines where results will be. */}
              <div className="relative h-0.5 overflow-hidden bg-[#f1f3f4]">
                <span className="d-sweep absolute inset-y-0 left-0 w-1/2 bg-[#990000]" />
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="mt-8">
                  <div className="h-5 w-11/12 rounded bg-[#f1f3f4]" />
                  <div className="mt-2 h-5 w-2/3 rounded bg-[#f1f3f4]" />
                  <div className="mt-3 h-3.5 w-1/2 rounded bg-[#f1f3f4]" />
                </div>
              ))}
            </div>
          )}

          {s.phase === "done" && (
            <>
              <p className="mt-8 border-b border-[#ebebeb] pb-3 text-sm text-[#5f6368]">3 people, best match first</p>
              <ol>
                {MATCHES.map((m, i) => (
                  <li key={m.first_name} className="d-fade border-b border-[#ebebeb] py-6" style={{ "--i": i } as React.CSSProperties}>
                    <p className="flex items-center gap-2 text-sm text-[#5f6368]">
                      {/* The gold dot marks a match. */}
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-[#FFCC00]" />
                      {m.first_name}, {m.major}, class of {m.grad_year}
                    </p>
                    <p className="mt-1.5 text-[1.35rem] leading-snug font-semibold">{m.reason}</p>
                    <p className="mt-2 text-[#5f6368]">
                      {m.code} {m.title}, {m.semester}, {m.professor}
                    </p>
                    <p className="mt-1 text-[#5f6368]">&ldquo;{m.note}&rdquo;</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="rounded-full bg-[#f1f3f4] px-2.5 py-1 text-xs">{tag}</li>
                      ))}
                      <li className="px-1 py-1 text-xs text-[#5f6368]">Demo profile</li>
                    </ul>
                    <button type="button" className="mt-4 min-h-11 rounded-full border border-[#1f1f1f] px-5 font-semibold transition-colors duration-150 hover:bg-[#1f1f1f] hover:text-white">
                      Ask {m.first_name}
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <p className="mt-12 text-center text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All ten designs</Link>
        </p>
      </main>
    </div>
  );
}
