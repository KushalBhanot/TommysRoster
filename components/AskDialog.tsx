"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/courses";
import { errorMessage, postJson } from "./api";

interface AskDialogProps {
  person: Person;
  /** The course the question is about. */
  code: string;
  /** Message to start from (the AI's draft). The asker can edit it. */
  draft: string;
  onClose: () => void;
}

const MAX_MESSAGE_CHARS = 1000; // same limit as POST /api/request

type Status = "editing" | "sending" | "sent";

/**
 * The "Ask [name]" window: an editable message plus the asker's USC email,
 * sent to POST /api/request. Built on the browser's own <dialog>, which
 * handles the Escape key and keeps keyboard focus inside while it is open.
 */
export function AskDialog({ person, code, draft, onClose }: AskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState(draft);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState("");

  // A <dialog> only becomes a real modal when opened with showModal().
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim().toLowerCase().endsWith("@usc.edu")) {
      setError("Use your @usc.edu email so they know you're a USC student.");
      return;
    }

    setError("");
    setStatus("sending");
    try {
      await postJson("/api/request", {
        person_id: person.person_id,
        code,
        question: message,
        from_email: email,
      });
      setStatus("sent");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("editing");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dimmed area outside the panel lands on the dialog itself.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
      aria-labelledby="ask-title"
      // A sheet rising from the bottom on a phone, a centered panel from "sm" up.
      className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-paper text-ink backdrop:bg-black/45 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="px-5 pt-6 pb-8 sm:px-8 sm:pt-8">
        {status === "sent" ? (
          <div role="status">
            <h2 id="ask-title" className="text-2xl font-semibold">
              Request sent
            </h2>
            <p className="mt-3 text-graphite">
              We&rsquo;ll pass your message to {person.first_name}. Their reply will come to {email.trim()}.
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="mt-8 h-12 rounded-full border border-ink px-6 font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={send}>
            <h2 id="ask-title" className="text-2xl font-semibold">
              Ask {person.first_name}
            </h2>
            <p className="mt-1 text-graphite">About {code}</p>

            <label htmlFor="ask-message" className="mt-6 block text-sm text-graphite">
              Your message
            </label>
            <textarea
              id="ask-message"
              required
              rows={5}
              maxLength={MAX_MESSAGE_CHARS}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Hi! I have a question about ${code}…`}
              className="mt-2 block w-full resize-none field-sizing-content rounded-2xl border border-ink/30 px-4 py-3 font-serif text-lg leading-snug caret-cardinal placeholder:text-ink/35"
            />
            {draft && (
              <p className="mt-2 text-sm text-graphite">
                AI wrote this draft from your question. Edit it so it sounds like you.
              </p>
            )}

            <label htmlFor="ask-email" className="mt-6 block text-sm text-graphite">
              Your USC email
            </label>
            <input
              id="ask-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@usc.edu"
              className="mt-2 block h-12 w-full rounded-2xl border border-ink/30 px-4 text-base caret-cardinal placeholder:text-ink/35"
            />

            {error && (
              <p role="alert" className="mt-4 text-sm font-semibold text-cardinal">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={status === "sending"}
                className="h-12 rounded-full bg-cardinal px-6 font-semibold text-paper transition-opacity disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send request"}
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="h-12 rounded-full px-4 font-semibold underline underline-offset-4"
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
