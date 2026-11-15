"use client";

// The "Ask [name]" window. When it opens, the AI writes a message for this one
// person (POST /api/draft). The suggestion is shown inside the empty message box
// as grey "ghost text": pressing Tab, or the "Use this draft" button, turns it
// into real text the asker can edit. Sending goes to POST /api/request, is
// remembered in this browser (the Sent page), and the window then says what
// happens next.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/courses";
import { errorMessage, postJson } from "./api";
import { addSent, askerContext, clientId, useProfile } from "./profile";
import { useScrollLock } from "./useScrollLock";

interface AskDialogProps {
  /** Who is being asked, in the course the question is about. */
  person: Person;
  /** What the asker typed in the search box. Missing on a course page. */
  question?: string;
  /** The general draft from the match. Only used if the personal draft fails. */
  draft: string;
  onClose: () => void;
}

const MAX_MESSAGE_CHARS = 1000; // same limit as POST /api/request

type Status = "editing" | "sending" | "sent";

// "loading" while the AI writes; then the suggestion text ("" = no suggestion).
type Suggestion = { status: "loading" } | { status: "ready"; text: string };

// Drafts already asked for, by request body. React runs effects twice in
// development, and people may close and reopen the same window: this way each
// draft costs one AI call. Failed requests are removed so they can be retried.
const draftRequests = new Map<string, Promise<string>>();

function fetchDraft(body: Record<string, unknown>): Promise<string> {
  const key = JSON.stringify(body);
  let pending = draftRequests.get(key);
  if (!pending) {
    pending = postJson<{ draft: string }>("/api/draft", body).then((data) => data.draft?.trim() ?? "");
    pending.catch(() => draftRequests.delete(key));
    draftRequests.set(key, pending);
  }
  return pending;
}

// Same look as the secondary buttons elsewhere (2px black border, inverts on hover).
const SECONDARY_BUTTON =
  "inline-flex min-h-12 cursor-pointer items-center border-2 border-ink px-6 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper motion-reduce:transition-none";
const PRIMARY_BUTTON =
  "inline-flex min-h-12 cursor-pointer items-center bg-cardinal px-6 font-display text-lg font-semibold tracking-wide text-paper uppercase transition-opacity duration-150 disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none";

// The message box and its ghost layer must share these exactly, so the ghost
// text wraps line for line the way the real text will.
const MESSAGE_TEXT = "px-4 py-3 text-lg leading-snug whitespace-pre-wrap break-words";

/**
 * Built on the browser's own <dialog>, which handles the Escape key and keeps
 * keyboard focus inside while it is open.
 */
export function AskDialog({ person, question, draft, onClose }: AskDialogProps) {
  const code = person.code;
  const { profile, ready } = useProfile();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  const [suggestion, setSuggestion] = useState<Suggestion>({ status: "loading" });
  const [message, setMessage] = useState("");
  const [usedDraft, setUsedDraft] = useState(false);
  // Only typed when there is no profile (should not happen: pages need sign-in).
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [delivery, setDelivery] = useState<"emailed" | "saved">("saved");
  const [error, setError] = useState("");

  useScrollLock();

  // A <dialog> only becomes a real modal when opened with showModal().
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Ask the AI for a message written for this person, once the profile is known.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const body = {
      person_id: person.person_id,
      code: person.code,
      question: question?.trim() || undefined,
      asker_first_name: profile?.first_name || undefined,
      ...askerContext(profile),
    };
    fetchDraft(body)
      .then((text) => {
        if (!cancelled) setSuggestion({ status: "ready", text: text || draft.trim() });
      })
      .catch(() => {
        // Fall back to the match's general draft; if that is empty, no suggestion.
        if (!cancelled) setSuggestion({ status: "ready", text: draft.trim() });
      });
    return () => {
      cancelled = true;
    };
  }, [ready, profile, person.person_id, person.code, question, draft]);

  // After sending, the form (and the focused Send button) is gone. Move focus
  // to "Done" so keyboard and screen reader users land on the next step.
  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const suggestionText = suggestion.status === "ready" ? suggestion.text : "";
  const ghostShowing = message === "" && suggestionText !== "";
  const replyEmail = profile?.email ?? email.trim();

  function acceptSuggestion() {
    setMessage(suggestionText);
    setUsedDraft(true);
    messageRef.current?.focus();
  }

  function onMessageKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab takes the suggestion only while the box is empty and the ghost shows.
    // Every other Tab (and Shift+Tab) moves focus as usual, so nobody is trapped.
    const plainTab = event.key === "Tab" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
    if (plainTab && ghostShowing) {
      event.preventDefault();
      acceptSuggestion();
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setError(ghostShowing ? "Write a message, or use the draft." : "Write a message first.");
      return;
    }
    if (!profile && !email.trim().toLowerCase().endsWith("@usc.edu")) {
      setError("Use your @usc.edu email so they know you're a USC student.");
      return;
    }

    setError("");
    setStatus("sending");
    try {
      const result = await postJson<{ ok: boolean; delivery?: "emailed" | "saved" }>("/api/request", {
        person_id: person.person_id,
        code,
        question: message,
        from_email: replyEmail,
        client_id: clientId(),
      });
      const how = result.delivery === "emailed" ? "emailed" : "saved";
      addSent({
        person_id: person.person_id,
        first_name: person.first_name,
        code,
        title: person.title,
        message,
        delivery: how,
      });
      setDelivery(how);
      setStatus("sent");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("editing");
    }
  }

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // While a request is on its way the window stays open, so its result
      // (sent, or an error) is always seen. Escape fires "cancel" first.
      onCancel={(event) => {
        if (status === "sending") event.preventDefault();
      }}
      // A click on the dimmed area outside the panel lands on the dialog itself.
      onClick={(event) => {
        if (event.target === dialogRef.current && status !== "sending") close();
      }}
      aria-labelledby="ask-title"
      // A sheet rising from the bottom on a phone, a centered panel from "sm" up.
      className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto border-t-4 border-ink bg-paper text-ink backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:border-4"
    >
      <div className="px-5 pt-6 pb-8 sm:px-8 sm:pt-8">
        {status === "sent" ? (
          <div role="status">
            <h2 id="ask-title" className="font-display text-4xl font-bold uppercase">
              Request sent
            </h2>
            <p className="mt-3 text-lg">
              {delivery === "emailed"
                ? `We emailed your message to ${person.first_name}.`
                : `Your message is saved and will be passed on to ${person.first_name}.`}
            </p>

            <h3 className="mt-6 font-display text-xl font-bold uppercase">What happens next</h3>
            <ol className="mt-2 border-t-2 border-ink">
              {[
                `${person.first_name} reads your message.`,
                `They reply to your USC email${replyEmail ? `, ${replyEmail}` : ""}.`,
                "You can see everything you've sent under Sent.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 border-b border-rule py-2.5">
                  <span className="font-display font-bold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-graphite">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* Close first: pages are kept hidden after navigating away, and an
                  open dialog left behind would stop the next page from scrolling. */}
              <Link href="/sent" onClick={close} className={SECONDARY_BUTTON}>
                See what you&rsquo;ve sent
              </Link>
              <button ref={doneRef} type="button" onClick={close} className={PRIMARY_BUTTON}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={send} noValidate>
            <h2 id="ask-title" className="font-display text-4xl font-bold uppercase">
              Ask {person.first_name}
            </h2>
            <p className="mt-1 text-graphite">
              About {code} {person.title}
            </p>

            <label htmlFor="ask-message" className="mt-6 block text-sm text-graphite">
              Your message
            </label>
            {/*
              The box and the ghost text share one grid cell, so the box is always
              at least as tall as the suggestion. The border and focus ring sit on
              this wrapper; the textarea itself is transparent and on top.
            */}
            <div className="mt-2 grid border-2 border-ink focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-cardinal">
              <div aria-hidden="true" className={`pointer-events-none col-start-1 row-start-1 text-[#767676] ${MESSAGE_TEXT}`}>
                {message === "" && (suggestion.status === "loading" ? "Writing a draft for you…" : suggestionText)}
              </div>
              <textarea
                id="ask-message"
                ref={messageRef}
                rows={5}
                maxLength={MAX_MESSAGE_CHARS}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={onMessageKeyDown}
                aria-describedby={ghostShowing ? "ask-suggestion ask-hint" : undefined}
                // A plain placeholder only when there is no suggestion to show.
                placeholder={suggestion.status === "ready" && !suggestionText ? `Hi! I have a question about ${code}…` : undefined}
                className={`col-start-1 row-start-1 block min-h-40 w-full resize-none field-sizing-content bg-transparent outline-none placeholder:text-[#767676] focus-visible:outline-none ${MESSAGE_TEXT}`}
              />
            </div>

            {/* For screen readers: the suggestion itself, and news of its arrival. */}
            {ghostShowing && (
              <p id="ask-suggestion" hidden>
                Suggested draft: {suggestionText}
              </p>
            )}
            <p className="sr-only" aria-live="polite">
              {suggestion.status === "loading" ? "Writing a draft for you…" : suggestionText ? "A suggested draft is ready." : ""}
            </p>

            {ghostShowing && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <p id="ask-hint" className="text-sm text-graphite">
                  Press Tab to use this draft, or just start typing.
                </p>
                <button
                  type="button"
                  onClick={acceptSuggestion}
                  className="min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-4"
                >
                  Use this draft
                </button>
              </div>
            )}
            {usedDraft && message !== "" && (
              <p className="mt-2 text-sm text-graphite">
                AI wrote this draft from your question and {person.first_name}&rsquo;s entry. Edit it so it sounds like you.
              </p>
            )}

            {profile ? (
              <p className="mt-6 text-sm text-graphite">
                Replies will go to <span className="font-semibold text-ink">{profile.email}</span>.
              </p>
            ) : (
              <>
                <label htmlFor="ask-email" className="mt-6 block text-sm text-graphite">
                  Your USC email
                </label>
                <input
                  id="ask-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@usc.edu"
                  className="mt-2 block h-12 w-full border-2 border-ink px-4 text-base placeholder:text-[#767676]"
                />
              </>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm font-semibold text-cardinal">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={status === "sending"} className={PRIMARY_BUTTON}>
                {status === "sending" ? "Sending…" : "Send request"}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={status === "sending"}
                className="min-h-12 cursor-pointer px-4 font-medium underline underline-offset-4 disabled:cursor-default disabled:text-graphite disabled:no-underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
