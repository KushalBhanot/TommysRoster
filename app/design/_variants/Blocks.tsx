"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 12, "Blocks". Built from the ui-ux-pro-max skill's recommendations
// for a campus community product:
// - Style "Vibrant & Block-based": the page is a few large blocks of solid
//   color with big type, instead of one long column. Kept to the brand's two
//   colors plus black, and gold is still only the match highlight.
// - Pattern "Community landing": show proof that people are here (the roster
//   figures) next to the question, and start-from topics beside it.
// - Type pairing "Academic/Research": Crimson Pro (headline, reasons, and
//   students' own words) + Atkinson Hyperlegible (everything in the interface;
//   a typeface designed to be easy to read).
// - Its interaction rules: one primary action, a loading placeholder for
//   anything over 300ms, results staggered about 45ms apart, a small press
//   effect on buttons, and color named by role rather than by hex.

// Colors by role. Each value is used through its name below, never directly.
const TOKENS = {
  "--primary": "#990000",
  "--on-primary": "#ffffff",
  "--primary-deep": "#7d0000", // the geometric shape inside the primary block
  "--match": "#FFCC00",
  "--ink": "#141414",
  "--ink-soft": "#575757",
  "--surface": "#ffffff",
  "--block": "#f3f3f1", // quiet blocks
} as React.CSSProperties;

// Figures from the demo roster (data/demo-people.csv).
const ROSTER = [
  { figure: "45", label: "students on the roster" },
  { figure: "37", label: "courses" },
  { figure: "26", label: "departments" },
];

export function Blocks() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-(--surface) text-(--ink)" style={TOKENS}>
      <header className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <span className="text-[15px] font-bold">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-12 sm:gap-4">
          {/* Block 1, the hero: the question. White focus ring on the cardinal block. */}
          <form
            onSubmit={s.submit}
            className="relative overflow-hidden rounded-[28px] bg-(--primary) p-5 text-(--on-primary) sm:col-span-8 sm:row-span-2 sm:p-10"
            style={{ "--ring": "#ffffff" } as React.CSSProperties}
          >
            {/* One geometric shape, a quarter circle, gives the block its character. */}
            <span aria-hidden="true" className="absolute -right-24 -bottom-24 size-72 rounded-full bg-(--primary-deep) sm:size-96" />

            <div className="relative">
              <h1 className="d-display max-w-2xl text-[2.6rem] leading-[1.02] font-semibold tracking-tight sm:text-[4.25rem]">
                <label htmlFor="q12">Describe what you&rsquo;re trying to figure out</label>
              </h1>
              <p className="mt-3 max-w-md text-lg text-(--on-primary)/90">
                We&rsquo;ll match you with up to three students who already took the class.
              </p>

              {/* The field and its one action share a white panel. */}
              <div className="mt-7 rounded-3xl bg-(--surface) p-2 text-(--ink)" style={{ "--ring": "#990000" } as React.CSSProperties}>
                <textarea
                  id="q12"
                  required
                  rows={3}
                  maxLength={300}
                  value={s.question}
                  onChange={(e) => s.setQuestion(e.target.value)}
                  placeholder="I'm taking the class next semester and I'm worried about…"
                  className="block w-full resize-none rounded-2xl bg-transparent px-3 pt-3 text-xl leading-snug placeholder:text-(--ink-soft) focus:outline-none sm:px-4"
                />
                <div className="flex items-center justify-between gap-3 pl-3 sm:pl-4">
                  <button
                    type="button"
                    onClick={s.toggleOptional}
                    aria-expanded={s.optionalOpen}
                    className="min-h-11 cursor-pointer text-left text-sm text-(--ink-soft) underline underline-offset-4"
                  >
                    {s.optionalOpen ? "Hide major and year" : "Add major and year"}
                  </button>
                  <button
                    type="submit"
                    disabled={s.phase === "loading"}
                    className="h-12 cursor-pointer rounded-2xl bg-(--primary) px-6 text-lg font-bold text-(--on-primary) transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:cursor-default disabled:opacity-60"
                  >
                    {s.phase === "loading" ? "Finding…" : "Find people"}
                  </button>
                </div>
                {s.optionalOpen && (
                  <div className="d-fade mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-(--ink-soft)">
                      <span className="pl-2">Major</span>
                      <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full rounded-xl bg-(--block) px-3 text-base text-(--ink)" />
                    </label>
                    <label className="text-xs text-(--ink-soft)">
                      <span className="pl-2">Grad year</span>
                      <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full rounded-xl bg-(--block) px-3 text-base text-(--ink)" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Block 2: proof that people are here. */}
          <div className="rounded-[28px] bg-(--ink) p-5 text-(--surface) sm:col-span-4 sm:p-7">
            <dl className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-1">
              {ROSTER.map((item, i) => (
                <div key={item.label} className={i === 0 ? "" : "sm:flex sm:items-baseline sm:gap-2"}>
                  <dd className={`d-display leading-none font-semibold tabular-nums ${i === 0 ? "text-5xl sm:text-8xl" : "text-5xl sm:text-3xl"}`}>{item.figure}</dd>
                  <dt className={`mt-1 text-sm text-(--surface)/80 ${i === 0 ? "sm:mt-2 sm:mb-5 sm:text-base" : ""}`}>{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Block 3: places to start from. */}
          <div className="rounded-[28px] bg-(--block) p-5 sm:col-span-4 sm:p-7">
            <p className="font-bold">Not sure how to ask?</p>
            <ul className="mt-3 space-y-2">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => s.setQuestion(example)}
                    className="min-h-11 w-full cursor-pointer rounded-2xl bg-(--surface) px-4 py-2.5 text-left text-[15px] transition-colors duration-200 hover:bg-(--primary) hover:text-(--on-primary)"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section ref={resultsRef} aria-live="polite" className="scroll-mt-4">
          {s.phase === "loading" && (
            <div role="status" className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
              <span className="sr-only">Finding people…</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="d-rise relative h-72 overflow-hidden rounded-[28px] bg-(--block)" style={{ animationDelay: `${i * 45}ms` }}>
                  <span className="d-sweep absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {s.phase === "done" && (
            <>
              <h2 className="sr-only">Three people who can help, best match first</h2>
              <ol className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
                {MATCHES.map((m, i) => (
                  <li
                    key={m.first_name}
                    className="d-rise flex flex-col overflow-hidden rounded-[28px] bg-(--block)"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    {/* The match highlight: a gold band, on the best match only. */}
                    <p className={`px-5 py-2.5 text-sm font-bold sm:px-7 ${i === 0 ? "bg-(--match) text-(--ink)" : "text-(--ink-soft)"}`}>
                      {i === 0 ? "Best match" : `Match ${i + 1}`}
                    </p>

                    <div className="flex flex-1 flex-col px-5 pt-3 pb-5 sm:px-7 sm:pb-7">
                      <p className="d-display text-[1.7rem] leading-[1.12] font-semibold tracking-tight">{m.reason}</p>

                      <p className="mt-5 text-lg font-bold">{m.first_name}</p>
                      <p className="text-(--ink-soft)">{m.major}, class of {m.grad_year}</p>
                      <p className="mt-2 text-sm text-(--ink-soft)">
                        {m.code} {m.title}, {m.semester}, {m.professor}
                      </p>

                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {[...m.help_tags, ...m.about_tags].map((tag) => (
                          <li key={tag} className="rounded-full bg-(--surface) px-3 py-1 text-xs">{tag}</li>
                        ))}
                      </ul>
                      {/* Serif italic: the student's own words. */}
                      <p className="d-display mt-4 text-[1.15rem] leading-snug italic">&ldquo;{m.note}&rdquo;</p>

                      <div className="mt-auto pt-6">
                        <button
                          type="button"
                          className="h-12 w-full cursor-pointer rounded-2xl bg-(--ink) text-lg font-bold text-(--surface) transition-[transform,background-color] duration-200 hover:bg-(--primary) active:scale-[0.97]"
                        >
                          Ask {m.first_name}
                        </button>
                        <p className="mt-3 text-center text-xs text-(--ink-soft)">Demo profile</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        <p className="mt-10 text-sm text-(--ink-soft)">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All designs</Link>
        </p>
      </main>
    </div>
  );
}
