"use client";

// The signed-in person's own data. All of it lives in this browser
// (localStorage) and nowhere else:
// - their profile (name, major, year, courses taken), from sign-in and onboarding
// - the list of intro requests they have sent (the "Sent" page)
// - a random id for this browser, sent along with requests and sign-ups so the
//   person can later ask the server to delete what this browser created
//
// Keeping the profile in the browser means there is no account database to
// protect, and "delete my data" is something the person can really do.
//
// Components read these with the hooks below and re-render when the data
// changes, including when it changes in another tab.

import { useSyncExternalStore } from "react";

export interface Profile {
  /** The USC email used to sign in. Demo sign-in: it is not verified. */
  email: string;
  first_name: string;
  major: string;
  /** "" until onboarding step 2 is done. */
  level: "undergraduate" | "graduate" | "";
  grad_year: string;
  /** Codes of courses they have taken, for example ["CSCI 103", "WRIT 150"]. */
  courses: string[];
  /** True once the three onboarding steps are finished. */
  onboarded: boolean;
  /** True once they have read and accepted the privacy notice. */
  privacy_seen: boolean;
  /** True once the walkthrough has been finished or skipped. */
  tour_done: boolean;
}

/** One intro request this person sent, as shown on the Sent page. */
export interface SentRequest {
  /** Unique within this browser. */
  id: string;
  /** When it was sent, as an ISO date string. */
  sent_at: string;
  person_id: number;
  first_name: string;
  code: string;
  title: string;
  /** The message exactly as it was sent. */
  message: string;
  /** "emailed" = it was emailed to the person; "saved" = stored for a team member to forward. */
  delivery: "emailed" | "saved";
}

const PROFILE_KEY = "roster.profile";
const SENT_KEY = "roster.sent";
const CLIENT_KEY = "roster.client";
// Fired on this page whenever one of the keys above changes (the browser's own
// "storage" event only fires in OTHER tabs).
const CHANGED = "roster-changed";

// ---- reading and writing localStorage -------------------------------------

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage can be blocked (private mode); act as signed out
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the page still works for this visit.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// useSyncExternalStore needs the SAME object back while the data is unchanged,
// so each key remembers the last text it parsed.
function cachedReader<T>(key: string, empty: T) {
  let lastText: string | null = null;
  let lastValue: T = empty;
  return () => {
    const text = read(key);
    if (text !== lastText) {
      lastText = text;
      try {
        lastValue = text ? (JSON.parse(text) as T) : empty;
      } catch {
        lastValue = empty;
      }
    }
    return lastValue;
  };
}

const readProfile = cachedReader<Profile | null>(PROFILE_KEY, null);
const NO_REQUESTS: SentRequest[] = [];
const readSent = cachedReader<SentRequest[]>(SENT_KEY, NO_REQUESTS);

// ---- hooks ------------------------------------------------------------------

/**
 * The signed-in person's profile.
 * - `ready` is false while the page is still being drawn on the server or is
 *   just starting in the browser: nothing is known yet, so show nothing.
 * - once `ready` is true, `profile` is the profile, or null if signed out.
 */
export function useProfile(): { profile: Profile | null; ready: boolean } {
  const value = useSyncExternalStore<Profile | null | undefined>(subscribe, readProfile, () => undefined);
  return { profile: value ?? null, ready: value !== undefined };
}

/** The requests this person has sent, newest first. */
export function useSent(): SentRequest[] {
  return useSyncExternalStore(subscribe, readSent, () => NO_REQUESTS);
}

// ---- changing the data --------------------------------------------------------

/** Start a session for a USC email (replaces any profile already in this browser). */
export function signIn(email: string) {
  const profile: Profile = {
    email: email.trim().toLowerCase(),
    first_name: "",
    major: "",
    level: "",
    grad_year: "",
    courses: [],
    onboarded: false,
    privacy_seen: false,
    tour_done: false,
  };
  write(PROFILE_KEY, JSON.stringify(profile));
}

/** Change some fields of the profile. Does nothing if nobody is signed in. */
export function updateProfile(changes: Partial<Profile>) {
  const current = readProfile();
  if (!current) return;
  write(PROFILE_KEY, JSON.stringify({ ...current, ...changes }));
}

/** Remember a request that was just sent. */
export function addSent(request: Omit<SentRequest, "id" | "sent_at">) {
  const entry: SentRequest = {
    ...request,
    id: crypto.randomUUID(),
    sent_at: new Date().toISOString(),
  };
  write(SENT_KEY, JSON.stringify([entry, ...readSent()]));
}

/**
 * Sign out and remove everything this site saved in this browser: the
 * profile, the sent history and the browser id.
 */
export function clearLocalData() {
  write(PROFILE_KEY, null);
  write(SENT_KEY, null);
  write(CLIENT_KEY, null);
}

/**
 * A random id for this browser, made on first use. It is sent with intro
 * requests and roster sign-ups, so that DELETE /api/me can remove exactly
 * what this browser created and nothing else.
 */
export function clientId(): string {
  let id = read(CLIENT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    write(CLIENT_KEY, id);
  }
  return id;
}

/**
 * What the AI may know about the person asking: their major, level, year and
 * courses. Never their name or email. Spread this into a POST /api/match or
 * POST /api/draft body.
 */
export function askerContext(profile: Profile | null) {
  if (!profile) return {};
  return {
    asker_major: profile.major,
    asker_level: profile.level,
    asker_year: profile.grad_year,
    asker_courses: profile.courses,
  };
}
