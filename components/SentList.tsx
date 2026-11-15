"use client";

// The Sent page's content: every intro request this browser has sent, newest
// first, as ruled rows. Each row is a native <details>, so it opens with a
// click, a tap or the keyboard (Enter or Space) to show the message exactly as
// it was sent. Everything comes from the browser store in profile.ts; nothing
// is fetched from the server.

import Link from "next/link";
import { useProfile, useSent, type SentRequest } from "./profile";

/** An ISO date → "Nov 14, 2026", in the person's own time zone. */
function longDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SentList() {
  const { ready } = useProfile();
  const sent = useSent();

  // Until the browser has read its store, nothing is known: show nothing,
  // so an empty state never flashes before the real list.
  if (!ready) return null;

  return (
    <div className="pt-10 pb-16 sm:pt-16">
      <h1 className="font-display text-6xl leading-none font-bold uppercase sm:text-8xl">Sent</h1>
      <p className="mt-3 text-graphite">Kept in this browser only.</p>

      {sent.length === 0 ? (
        <div className="mt-8 border-t-2 border-ink pt-6">
          <h2 className="font-display text-2xl font-bold uppercase">Nothing sent yet</h2>
          <p className="mt-2 text-graphite">When you ask someone on the roster a question, it shows up here.</p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center border-2 border-ink px-5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper motion-reduce:transition-none"
          >
            Find someone to ask
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-graphite">
            {sent.length === 1 ? "1 request" : `${sent.length} requests`}, newest first. Open one to read the message.
          </p>
          <ul className="mt-3 border-t-2 border-ink">
            {sent.map((request) => (
              <SentRow key={request.id} request={request} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** One request: who, which course, when, and how it was delivered. Opens to show the message. */
function SentRow({ request }: { request: SentRequest }) {
  const date = longDate(request.sent_at);

  return (
    <li className="border-b border-rule">
      <details className="group">
        {/* list-none and the webkit rule hide the browser's own triangle; a +/− stands in for it. */}
        <summary className="flex min-h-11 cursor-pointer list-none items-start gap-4 py-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-2xl font-bold uppercase">{request.first_name}</span>
              <span className="text-graphite">
                {request.code} {request.title}
              </span>
            </p>
            <p className="mt-1 text-sm text-graphite">
              {date && <time dateTime={request.sent_at}>{date}</time>}
              {date && " · "}
              {request.delivery === "emailed" ? "Emailed" : "Saved"}
            </p>
          </div>
          <span aria-hidden="true" className="font-display text-2xl leading-8 font-bold">
            <span className="group-open:hidden">+</span>
            <span className="hidden group-open:inline">&minus;</span>
          </span>
        </summary>

        {/* whitespace-pre-wrap keeps the line breaks the person typed. */}
        <div className="mb-5 border-l-4 border-ink py-1 pl-4">
          <p className="text-sm text-graphite">
            {request.delivery === "emailed"
              ? `Emailed to ${request.first_name}.`
              : `Saved to be passed on to ${request.first_name}.`}
          </p>
          <p className="mt-2 break-words whitespace-pre-wrap">{request.message}</p>
        </div>
      </details>
    </li>
  );
}
