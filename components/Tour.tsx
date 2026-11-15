"use client";

// The walkthrough that runs by itself the first time someone reaches the home
// page after onboarding (and again after "Replay the walkthrough" on the
// account page). It lights up one part of the page at a time, each marked in
// the page with data-tour="…", and explains it in a small card next to it.
//
// How it looks: one fixed "spotlight" box sits over the element. Its huge
// box-shadow darkens everything else on the page, and its gold border marks
// the element. A transparent layer under the card stops clicks on the page.

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { updateProfile, useProfile } from "./profile";

interface Step {
  /** Matches the element's data-tour attribute. */
  id: string;
  title: string;
  text: string;
}

// In order. A step whose element is not on the page is skipped.
const STEPS: Step[] = [
  {
    id: "question",
    title: "Ask in your own words",
    text: "Describe what you're trying to figure out about a course, the way you would say it to a friend.",
  },
  {
    id: "examples",
    title: "Start from an example",
    text: "Not sure how to phrase it? Tap one of these to fill the box, then change it as you like.",
  },
  {
    id: "scan",
    title: "Scan the roster",
    text: "This looks through everyone on the roster and picks up to three people, with a reason for each.",
  },
  {
    id: "courses",
    title: "Browse by course",
    text: "Or go straight to a course to see everyone who took it.",
  },
  {
    id: "sent",
    title: "Your sent requests",
    text: "Every request you send is listed here, with the message as you wrote it.",
  },
  {
    id: "account",
    title: "Your account",
    text: "See and edit your profile, download or delete your data, and replay this walkthrough.",
  },
  {
    id: "assistant",
    title: "Ask Tommy",
    text: "Stuck? Ask Tommy how anything on this site works.",
  },
];

const START_DELAY_MS = 400; // let the page draw before the tour starts
const SPOT_PAD = 6; // space between the element and the spotlight's edge
const GAP = 12; // space between the spotlight and the card
const MARGIN = 12; // the card never comes closer than this to the screen edge
const MOVE = "top 200ms ease, left 200ms ease, width 200ms ease, height 200ms ease";

/** The element for a step, or null if it is not on the page (or is hidden). */
function findTarget(id: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  // An element hidden with display: none has no boxes on screen.
  return element && element.getClientRects().length > 0 ? element : null;
}

/** The ids of the steps whose elements are on the page right now, in order. */
function presentStepIds(): string[] {
  return STEPS.filter((step) => findTarget(step.id) !== null).map((step) => step.id);
}

/**
 * Put the spotlight over the element and the card next to it, by writing their
 * styles directly (this runs on every scroll frame, so it skips React state).
 * `transition` is the CSS transition to use, or null to leave it as it is.
 */
function place(target: HTMLElement, spot: HTMLElement, card: HTMLElement, transition: string | null) {
  const rect = target.getBoundingClientRect();
  const viewWidth = document.documentElement.clientWidth;
  const viewHeight = window.innerHeight;

  // The spotlight: the element plus a little padding, cut to the visible screen
  // so a tall section still shows its gold edge.
  const top = Math.max(rect.top - SPOT_PAD, 0);
  const bottom = Math.min(rect.bottom + SPOT_PAD, viewHeight);
  const left = rect.left - SPOT_PAD;
  const width = rect.width + SPOT_PAD * 2;
  const height = Math.max(bottom - top, 0);

  if (transition !== null) {
    spot.style.transition = transition;
    card.style.transition = transition;
  }
  spot.style.top = `${top}px`;
  spot.style.left = `${left}px`;
  spot.style.width = `${width}px`;
  spot.style.height = `${height}px`;

  // The card: below the spotlight if it fits, otherwise above, otherwise
  // (a very tall element) as low as it can go while staying on screen.
  const cardWidth = card.offsetWidth;
  const cardHeight = card.offsetHeight;
  const below = bottom + GAP;
  const above = top - GAP - cardHeight;
  let cardTop: number;
  if (below + cardHeight <= viewHeight - MARGIN) cardTop = below;
  else if (above >= MARGIN) cardTop = above;
  else cardTop = Math.max(MARGIN, viewHeight - cardHeight - MARGIN);
  const cardLeft = Math.min(Math.max(left, MARGIN), viewWidth - cardWidth - MARGIN);

  card.style.top = `${cardTop}px`;
  card.style.left = `${Math.max(cardLeft, MARGIN)}px`;
}

interface TourState {
  /** The steps found on the page, in order. */
  ids: string[];
  /** Which of them is showing. */
  index: number;
  /** The person asked their system for less motion. */
  reduced: boolean;
}

export function Tour() {
  const { profile, ready } = useProfile();
  const shouldRun =
    ready && profile !== null && profile.onboarded && profile.privacy_seen && !profile.tour_done;

  const [tour, setTour] = useState<TourState | null>(null);
  const active = shouldRun && tour !== null;
  const currentId = tour ? tour.ids[tour.index] : "";
  const step = STEPS.find((s) => s.id === currentId);
  const reducedMotion = tour?.reduced ?? false;

  const spotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  // False until the spotlight has been placed once, so it does not slide in
  // from the corner of the screen on the first step.
  const placedRef = useRef(false);
  const titleId = useId();
  const textId = useId();

  // Start a short moment after the page draws. This also runs again when
  // "Replay the walkthrough" sets tour_done back to false.
  useEffect(() => {
    if (!shouldRun) return;
    const timer = setTimeout(() => {
      const ids = presentStepIds();
      if (ids.length === 0) {
        // Nothing to show on this page: count the tour as done.
        updateProfile({ tour_done: true });
        return;
      }
      placedRef.current = false;
      setTour({
        ids,
        index: 0,
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldRun]);

  // For each step: scroll the element into view, place the spotlight and the
  // card, move focus into the card, and keep everything in place while the
  // page scrolls or changes size. A layout effect runs before the browser
  // paints, so the card never shows in the wrong place.
  useLayoutEffect(() => {
    if (!active || !currentId) return;
    const spot = spotRef.current;
    const card = cardRef.current;
    const target = findTarget(currentId);
    if (!spot || !card || !target) return;

    // A section taller than most of the screen is lined up by its top instead.
    const tall = target.getBoundingClientRect().height > window.innerHeight * 0.6;
    target.scrollIntoView({ block: tall ? "start" : "center", behavior: reducedMotion ? "instant" : "smooth" });

    place(target, spot, card, placedRef.current && !reducedMotion ? MOVE : "none");
    placedRef.current = true;
    nextRef.current?.focus({ preventScroll: true });

    // Recompute at most once per frame. While scrolling the spotlight follows
    // the page exactly (no transition); after a resize it keeps its transition.
    let frame = 0;
    let fromScroll = false;
    function schedule(scrolling: boolean) {
      fromScroll = fromScroll || scrolling;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Look the element up again: React may have replaced it.
        const element = findTarget(currentId);
        if (element && spot && card) place(element, spot, card, fromScroll ? "none" : null);
        fromScroll = false;
      });
    }
    const onScroll = () => schedule(true);
    const onResize = () => schedule(false);
    // capture: also hear scrolling inside any scrollable box on the page.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize);
    // The element or the card can change size without the window changing
    // (examples loading in, longer step text).
    const observer = new ResizeObserver(onResize);
    observer.observe(target);
    observer.observe(card);

    // Keep keyboard focus inside the card: if it lands anywhere else, bring
    // it back to the main button.
    function onFocusIn(event: FocusEvent) {
      if (card && !card.contains(event.target as Node)) nextRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("focusin", onFocusIn);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [active, currentId, reducedMotion]);

  if (!active || !tour || !step) return null;

  /** End the tour (finished or skipped) and give focus back to the question box. */
  function finish() {
    setTour(null);
    updateProfile({ tour_done: true });
    // Wait until the card is gone, or the focus trap above would pull focus back.
    setTimeout(() => {
      document.querySelector<HTMLElement>('[data-tour="question"]')?.focus();
    }, 0);
  }

  /** Move one step forward (1) or back (-1). */
  function go(delta: 1 | -1) {
    if (!tour) return;
    // Look again: something may have appeared since the tour started
    // (the example questions load a moment after the page).
    const fresh = presentStepIds();
    const ids = fresh.length > 0 ? fresh : tour.ids;
    let position = ids.indexOf(currentId);
    if (position === -1) position = Math.min(tour.index, ids.length - 1);
    const next = position + delta;
    if (next >= ids.length) finish();
    else if (next >= 0) setTour({ ...tour, ids, index: next });
  }

  // Escape skips. Tab and Shift+Tab go round the card's buttons.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
    if (buttons.length === 0) return;
    event.preventDefault();
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.shiftKey ? (at <= 0 ? buttons.length - 1 : at - 1) : (at + 1) % buttons.length;
    buttons[next].focus();
  }

  const isFirst = tour.index === 0;
  const isLast = tour.index === tour.ids.length - 1;

  // Rendered at the end of <body> so no parent on the page can clip it or
  // put it underneath something else.
  return createPortal(
    <>
      {/* Catches clicks so the page behind cannot be used during the tour. */}
      <div aria-hidden="true" className="fixed inset-0 z-[100]" onMouseDown={(event) => event.preventDefault()} />

      {/* The spotlight. Its shadow darkens the rest of the page. */}
      <div
        ref={spotRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-[101] border-[3px] border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        onKeyDown={onKeyDown}
        // Nearly full width on a phone (12px each side), at most 360px elsewhere.
        style={{ width: "min(360px, calc(100% - 24px))" }}
        className="fixed z-[102] border-2 border-ink bg-paper p-5"
      >
        {/* Announced again by screen readers each time the step changes. */}
        <div aria-live="polite">
          <p className="font-display text-sm font-semibold tracking-wide text-graphite uppercase">
            Step {tour.index + 1} of {tour.ids.length}
          </p>
          <h2 id={titleId} className="mt-1 font-display text-2xl leading-tight font-bold uppercase">
            {step.title}
          </h2>
          <p id={textId} className="mt-2 text-base">
            {step.text}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={finish}
            className="mr-auto min-h-11 cursor-pointer px-1 font-medium underline underline-offset-4"
          >
            Skip
          </button>
          {!isFirst && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="min-h-11 cursor-pointer border-2 border-ink px-4 font-display text-lg font-semibold tracking-wide uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              Back
            </button>
          )}
          <button
            ref={nextRef}
            type="button"
            onClick={() => go(1)}
            className="min-h-11 cursor-pointer bg-cardinal px-5 font-display text-lg font-semibold tracking-wide text-paper uppercase"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
