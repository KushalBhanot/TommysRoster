"use client";

import Link from "next/link";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 6, "Portraits" (design-forward).
// The idea: give the product one visual signature. Every person gets an
// abstract portrait drawn from their name in the brand's three colors, so a
// match is recognisable at a glance without a photo. Everything around the
// portraits stays quiet: a serif headline, one bordered field, plain text.
// Type: Young Serif (headline, question, reasons) + Schibsted Grotesk (the rest).

const CARDINAL = "#990000";
const GOLD = "#FFCC00";
const INK = "#111111";

/** A repeatable random-number generator: the same name always gives the same picture. */
function randomFrom(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * An abstract portrait drawn from a person's name: a large disc, a tall
 * block, a quarter circle, a few ruled lines and a dot, placed and colored
 * by the name so every person gets their own picture and keeps it.
 */
function Portrait({ name }: { name: string }) {
  const r = randomFrom(name);
  const pick = <T,>(items: T[]) => items[Math.floor(r() * items.length)];

  const discColor = pick([GOLD, CARDINAL]);
  const blockColor = discColor === GOLD ? pick([CARDINAL, INK]) : pick([GOLD, INK]);
  const arcColor = [GOLD, CARDINAL, INK].find((c) => c !== discColor && c !== blockColor) ?? INK;

  const disc = { cx: 70 + r() * 100, cy: 95 + r() * 80, radius: 58 + r() * 26 };
  const block = { x: 28 + r() * 120, y: 40 + r() * 70, w: 34 + r() * 46, h: 130 + r() * 90 };
  // The quarter circle sits in one of the four corners.
  const corner = pick([
    { x: 0, y: 300, sx: 1, sy: -1 },
    { x: 240, y: 300, sx: -1, sy: -1 },
    { x: 240, y: 0, sx: -1, sy: 1 },
    { x: 0, y: 0, sx: 1, sy: 1 },
  ]);
  const arcSize = 70 + r() * 50;
  const lineY = 40 + r() * 200;
  const tilt = -18 + r() * 36;
  const dot = { cx: 30 + r() * 180, cy: 30 + r() * 240 };

  return (
    <svg viewBox="0 0 240 300" role="img" aria-label={`Abstract portrait of ${name}`} className="block h-full w-full">
      <rect width="240" height="300" fill="#f3f1ec" />
      <circle cx={disc.cx} cy={disc.cy} r={disc.radius} fill={discColor} />
      {/* multiply: where two shapes overlap, the colors mix like printed ink */}
      <rect x={block.x} y={block.y} width={block.w} height={block.h} fill={blockColor} style={{ mixBlendMode: "multiply" }} />
      <path
        d={`M ${corner.x} ${corner.y} h ${corner.sx * arcSize} a ${arcSize} ${arcSize} 0 0 ${corner.sx * corner.sy > 0 ? 1 : 0} ${-corner.sx * arcSize} ${corner.sy * arcSize} z`}
        fill={arcColor}
        style={{ mixBlendMode: "multiply" }}
      />
      <g stroke={INK} strokeWidth="2" transform={`rotate(${tilt} 120 150)`}>
        <line x1="20" x2="220" y1={lineY} y2={lineY} />
        <line x1="20" x2="150" y1={lineY + 9} y2={lineY + 9} />
        <line x1="20" x2="90" y1={lineY + 18} y2={lineY + 18} />
      </g>
      <circle cx={dot.cx} cy={dot.cy} r="7" fill={INK} />
    </svg>
  );
}

export function Portraits() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();

  return (
    <div className="design-root bg-white text-[#111]">
      <header className="mx-auto max-w-5xl px-5 pt-6">
        <span className="text-sm font-bold tracking-wide">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-10 pb-20 sm:pt-16">
        <form onSubmit={s.submit} className="grid gap-x-12 gap-y-6 sm:grid-cols-[1.25fr_1fr] sm:items-end">
          <div>
            <h1 className="d-display text-4xl leading-[1.08] sm:text-6xl">
              <label htmlFor="q6">Describe what you&rsquo;re trying to figure out</label>
            </h1>
            <textarea
              id="q6"
              required
              rows={4}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="d-display mt-8 block w-full resize-none border-2 border-[#111] bg-white px-4 py-3 text-xl leading-snug placeholder:text-[#767676] focus:border-[#990000] sm:text-2xl"
            />
          </div>

          {/* Beside the field: what happens next, the examples, and the one action. */}
          <div className="border-l-2 border-[#111] pl-4">
            <p className="text-[#555]">
              You&rsquo;ll be matched with up to three students who already took the class.
            </p>
            <ul className="mt-3">
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
            <button type="button" onClick={s.toggleOptional} aria-expanded={s.optionalOpen} className="block min-h-11 text-sm font-medium">
              {s.optionalOpen ? "Hide your major and year" : "Add your major and year (optional)"}
            </button>
            {s.optionalOpen && (
              <div className="d-fade mb-2 grid grid-cols-2 gap-3">
                <label className="text-sm text-[#555]">
                  Major
                  <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full border border-black/40 bg-white px-3 text-base text-black" />
                </label>
                <label className="text-sm text-[#555]">
                  Grad year
                  <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full border border-black/40 bg-white px-3 text-base text-black" />
                </label>
              </div>
            )}
            <button
              type="submit"
              disabled={s.phase === "loading"}
              className="mt-2 min-h-12 w-full bg-[#990000] px-8 font-semibold text-white transition-opacity duration-150 disabled:opacity-70 sm:w-auto"
            >
              {s.phase === "loading" ? "Finding people…" : "Find people"}
            </button>
          </div>
        </form>

        <section ref={resultsRef} aria-live="polite" className="mt-16 scroll-mt-6 sm:mt-24">
          {s.phase === "loading" && (
            <div role="status">
              <p className="text-[#555]">Finding people…</p>
              {/* Three blank portraits appear one after another. */}
              <div className="mt-6 grid grid-cols-3 gap-4 sm:gap-10">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="d-pop aspect-[4/5] bg-[#f3f1ec]" style={{ "--i": i } as React.CSSProperties} />
                ))}
              </div>
            </div>
          )}

          {s.phase === "done" && (
            <ol className="grid gap-x-10 gap-y-16 sm:grid-cols-3">
              {MATCHES.map((m, i) => (
                <li key={m.first_name} className="d-rise" style={{ "--i": i } as React.CSSProperties}>
                  <div className="aspect-[4/5] max-w-[15rem] sm:max-w-none">
                    <Portrait name={m.first_name} />
                  </div>

                  <div className="mt-5">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <span aria-hidden="true" className="size-3 rounded-full bg-[#FFCC00]" />
                      {i === 0 ? "Best match" : `Match ${i + 1}`}
                    </p>
                    <p className="d-display mt-2 text-[1.45rem] leading-snug">{m.reason}</p>

                    <p className="mt-4 font-bold">{m.first_name}, class of {m.grad_year}</p>
                    <p className="text-sm text-[#555]">{m.major}</p>
                    <p className="text-sm text-[#555]">{m.code} {m.title}, {m.semester}</p>
                    <p className="text-sm text-[#555]">Taught by {m.professor}</p>

                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="border border-black/30 px-2 py-0.5 text-xs">{tag}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm text-[#555]">&ldquo;{m.note}&rdquo;</p>

                    <button type="button" className="mt-4 min-h-11 border border-[#111] px-6 font-semibold transition-colors duration-150 hover:bg-[#111] hover:text-white">
                      Ask {m.first_name}
                    </button>
                    <p className="mt-3 text-xs text-[#555]">Demo profile</p>
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
