"use client";

import Link from "next/link";
import { useState } from "react";
import { EXAMPLES, MATCHES } from "../_shared/mock";
import { useMockSearch } from "../_shared/useMockSearch";

// Design 4, "Ask Around".
// The idea: asking a friend. The page is a conversation: the roster says hi,
// your question becomes your message, three dots show it is thinking, and each
// match arrives as a reply that introduces one person.
// Type: Plus Jakarta Sans (the interface and your words) + Newsreader (the
// roster's replies, so its voice reads differently from yours).

export function AskAround() {
  // The ref is kept apart from the rest of the state: it is only attached to an element.
  const { resultsRef, ...s } = useMockSearch();
  // The question as it was sent, shown as your bubble (the box is then free to edit).
  const [sent, setSent] = useState("");

  function send(event: React.FormEvent) {
    setSent(s.question.trim());
    s.submit(event);
    s.setQuestion(""); // like a chat app: the box empties once the message is sent
  }

  return (
    <div className="design-root bg-[#f3f3f4] text-[#18181b]">
      <header className="mx-auto flex max-w-xl items-center gap-2 px-4 pt-5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-[#990000]" />
        <span className="text-sm font-bold">Tommy&rsquo;s Roster</span>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-6 pb-16">
        {/* The roster speaks first. Its opening line is the page headline. */}
        <div className="max-w-[88%] self-start rounded-3xl rounded-tl-lg bg-white px-5 py-4 shadow-sm">
          <h1 className="d-display text-[1.7rem] leading-tight font-medium sm:text-4xl">
            <label htmlFor="q4">Describe what you&rsquo;re trying to figure out.</label>
          </h1>
          <p className="d-display mt-2 text-lg text-[#52525b]">
            I&rsquo;ll introduce you to up to three students who already took the class.
          </p>
        </div>

        <div ref={resultsRef as React.RefObject<HTMLDivElement>} aria-live="polite" className="flex scroll-mt-4 flex-col gap-3">
          {s.phase !== "idle" && (
            <p className="d-rise max-w-[88%] self-end rounded-3xl rounded-tr-lg bg-[#990000] px-5 py-3 text-lg leading-snug text-white">
              {sent}
            </p>
          )}

          {s.phase === "loading" && (
            <div role="status" className="d-fade flex items-center gap-1.5 self-start rounded-3xl rounded-tl-lg bg-white px-5 py-4 shadow-sm">
              <span className="sr-only">Checking who took it…</span>
              {[0, 1, 2].map((i) => (
                <span key={i} aria-hidden="true" className="d-dot size-2.5 rounded-full bg-[#18181b]" style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
          )}

          {s.phase === "done" && (
            <>
              <p className="d-display d-rise max-w-[88%] self-start rounded-3xl rounded-tl-lg bg-white px-5 py-3 text-lg shadow-sm">
                Three people can help with this.
              </p>
              {MATCHES.map((m, i) => (
                <article
                  key={m.first_name}
                  className="d-rise max-w-[94%] self-start rounded-3xl rounded-tl-lg bg-white px-5 py-4 shadow-sm"
                  style={{ "--i": i + 1 } as React.CSSProperties}
                >
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    {/* The gold dot is the match marker. */}
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-[#FFCC00] ring-2 ring-[#FFCC00]/30" />
                    {m.first_name} can help with this
                  </h2>
                  <p className="d-display mt-2 text-[1.45rem] leading-snug font-medium">{m.reason}</p>

                  <div className="mt-4 rounded-2xl bg-[#f3f3f4] px-4 py-3 text-sm">
                    <p className="font-bold">{m.first_name}, {m.major}, class of {m.grad_year}</p>
                    <p className="mt-0.5 text-[#52525b]">{m.code} {m.title}, {m.semester}, {m.professor}</p>
                    <p className="mt-2 text-[#3f3f46]">&ldquo;{m.note}&rdquo;</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {[...m.help_tags, ...m.about_tags].map((tag) => (
                        <li key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs">{tag}</li>
                      ))}
                      <li className="rounded-full border border-[#a1a1aa] px-2.5 py-1 text-xs text-[#52525b]">Demo profile</li>
                    </ul>
                  </div>

                  <button type="button" className="mt-4 min-h-11 rounded-full border-2 border-[#18181b] px-5 text-sm font-bold transition-colors duration-150 hover:bg-[#18181b] hover:text-white">
                    Ask {m.first_name}
                  </button>
                </article>
              ))}
            </>
          )}
        </div>

        {/* Quick replies, only before the first question. */}
        {s.phase === "idle" && (
          <ul className="mt-2 flex flex-col items-end gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => s.setQuestion(example)}
                  className="min-h-11 rounded-full border border-[#990000] bg-white px-4 text-left text-sm font-medium text-[#990000] transition-colors duration-150 hover:bg-[#990000] hover:text-white"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* The message box is the hero: large, raised, with the one action. */}
        <form onSubmit={send} className="mt-3">
          <div className="flex items-end gap-2 rounded-[1.75rem] bg-white p-2 pl-5 shadow-[0_10px_30px_-12px_rgba(24,24,27,0.35)] ring-1 ring-black/5">
            <textarea
              id="q4"
              required
              rows={2}
              maxLength={300}
              value={s.question}
              onChange={(e) => s.setQuestion(e.target.value)}
              placeholder="I'm taking the class next semester and I'm worried about…"
              className="block min-h-14 flex-1 resize-none bg-transparent py-2 text-lg leading-snug placeholder:text-[#71717a] focus:outline-none"
            />
            <button
              type="submit"
              disabled={s.phase === "loading"}
              className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#990000] px-5 font-bold text-white transition-opacity duration-150 disabled:opacity-70"
            >
              {s.phase === "loading" ? "Asking…" : "Ask around"}
            </button>
          </div>

          <button
            type="button"
            onClick={s.toggleOptional}
            aria-expanded={s.optionalOpen}
            className="mt-1 min-h-11 px-2 text-sm font-medium text-[#3f3f46] underline underline-offset-4"
          >
            {s.optionalOpen ? "Hide your major and year" : "Tell them your major and year (optional)"}
          </button>
          {s.optionalOpen && (
            <div className="d-fade grid grid-cols-2 gap-2 px-1">
              <label className="text-xs font-medium text-[#52525b]">
                Major
                <input value={s.major} onChange={(e) => s.setMajor(e.target.value)} className="mt-1 block h-11 w-full rounded-full bg-white px-4 text-base text-[#18181b] ring-1 ring-black/10" />
              </label>
              <label className="text-xs font-medium text-[#52525b]">
                Grad year
                <input value={s.year} onChange={(e) => s.setYear(e.target.value)} inputMode="numeric" className="mt-1 block h-11 w-full rounded-full bg-white px-4 text-base text-[#18181b] ring-1 ring-black/10" />
              </label>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-sm">
          <Link href="/design" className="inline-flex min-h-11 items-center underline underline-offset-4">All designs</Link>
        </p>
      </main>
    </div>
  );
}
