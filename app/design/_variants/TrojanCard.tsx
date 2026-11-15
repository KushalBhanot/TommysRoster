"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 2, "Trojan Card".
// The idea: each match is a person, so each match is an ID card. Three blank
// cards are "printed" while you wait, then the real ones are dealt onto the
// table one by one. The AI's reason sits where a photo caption would be.
// Type: Bricolage Grotesque (headline, reason, names) + IBM Plex Mono (the
// printed card data).

// A slight tilt for each card as it lands, like cards dealt by hand.
const TILT = ["-4deg", "3deg", "-2deg"];

export function TrojanCard() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-[#eef0f3] text-[#111827]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6">
        <span className="d-display text-lg font-bold">Tommy&rsquo;s Roster</span>
        <span className="d-text text-xs text-[#4b5563]">USC course help</span>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-10 pb-16 sm:pt-16">
        <form onSubmit={s.submit} className="mx-auto max-w-2xl">
          <h1 className="d-display text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
            <label htmlFor="q2">Describe what you&rsquo;re trying to figure out</label>
          </h1>
          <p className="d-display mt-3 text-lg text-[#4b5563]">
            You&rsquo;ll get up to three students who already took the class, one card each.
          </p>

          {/* The box looks like the slot a card is fed into. */}
          <div className="mt-7 rounded-3xl bg-white p-2 shadow-[0_1px_0_rgba(17,24,39,0.08),0_12px_32px_-12px_rgba(17,24,39,0.25)]">
            <textarea
              id="q2"
              required
              rows={3}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="d-display block w-full resize-none rounded-2xl px-4 py-3 text-xl leading-snug placeholder:text-[#6b7280]"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
              <button
                type="button"
                onClick={s.toggleOptional}
                aria-expanded={s.optionalOpen}
                className="d-text min-h-11 text-xs underline underline-offset-4"
              >
                {s.optionalOpen ? "- hide major and year" : "+ add your major and year"}
              </button>
              <button
                type="submit"
                disabled={s.phase === "loading"}
                className="d-display min-h-11 rounded-full bg-[#990000] px-6 font-semibold text-white transition-opacity duration-150 disabled:opacity-70"
              >
                {s.phase === "loading" ? "Printing cards…" : "Find my matches"}
              </button>
            </div>
            {s.optionalOpen && (
              <div className="d-fade grid grid-cols-2 gap-2 px-2 pb-2">
                <label className="d-text text-xs">
                  MAJOR
                  <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="d-display mt-1 block h-11 w-full rounded-xl border border-[#d1d5db] px-3 text-base" />
                </label>
                <label className="d-text text-xs">
                  GRAD YEAR
                  <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="d-display mt-1 block h-11 w-full rounded-xl border border-[#d1d5db] px-3 text-base" />
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
                  className="d-display min-h-11 rounded-full bg-white px-4 text-left text-sm shadow-[0_1px_0_rgba(17,24,39,0.1)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-12 scroll-mt-6">
          {s.phase === "loading" && (
            <div role="status">
              <p className="d-text text-center text-sm">PRINTING 3 CARDS…</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="d-pop relative h-56 overflow-hidden rounded-2xl border-2 border-dashed border-[#9ca3af] bg-white/50" style={{ "--i": i } as React.CSSProperties}>
                    {/* A gold line passes over each blank, like a card going through a printer. */}
                    <span className="d-sweep absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-[#FFCC00]/60 to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.phase === "done" && (
            <>
              <h2 className="d-text text-center text-sm">3 MATCHES, BEST FIRST</h2>
              <ol className="mt-5 grid gap-5 sm:grid-cols-3">
                {MATCHES.map((m, i) => (
                  <li
                    key={m.first_name}
                    className="d-deal flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(17,24,39,0.08),0_16px_36px_-16px_rgba(17,24,39,0.35)]"
                    style={{ "--i": i, "--tilt": TILT[i] } as React.CSSProperties}
                  >
                    {/* Card top: the cardinal band and the punched slot of a lanyard card. */}
                    <div className="relative bg-[#990000] px-4 pt-3 pb-4 text-white">
                      <span aria-hidden="true" className="absolute top-2.5 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[#eef0f3]" />
                      <div className="d-text mt-4 flex items-center justify-between text-[11px]">
                        <span>ROSTER CARD</span>
                        <span className="rounded bg-[#FFCC00] px-1.5 py-0.5 font-medium text-[#111827]">MATCH {i + 1}</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                      {/* The reason is the headline of the card. */}
                      <p className="d-display text-xl leading-snug font-semibold">{m.reason}</p>

                      <div className="mt-4 flex items-center gap-3">
                        <span aria-hidden="true" className="d-display flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#FFCC00] text-lg font-bold">
                          {m.first_name[0]}
                        </span>
                        <div>
                          <p className="d-display text-lg leading-tight font-bold">{m.first_name}</p>
                          <p className="d-display text-sm text-[#4b5563]">{m.major}, class of {m.grad_year}</p>
                        </div>
                      </div>

                      <dl className="d-text mt-4 space-y-1 text-xs">
                        <div className="flex gap-2"><dt className="w-14 shrink-0 text-[#4b5563]">COURSE</dt><dd>{m.code} {m.title}</dd></div>
                        <div className="flex gap-2"><dt className="w-14 shrink-0 text-[#4b5563]">TERM</dt><dd>{m.semester}</dd></div>
                        <div className="flex gap-2"><dt className="w-14 shrink-0 text-[#4b5563]">PROF</dt><dd>{m.professor}</dd></div>
                      </dl>

                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {[...m.help_tags, ...m.about_tags].map((tag) => (
                          <li key={tag} className="d-display rounded-full bg-[#eef0f3] px-2.5 py-1 text-xs">{tag}</li>
                        ))}
                      </ul>
                      <p className="d-display mt-3 text-sm text-[#4b5563]">&ldquo;{m.note}&rdquo;</p>

                      <div className="mt-auto pt-4">
                        <button type="button" className="d-display min-h-11 w-full rounded-full border-2 border-[#111827] font-semibold transition-colors duration-150 hover:bg-[#111827] hover:text-white">
                          Ask {m.first_name}
                        </button>
                        <p className="d-text mt-3 text-center text-[11px] text-[#4b5563]">DEMO PROFILE</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <p className="d-display mt-14 text-center text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All ten designs</Link>
        </p>
      </main>
    </div>
  );
}
