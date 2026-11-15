"use client";

// The privacy notice: what is stored, where, and what goes to the AI.
// Shown once at the end of onboarding, where it must be accepted, and again
// on request from the Account page, where it can simply be closed.
// The wording lives in lib/privacy.ts and must stay truthful.

import { useEffect, useRef } from "react";
import { PRIVACY_DETAILS, PRIVACY_PROMISES } from "@/lib/privacy";

type PrivacyNoticeProps =
  | { mode: "accept"; onAccept: () => void }
  | { mode: "read"; onClose: () => void };

/**
 * A modal <dialog>. In "accept" mode it cannot be dismissed: Escape and
 * clicks outside do nothing, and the only way out is "I understand".
 * In "read" mode it closes with "Close", Escape, or a click outside.
 */
export function PrivacyNotice(props: PrivacyNoticeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const accepted = useRef(false);
  const mustAccept = props.mode === "accept";

  // A <dialog> only becomes a real modal when opened with showModal().
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Start at the top, on the title, so the promises are what people read
    // first (focusing the button would scroll a phone to the bottom).
    titleRef.current?.focus({ preventScroll: true });
    if (dialog) dialog.scrollTop = 0;
  }, []);

  function handleClose() {
    if (props.mode === "read") return props.onClose();
    // Some browsers close a dialog on a second Escape press without asking
    // first. If it closed without being accepted, open it again.
    if (!accepted.current) dialogRef.current?.showModal();
  }

  function accept() {
    if (props.mode !== "accept") return;
    accepted.current = true;
    dialogRef.current?.close();
    props.onAccept();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="privacy-title"
      aria-describedby="privacy-points"
      // Escape fires "cancel" first; stopping it keeps the dialog open.
      onCancel={(event) => {
        if (mustAccept) event.preventDefault();
      }}
      onClose={handleClose}
      // A click on the dimmed area outside the panel lands on the dialog itself.
      onClick={(event) => {
        if (!mustAccept && event.target === dialogRef.current) dialogRef.current.close();
      }}
      // A sheet rising from the bottom on a phone, a centered panel from "sm" up.
      className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto border-t-4 border-ink bg-paper text-ink backdrop:bg-black/50 sm:m-auto sm:max-w-xl sm:border-4"
    >
      <div className="px-5 pt-6 pb-8 sm:px-8 sm:pt-8">
        <h2
          ref={titleRef}
          id="privacy-title"
          tabIndex={-1}
          className="font-display text-4xl leading-none font-bold uppercase outline-none"
        >
          How your information is used
        </h2>

        <div id="privacy-points">
          <PrivacyStatement />
        </div>

        <div className="mt-8">
          {props.mode === "accept" ? (
            <button
              type="button"
              onClick={accept}
              className="min-h-12 w-full cursor-pointer bg-cardinal px-8 font-display text-xl font-semibold tracking-wide text-paper uppercase sm:w-auto"
            >
              I understand
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-12 cursor-pointer border-2 border-ink px-6 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

/** One group of points, each with a small square marker in the roster style. */
function Points({ points, strong = false }: { points: string[]; strong?: boolean }) {
  return (
    <ul className="mt-3 grid gap-3">
      {points.map((point) => {
        // The first sentence of a promise is the promise itself: set it in bold.
        const cut = strong ? point.indexOf(". ") + 1 || point.length : 0;
        return (
          <li key={point} className="grid grid-cols-[0.75rem_1fr] gap-x-3 leading-snug">
            <span aria-hidden="true" className={`mt-2 size-2 ${strong ? "bg-cardinal" : "bg-ink"}`} />
            <span>
              {strong && <strong className="font-bold">{point.slice(0, cut)}</strong>}
              {point.slice(cut)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The whole statement: what we promise, then what is kept and where. Also used by /privacy. */
export function PrivacyStatement() {
  return (
    <>
      <h3 className="mt-5 font-display text-2xl leading-none font-bold uppercase">What we promise</h3>
      <Points points={PRIVACY_PROMISES} strong />
      <h3 className="mt-7 font-display text-2xl leading-none font-bold uppercase">What is kept, and where</h3>
      <Points points={PRIVACY_DETAILS} />
    </>
  );
}
