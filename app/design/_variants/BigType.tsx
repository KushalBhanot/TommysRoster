"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 10, "Big Type" (simple).
// The idea: say one thing, very large. A huge headline, one soft grey field,
// one button. No borders, no shadows, no lines: space and size do the work.
// The people are three quiet grey tiles side by side, each led by the reason.
// Type: Inter Tight (headline and reasons) + Inter (everything else).

export function BigType() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-white text-[#1d1d1f]">
      <header className="mx-auto max-w-5xl px-5 pt-5">
        <span className="text-sm font-semibold">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-12 pb-16 sm:pt-24">
        <form onSubmit={s.submit} className="mx-auto max-w-3xl text-center">
          <h1 className="d-display text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
            <label htmlFor="q10">Describe what you&rsquo;re trying to figure out.</label>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-xl text-[#6e6e73]">
            Get matched with up to three students who already took the class.
          </p>

          <textarea
            id="q10"
            required
            rows={3}
            maxLength={300}
            value={s.question}
            onChange={(e) => s.setQuestion(e.target.value)}
            placeholder="I'm taking the class next semester and I'm worried about…"
            className="mt-9 block w-full resize-none rounded-3xl bg-[#f5f5f7] px-6 py-5 text-left text-xl leading-snug placeholder:text-[#6e6e73] sm:text-2xl"
          />

          <ul className="mt-4 flex flex-wrap justify-center gap-2">
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

          <button type="button" onClick={s.toggleOptional} aria-expanded={s.optionalOpen} className="mt-2 min-h-11 text-sm text-[#6e6e73] underline underline-offset-4">
            {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
          </button>
          {s.optionalOpen && (
            <div className="d-fade mx-auto grid max-w-md grid-cols-2 gap-3 text-left">
              <label className="text-sm text-[#6e6e73]">
                Major
                <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-12 w-full rounded-2xl bg-[#f5f5f7] px-4 text-base text-[#1d1d1f]" />
              </label>
              <label className="text-sm text-[#6e6e73]">
                Grad year
                <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-12 w-full rounded-2xl bg-[#f5f5f7] px-4 text-base text-[#1d1d1f]" />
              </label>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={s.phase === "loading"}
              className="min-h-13 w-full rounded-full bg-[#990000] px-10 text-lg font-semibold text-white transition-opacity duration-150 disabled:opacity-70 sm:w-auto"
            >
              {s.phase === "loading" ? "Finding people…" : "Find people"}
            </button>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-16 scroll-mt-6 sm:mt-24">
          {s.phase === "loading" && (
            <div role="status" className="grid gap-4 sm:grid-cols-3">
              <span className="sr-only">Finding people…</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="d-rise relative h-64 overflow-hidden rounded-3xl bg-[#f5f5f7]" style={{ "--i": i } as React.CSSProperties}>
                  {/* A soft band of light crosses each empty tile while it waits. */}
                  <span className="d-sweep absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {s.phase === "done" && (
            <ol className="grid gap-4 sm:grid-cols-3">
              {MATCHES.map((m, i) => (
                <li key={m.first_name} className="d-rise flex flex-col rounded-3xl bg-[#f5f5f7] p-6" style={{ "--i": i } as React.CSSProperties}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-[#FFCC00]" />
                    {i === 0 ? "Best match" : `Match ${i + 1}`}
                  </p>
                  <p className="d-display mt-3 text-[1.5rem] leading-[1.2] font-semibold tracking-tight">{m.reason}</p>

                  <p className="mt-6 text-lg font-semibold">{m.first_name}</p>
                  <p className="text-[#6e6e73]">{m.major}, class of {m.grad_year}</p>
                  <p className="mt-2 text-sm text-[#6e6e73]">{m.code} {m.title}</p>
                  <p className="text-sm text-[#6e6e73]">{m.semester}, {m.professor}</p>

                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {[...m.help_tags, ...m.about_tags].map((tag) => (
                      <li key={tag} className="rounded-full bg-white px-3 py-1 text-xs">{tag}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-[#6e6e73]">&ldquo;{m.note}&rdquo;</p>

                  <div className="mt-auto pt-6">
                    <button type="button" className="min-h-12 w-full rounded-full bg-[#1d1d1f] font-semibold text-white transition-colors duration-150 hover:bg-black">
                      Ask {m.first_name}
                    </button>
                    <p className="mt-3 text-center text-xs text-[#6e6e73]">Demo profile</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="mt-14 text-center text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All designs</Link>
        </p>
      </main>
    </div>
  );
}
