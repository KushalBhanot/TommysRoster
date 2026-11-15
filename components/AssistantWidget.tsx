"use client";

// "Ask Tommy": a small helper fixed to the bottom-right corner of every page.
// The person types a question about how the site works and POST /api/assistant
// answers with a short reply and a few links to pages on the site. The
// conversation lives only in this component's state: it is not saved anywhere
// and disappears when the page is reloaded.
//
// The panel is deliberately not a modal: the page behind it stays usable.

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { TommyAvatar } from "./TommyAvatar";
import { useProfile } from "./profile";

type Role = "user" | "assistant";

type ReplyLink = { label: string; href: string };

type ChatMessage = {
  role: Role;
  content: string;
  /** Links under one of Tommy's replies. */
  links?: ReplyLink[];
  /** True when this "reply" is an error shown in Tommy's voice, not a real answer. */
  error?: boolean;
};

const GREETING =
  "Hi, I'm Tommy. Ask me how matching works, how to join the roster, or whether anyone took a course.";

const STARTERS = ["How does matching work?", "Is my email shown to anyone?", "Is there anyone who took CSCI 103?"];

// Limits from the API contract in SPEC.md ("POST /api/assistant").
const MAX_LENGTH = 600;
const MAX_HISTORY = 12;

/**
 * Turns the on-screen conversation into what the API accepts: only role and
 * content, the last 12 messages, starting with a question from the person.
 * A question that failed (followed by an error) is left out together with its
 * error, so the model never sees our error text as something it said.
 */
function toApiMessages(conversation: ChatMessage[]): { role: Role; content: string }[] {
  const kept: ChatMessage[] = [];
  conversation.forEach((message, index) => {
    if (message.error) return;
    const next = conversation[index + 1];
    if (message.role === "user" && next?.error) return;
    kept.push(message);
  });

  const recent = kept.slice(-MAX_HISTORY);
  while (recent.length > 0 && recent[0].role === "assistant") recent.shift();
  return recent.map(({ role, content }) => ({ role, content: content.slice(0, MAX_LENGTH) }));
}

/** Keeps only well-formed links to pages on this site (next/link is for internal pages). */
function cleanLinks(value: unknown): ReplyLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (link): link is ReplyLink =>
      typeof link?.label === "string" && typeof link?.href === "string" && link.href.startsWith("/") && !link.href.startsWith("//"),
  );
}

/**
 * Calls the API. This does not use postJson from ./api because a 429 needs its
 * own message ("wait a minute"), and postJson does not expose the status code.
 */
async function askTommy(messages: { role: Role; content: string }[]): Promise<{ reply: string; links: ReplyLink[] }> {
  let response: Response;
  try {
    response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new Error("I can't reach the server. Check your connection and try again.");
  }

  if (response.status === 429) {
    throw new Error("That's a lot of questions in a short time. Wait a minute, then ask again.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.reply !== "string") {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Something went wrong on our side and I couldn't answer. Please try again.",
    );
  }
  return { reply: data.reply, links: cleanLinks(data.links) };
}

export function AssistantWidget() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  // Text for screen readers: the newest reply, announced when it arrives.
  const [announcement, setAnnouncement] = useState("");

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelId = useId();
  const inputId = useId();

  const hasAsked = messages.some((message) => message.role === "user");

  // Opening the panel, or getting a reply, puts the cursor back in the input,
  // unless the person has meanwhile moved on to something else on the page.
  useEffect(() => {
    if (!open || waiting) return;
    const active = document.activeElement;
    const focusIsFree = !active || active === document.body || panelRef.current?.contains(active);
    if (focusIsFree || active === launcherRef.current) inputRef.current?.focus();
  }, [open, waiting]);

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, waiting, open]);

  function closeAndReturnFocus() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeAndReturnFocus();
    }
  }

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_LENGTH);
    if (!question || waiting) return;
    // A starter button disappears once it is used: keep focus in the panel.
    inputRef.current?.focus();

    const conversation: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(conversation);
    setInput("");
    setWaiting(true);
    setAnnouncement("");

    try {
      const { reply, links } = await askTommy(toApiMessages(conversation));
      setMessages((current) => [...current, { role: "assistant", content: reply, links }]);
      setAnnouncement(`Tommy: ${reply}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((current) => [...current, { role: "assistant", content: message, error: true }]);
      setAnnouncement(`Tommy: ${message}`);
      // Give the question back so trying again is one tap on Send.
      setInput((current) => current || question);
    } finally {
      setWaiting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  // Tommy answers questions about the roster, so it stays out of the way on
  // the sign-in and onboarding pages, until the person is through both.
  if (!profile?.onboarded || !profile.privacy_seen) return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        data-tour="assistant"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) setOpen(false);
        }}
        className="fixed right-4 bottom-4 z-40 inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-ink bg-paper py-1 pr-4 pl-1.5 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
      >
        <TommyAvatar size={30} />
        Ask Tommy
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Ask Tommy"
          onKeyDown={onPanelKeyDown}
          className="rise fixed inset-x-0 bottom-0 z-40 flex max-h-[80dvh] flex-col border-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-4 sm:bottom-20 sm:max-h-[min(36rem,calc(100dvh-7rem))] sm:w-[380px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b-2 border-ink py-2 pr-1 pl-3">
            <TommyAvatar size={36} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight font-bold uppercase">Tommy</p>
              <p className="truncate text-sm text-graphite">Ask how anything here works</p>
            </div>
            <button
              type="button"
              onClick={closeAndReturnFocus}
              aria-label="Close Tommy"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M3 3 L15 15 M15 3 L3 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <ol className="flex flex-col gap-3">
              <TommyMessage content={GREETING} />
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <li key={index} className="ml-auto max-w-[85%] bg-ink px-3 py-2 break-words whitespace-pre-wrap text-paper">
                    <span className="sr-only">You: </span>
                    {message.content}
                  </li>
                ) : (
                  <TommyMessage
                    key={index}
                    content={message.content}
                    links={message.links}
                    onLinkClick={() => setOpen(false)}
                  />
                ),
              )}
              {waiting && (
                <li className="flex items-start gap-2">
                  <TommyAvatar size={24} />
                  <div className="border-2 border-ink px-3 py-2">
                    <span aria-hidden="true" className="flex h-6 items-center gap-1.5 motion-reduce:hidden">
                      {[0, 200, 400].map((delay) => (
                        <span
                          key={delay}
                          className="size-2 rounded-full bg-ink motion-safe:animate-pulse"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    <span className="sr-only motion-reduce:not-sr-only">Thinking…</span>
                  </div>
                </li>
              )}
            </ol>
          </div>

          {/* Announces each reply to screen readers once it arrives. */}
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          {/* Starter questions, until the person asks something */}
          {!hasAsked && (
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={waiting}
                  onClick={() => void send(starter)}
                  className="min-h-11 cursor-pointer border-2 border-ink px-3 py-1.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-60"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="flex items-stretch gap-2 border-t-2 border-ink p-3">
            <label htmlFor={inputId} className="sr-only">
              Your question for Tommy
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              autoComplete="off"
              maxLength={MAX_LENGTH}
              placeholder="Type a question"
              value={input}
              // Read-only, not disabled, while waiting: a disabled field drops
              // keyboard focus to the page, and Escape would stop working.
              readOnly={waiting}
              aria-disabled={waiting}
              onChange={(event) => setInput(event.target.value)}
              className="block h-12 min-w-0 flex-1 border-2 border-ink bg-paper px-3 text-base placeholder:text-[#767676] focus:border-cardinal aria-disabled:border-rule aria-disabled:text-graphite"
            />
            <button
              type="submit"
              disabled={waiting || input.trim() === ""}
              className="min-h-12 cursor-pointer bg-cardinal px-5 font-display text-lg font-semibold tracking-wide text-paper uppercase transition-opacity duration-150 disabled:cursor-default disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

type TommyMessageProps = {
  content: string;
  links?: ReplyLink[];
  onLinkClick?: () => void;
};

/** One of Tommy's messages: the small avatar, the text, and any links under it. */
function TommyMessage({ content, links = [], onLinkClick }: TommyMessageProps) {
  return (
    <li className="flex max-w-[92%] items-start gap-2">
      <TommyAvatar size={24} />
      <div className="min-w-0">
        <div className="border-2 border-ink px-3 py-2 break-words whitespace-pre-wrap">
          <span className="sr-only">Tommy: </span>
          {content}
        </div>
        {links.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {links.map((link, index) => (
              <li key={`${link.href}-${index}`}>
                <Link
                  href={link.href}
                  onClick={onLinkClick}
                  className="inline-flex min-h-11 cursor-pointer items-center border-2 border-ink px-3 text-sm font-medium transition-colors duration-150 hover:bg-ink hover:text-paper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
