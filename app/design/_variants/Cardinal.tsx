"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 5, "Cardinal".
// The idea: a poster. The whole first screen is cardinal with one white box
// in it. Once you ask, the poster folds down to a bar that keeps your question
// in view, and white match cards rise over its bottom edge.
// Type: Archivo Black (headline, names) + Archivo (everything else).

export function Cardinal() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();
  const asked = s.phase !== "idle";

  return (
    <div ref={resultsRef as React.RefObject<HTMLDivElement>} className="design-root bg-white text-black">
      {/* On cardinal, the focus ring is white so it stays visible. */}
      <div
        className={`bg-[#990000] text-white transition-[padding,min-height] duration-200 ease-out ${
          asked ? "min-h-0 pb-14" : "min-h-[88dvh] pb-12 sm:pb-20"
        }`}
        style={{ "--ring": "#ffffff" } as React.CSSProperties}
      >
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-5">
          <span className="d-display text-base tracking-wide uppercase">Tommy&rsquo;s Roster</span>
        </header>

        <form onSubmit={s.submit} className={`mx-auto max-w-3xl px-5 transition-[padding] duration-200 ease-out ${asked ? "pt-5" : "pt-12 sm:pt-20"}`}>
          <h1
            className={`d-display leading-[1.02] uppercase transition-[font-size] duration-200 ease-out ${
              asked ? "text-xl sm:text-2xl" : "text-[2.6rem] sm:text-7xl"
            }`}
          >
            <label htmlFor="q5">Describe what you&rsquo;re trying to figure out</label>
          </h1>
          {!asked && (
            <p className="mt-4 max-w-xl text-lg text-white/90">
              We&rsquo;ll match you with up to three USC students who already took the class.
            </p>
          )}

          {/* One white box holds the question and the one action. */}
          <div className={`bg-white text-black ${asked ? "mt-3" : "mt-8"}`}>
            <textarea
              id="q5"
              required
              rows={asked ? 2 : 3}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="block w-full resize-none bg-transparent px-4 pt-4 text-xl leading-snug font-medium placeholder:font-normal placeholder:text-[#6b6b6b] focus:outline-none sm:px-5 sm:text-2xl"
              style={{ "--ring": "#990000" } as React.CSSProperties}
            />
            <div className="flex justify-end p-2" style={{ "--ring": "#000000" } as React.CSSProperties}>
              <button
                type="submit"
                disabled={s.phase === "loading"}
                className="d-display min-h-12 w-full bg-[#990000] px-8 text-base tracking-wide text-white uppercase transition-opacity duration-150 disabled:opacity-70 sm:w-auto"
              >
                {s.phase === "loading" ? "Finding people…" : "Find people"}
              </button>
            </div>
          </div>

          {!asked && (
            <>
              <ul className="mt-4 flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => s.setQuestion(example)}
                      className="min-h-11 border border-white/70 px-3 text-left text-sm font-medium transition-colors duration-150 hover:bg-white hover:text-[#990000]"
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
                className="mt-3 min-h-11 text-sm font-medium underline underline-offset-4"
              >
                {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
              </button>
              {s.optionalOpen && (
                <div className="d-fade grid max-w-md grid-cols-2 gap-3">
                  <label className="text-sm font-medium">
                    Major
                    <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full bg-white px-3 text-base text-black" />
                  </label>
                  <label className="text-sm font-medium">
                    Grad year
                    <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full bg-white px-3 text-base text-black" />
                  </label>
                </div>
              )}
            </>
          )}
        </form>
      </div>

      {/* The results sit on white and overlap the bottom edge of the poster. */}
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section aria-live="polite">
          {s.phase === "loading" && (
            <div role="status" className="-mt-9 space-y-4">
              <span className="sr-only">Finding people…</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="d-rise relative h-32 overflow-hidden border-2 border-black bg-white" style={{ "--i": i } as React.CSSProperties}>
                  {/* A gold line crosses the top of each card while it waits. */}
                  <span className="d-sweep absolute top-0 left-0 h-1.5 w-full bg-[#FFCC00]" />
                </div>
              ))}
            </div>
          )}

          {s.phase === "done" && (
            <ol className="-mt-9 space-y-4">
              {MATCHES.map((m, i) => (
                <li key={m.first_name} className="d-rise border-2 border-black bg-white" style={{ "--i": i } as React.CSSProperties}>
                  <p className="d-display inline-block bg-[#FFCC00] px-3 py-1.5 text-xs tracking-wide uppercase">
                    {i === 0 ? "Best match" : `Match ${i + 1}`}
                  </p>
                  <div className="px-4 pt-3 pb-5 sm:px-6">
                    <p className="text-[1.4rem] leading-snug font-bold sm:text-[1.7rem]">{m.reason}</p>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t-2 border-black pt-4">
                      <div>
                        <p className="d-display text-2xl uppercase">{m.first_name}</p>
                        <p className="font-medium">{m.major}, class of {m.grad_year}</p>
                        <p className="mt-1 text-sm text-[#444]">{m.code} {m.title}, {m.semester}, {m.professor}</p>
                      </div>
                      <button type="button" className="d-display min-h-12 bg-black px-6 text-base tracking-wide text-white uppercase transition-colors duration-150 hover:bg-[#990000]">
                        Ask {m.first_name}
                      </button>
                    </div>

                    <p className="mt-4 text-sm text-[#444]">&ldquo;{m.note}&rdquo;</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="border border-black px-2 py-0.5 text-xs font-medium">{tag}</li>
                      ))}
                      <li className="border border-dashed border-black/60 px-2 py-0.5 text-xs text-[#444]">Demo profile</li>
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="mt-12 text-sm font-medium">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All ten designs</Link>
        </p>
      </main>
    </div>
  );
}
