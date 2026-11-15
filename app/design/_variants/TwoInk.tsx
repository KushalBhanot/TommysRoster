"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 7, "Two Ink" (artistic).
// The idea: a risograph zine. A riso printer lays down one ink at a time, so
// everything on this page is either cardinal or gold on off-white paper:
// no black, no grey. The gold layer sits a few pixels off from the cardinal
// one, the way a second pass never lines up exactly, and shading is done with
// halftone dots instead of tints.
// Type: Syne (headline, reasons, buttons) + Space Mono (everything typed).

// A field of cardinal dots, used wherever a printer would use a tint.
const HALFTONE = "radial-gradient(#990000 32%, transparent 34%)";

export function TwoInk() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root d-grain relative overflow-x-clip bg-[#f5f0e6] text-[#990000]">
      {/* Printed shapes behind the type: a gold sun and a band of halftone dots. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] overflow-hidden">
        <div className="absolute -top-16 -right-20 size-72 rounded-full bg-[#FFCC00] sm:right-[8%] sm:size-96" />
        <div
          className="absolute top-44 -right-6 h-40 w-64 sm:right-[4%] sm:w-96"
          style={{ backgroundImage: HALFTONE, backgroundSize: "9px 9px", maskImage: "linear-gradient(to left, black, transparent)" }}
        />
      </div>

      <header className="relative mx-auto flex max-w-4xl items-baseline justify-between gap-4 px-5 pt-6">
        <span className="d-display text-lg font-extrabold uppercase">Tommy&rsquo;s Roster</span>
        <span className="text-xs">Issue 01, two inks</span>
      </header>

      <main className="relative mx-auto max-w-4xl px-5 pt-12 pb-20 sm:pt-20">
        <form onSubmit={s.submit}>
          {/* The gold shadow is the second ink, printed a little out of register. */}
          <h1 className="d-display max-w-4xl text-[2.35rem] leading-none font-extrabold [text-shadow:3px_3px_0_#FFCC00] sm:text-[4.25rem] sm:[text-shadow:5px_5px_0_#FFCC00]">
            <label htmlFor="q7">Describe what you&rsquo;re trying to figure out</label>
          </h1>
          <p className="mt-5 max-w-md">
            Up to three students who already took the class will be printed below.
          </p>

          <div className="mt-8 max-w-2xl">
            <textarea
              id="q7"
              required
              rows={3}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="block w-full resize-none border-[3px] border-[#990000] bg-[#f5f0e6] px-4 py-3 text-lg leading-snug font-bold text-[#990000] placeholder:font-normal placeholder:text-[#990000]/75 sm:text-xl"
            />

            <ul className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => s.setQuestion(example)}
                    className="min-h-11 border-2 border-dashed border-[#990000] px-3 text-left text-sm transition-colors duration-150 hover:bg-[#FFCC00]"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>

            <button type="button" onClick={s.toggleOptional} aria-expanded={s.optionalOpen} className="mt-2 min-h-11 text-sm underline underline-offset-4">
              {s.optionalOpen ? "- hide your major and year" : "+ add your major and year"}
            </button>
            {s.optionalOpen && (
              <div className="d-fade grid max-w-md grid-cols-2 gap-3">
                <label className="text-sm">
                  Major
                  <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full border-2 border-[#990000] bg-[#f5f0e6] px-3 text-base text-[#990000]" />
                </label>
                <label className="text-sm">
                  Grad year
                  <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full border-2 border-[#990000] bg-[#f5f0e6] px-3 text-base text-[#990000]" />
                </label>
              </div>
            )}

            <div className="mt-5">
              {/* Pressing the button pushes it onto its gold shadow. */}
              <button
                type="submit"
                disabled={s.phase === "loading"}
                className="d-display min-h-13 w-full bg-[#990000] px-8 text-lg font-extrabold text-[#f5f0e6] uppercase shadow-[5px_5px_0_#FFCC00] transition-[transform,box-shadow] duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_#FFCC00] disabled:opacity-80 sm:w-auto"
              >
                {s.phase === "loading" ? "Printing…" : "Find people"}
              </button>
            </div>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-16 scroll-mt-6">
          {s.phase === "loading" && (
            <div role="status">
              <p className="text-sm font-bold uppercase">Printing three pages: gold first, then cardinal</p>
              <div className="mt-5 space-y-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative h-24 max-w-2xl">
                    {/* Pass one lays down the gold block, pass two the cardinal outline. */}
                    <div className="d-print absolute inset-0 translate-x-2 translate-y-2 bg-[#FFCC00]" style={{ "--i": i } as React.CSSProperties} />
                    <div className="d-fade absolute inset-0 border-[3px] border-[#990000]" style={{ "--i": i + 4 } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.phase === "done" && (
            <ol className="max-w-2xl space-y-10">
              {MATCHES.map((m, i) => (
                <li
                  key={m.first_name}
                  className="d-rise relative"
                  style={{ "--i": i, rotate: i % 2 === 0 ? "-0.5deg" : "0.5deg" } as React.CSSProperties}
                >
                  {/* The gold pass, off register, behind the cardinal page. */}
                  <div aria-hidden="true" className="absolute inset-0 translate-x-2 translate-y-2 bg-[#FFCC00]" />

                  <div className="relative border-[3px] border-[#990000] bg-[#f5f0e6] px-4 pt-3 pb-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* A gold numeral with a cardinal outline: two inks, one figure. */}
                      <span
                        aria-hidden="true"
                        className="d-display text-[5.5rem] leading-none font-extrabold text-[#FFCC00]"
                        style={{ WebkitTextStroke: "3px #990000" }}
                      >
                        {i + 1}
                      </span>
                      {/* A halftone portrait: a gold disc, a disc of dots a little off it, an initial. */}
                      <span aria-hidden="true" className="relative mt-3 size-16 shrink-0">
                        <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full" style={{ backgroundImage: HALFTONE, backgroundSize: "6px 6px" }} />
                        <span className="d-display absolute inset-0 flex items-center justify-center rounded-full bg-[#FFCC00] text-3xl font-extrabold">
                          {m.first_name[0]}
                        </span>
                      </span>
                    </div>

                    <p className="d-display mt-2 text-[1.5rem] leading-[1.15] font-bold sm:text-[1.85rem]">{m.reason}</p>

                    <p className="mt-5 text-sm font-bold uppercase">
                      {m.first_name}, {m.major}, class of {m.grad_year}
                    </p>
                    <p className="mt-1 text-sm">
                      {m.code} {m.title}, {m.semester}, {m.professor}
                    </p>
                    <p className="mt-3 text-sm italic">&ldquo;{m.note}&rdquo;</p>

                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="border-[1.5px] border-[#990000] px-2 py-0.5 text-xs">{tag}</li>
                      ))}
                      <li className="-rotate-2 border-[1.5px] border-dashed border-[#990000] px-2 py-0.5 text-xs font-bold uppercase">Demo profile</li>
                    </ul>

                    <button
                      type="button"
                      className="d-display mt-5 min-h-11 border-[3px] border-[#990000] px-6 font-extrabold uppercase transition-colors duration-150 hover:bg-[#990000] hover:text-[#f5f0e6]"
                    >
                      Ask {m.first_name}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="mt-16 text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All ten designs</Link>
        </p>
      </main>
    </div>
  );
}
