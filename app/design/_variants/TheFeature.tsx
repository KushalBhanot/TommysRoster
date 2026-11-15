"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 3, "The Feature".
// The idea: a magazine page. One very large serif headline, a lot of white
// space, and a single ruled line to write your question on. The matches are
// set like numbered pull quotes: the AI's reason is the quote, the person is
// the byline.
// Type: Bodoni Moda (headline, question, reasons) + Work Sans (everything else).

export function TheFeature() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-white text-black">
      <header className="mx-auto flex max-w-4xl items-baseline justify-between border-b border-black px-5 pt-6 pb-3">
        <span className="d-display text-xl font-semibold italic">Tommy&rsquo;s Roster</span>
        <span className="text-sm text-[#555]">Ask a Trojan who took it</span>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-20">
        <form onSubmit={s.submit} className="pt-14 sm:pt-24">
          <h1 className="d-display text-[2.75rem] leading-[1.02] font-medium tracking-tight text-balance sm:text-[5.25rem]">
            <label htmlFor="q3">Describe what you&rsquo;re trying to figure out.</label>
          </h1>

          <div className="mt-10 sm:mt-16 sm:ml-[25%]">
            {/* No box: one line to write on, like a form in a magazine. */}
            <textarea
              id="q3"
              required
              rows={2}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="d-display block w-full resize-none border-b-2 border-black bg-transparent pb-3 text-2xl leading-snug italic placeholder:text-[#767676] focus:border-[#990000] sm:text-3xl"
            />

            <ul className="mt-5 space-y-1">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => s.setQuestion(example)}
                    className="min-h-11 text-left text-[#555] underline decoration-black/25 underline-offset-4 transition-colors duration-150 hover:text-black hover:decoration-black"
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
              className="mt-2 min-h-11 text-sm font-medium"
            >
              {s.optionalOpen ? "Hide your major and year" : "Add your major and year, if you like"}
            </button>
            {s.optionalOpen && (
              <div className="d-fade mt-1 grid max-w-sm grid-cols-2 gap-6">
                <label className="text-sm text-[#555]">
                  Major
                  <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full border-b border-black bg-transparent text-base text-black" />
                </label>
                <label className="text-sm text-[#555]">
                  Grad year
                  <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full border-b border-black bg-transparent text-base text-black" />
                </label>
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={s.phase === "loading"}
                className="min-h-12 bg-[#990000] px-8 text-base font-medium text-white transition-opacity duration-150 disabled:opacity-70"
              >
                {s.phase === "loading" ? "Finding people…" : "Find people"}
              </button>
            </div>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-20 scroll-mt-8 sm:mt-28">
          {s.phase === "loading" && (
            <div role="status" className="sm:ml-[25%]">
              <p className="d-display text-2xl italic">Reading the roster…</p>
              {/* Three rules are drawn one after another: the page being set. */}
              <div className="mt-8 space-y-10">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="d-draw block h-px bg-black" style={{ "--i": i * 2 } as React.CSSProperties} />
                ))}
              </div>
            </div>
          )}

          {s.phase === "done" && (
            <ol>
              {MATCHES.map((m, i) => (
                <li key={m.first_name} className="grid gap-x-8 pb-16 sm:grid-cols-[25%_1fr]">
                  {/* The rule is drawn first, then the entry appears under it. */}
                  <span className="d-draw col-span-full mb-6 block h-px bg-black" style={{ "--i": i } as React.CSSProperties} />

                  <div className="d-fade" style={{ "--i": i + 1 } as React.CSSProperties}>
                    <p className="d-display text-6xl leading-none font-medium italic sm:text-7xl">{i + 1}</p>
                    <p className="mt-3 text-lg font-semibold">{m.first_name}</p>
                    <p className="text-sm text-[#555]">{m.major}</p>
                    <p className="text-sm text-[#555]">Class of {m.grad_year}</p>
                  </div>

                  <div className="d-fade mt-6 sm:mt-0" style={{ "--i": i + 1 } as React.CSSProperties}>
                    {/* A short gold bar marks the match; the reason is the pull quote. */}
                    <span aria-hidden="true" className="block h-1.5 w-14 bg-[#FFCC00]" />
                    <p className="d-display mt-4 text-[1.75rem] leading-[1.2] font-medium sm:text-[2.25rem]">{m.reason}</p>

                    <p className="mt-6 text-[#333]">
                      Took <span className="font-semibold">{m.code}</span> {m.title} in {m.semester} with {m.professor}.
                    </p>
                    <p className="mt-2 text-[#555]">
                      {m.first_name} says: &ldquo;{m.note}&rdquo;
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="border border-black/30 px-2 py-0.5 text-xs">{tag}</li>
                      ))}
                      <li className="px-1 py-0.5 text-xs text-[#555] italic">Demo profile</li>
                    </ul>
                    <button type="button" className="mt-6 min-h-11 border border-black px-6 font-medium transition-colors duration-150 hover:bg-black hover:text-white">
                      Ask {m.first_name}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="border-t border-black pt-4 text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All five designs</Link>
        </p>
      </main>
    </div>
  );
}
