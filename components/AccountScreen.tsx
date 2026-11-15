"use client";

// /account: everything a person can do with their own data.
// - see and edit their profile (name, major, level, graduation year, courses)
// - download it, with the list of requests they sent, as a JSON file
// - replay the walkthrough, or read the privacy notice again
// - sign out (removes the profile from this browser)
// - delete their data: the server removes what this browser sent it, then
//   the browser forgets everything too
//
// The profile itself lives only in this browser (components/profile.ts).

import { useRouter } from "next/navigation";
import { useState } from "react";
import MAJORS from "@/data/majors.json";
import { ABOUT_TAGS } from "@/lib/tags";
import { Chips, toggleTag } from "./Chips";
import { CoursePicker, FIELD, LABEL, LevelChoice, MAX_ABOUT, PRIMARY_BUTTON, SECONDARY_BUTTON, gradYears } from "./Onboarding";
import { PrivacyNotice } from "./PrivacyNotice";
import {
  clearLocalData, clientId, signOutLocally, updateProfile, useProfile, useSent, type Profile, type SentRequest,
} from "./profile";
import { endSession, useSessionInfo } from "./session";

const MAX_NAME_CHARS = 40;
const SECTION = "mt-14 border-t-2 border-ink pt-6";
const SECTION_HEADING = "font-display text-3xl leading-none font-bold uppercase";

/**
 * The account page. The Gate in the layout already keeps out anyone who is not
 * signed in; this waits for the profile and then shows the sections.
 */
export function AccountScreen() {
  const { profile, ready } = useProfile();
  const sent = useSent();
  const session = useSessionInfo();
  const [showNotice, setShowNotice] = useState(false);

  if (!ready || !profile) return null;

  // Verified = the server holds a signed cookie from USC Google sign-in for this address.
  const verified = session?.email === profile.email;

  return (
    <div className="pt-10 pb-6 sm:pt-16">
      <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">Account</h1>
      <p className="mt-4 text-lg text-graphite">
        Signed in as <span className="font-semibold break-all text-ink">{profile.email}</span>
      </p>
      {session && (
        <p className="mt-1 text-sm text-graphite">
          {verified
            ? "Verified with USC Google sign-in."
            : "Guest access: this address was typed in, not verified."}
        </p>
      )}

      {/* Keyed by email so a new sign-in in another tab starts the form fresh. */}
      <EditProfile key={profile.email} profile={profile} />

      <YourData profile={profile} sent={sent} onShowNotice={() => setShowNotice(true)} />

      <SignOut />

      <DeleteData verified={verified} />

      {showNotice && <PrivacyNotice mode="read" onClose={() => setShowNotice(false)} />}
    </div>
  );
}

/** The profile as a form: change any of it, then "Save changes". */
function EditProfile({ profile }: { profile: Profile }) {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [major, setMajor] = useState(profile.major);
  const [level, setLevel] = useState(profile.level);
  const [gradYear, setGradYear] = useState(profile.grad_year);
  const [courses, setCourses] = useState(profile.courses);
  const [about, setAbout] = useState(profile.about ?? []);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Any edit after a save hides the "Saved" line, so it never describes old data.
  function edited<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setSaved(false);
    };
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const name = firstName.trim();
    if (!name) return setError("Enter your first name.");
    if (!major) return setError("Choose your major.");
    if (!level) return setError("Choose undergraduate or graduate.");
    if (!gradYear) return setError("Choose your graduation year.");
    setError("");
    updateProfile({ first_name: name, major, level, grad_year: gradYear, courses, about });
    setFirstName(name);
    setSaved(true);
  }

  return (
    <form onSubmit={save} noValidate className={SECTION} aria-labelledby="profile-heading">
      <h2 id="profile-heading" className={SECTION_HEADING}>Your profile</h2>
      <p className="mt-2 text-graphite">Your first name is used to sign the messages we draft for you. It is never sent to the AI.</p>

      <div className="mt-6 grid gap-6">
        <div className="max-w-md">
          <label htmlFor="account-name" className={LABEL}>First name</label>
          <input
            id="account-name"
            required
            maxLength={MAX_NAME_CHARS}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => edited(setFirstName)(e.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="account-major" className={LABEL}>Major</label>
          <select id="account-major" value={major} onChange={(e) => edited(setMajor)(e.target.value)} className={FIELD}>
            <option value="">Choose your major</option>
            {/* A saved major that is no longer on the list stays selectable. */}
            {major && !(MAJORS as string[]).includes(major) && <option>{major}</option>}
            {(MAJORS as string[]).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>

        <LevelChoice name="account-level" value={level} onChange={edited(setLevel)} />

        <div className="max-w-xs">
          <label htmlFor="account-year" className={LABEL}>Graduation year</label>
          <select id="account-year" value={gradYear} onChange={(e) => edited(setGradYear)(e.target.value)} className={FIELD}>
            <option value="">Choose a year</option>
            {gradYears(profile.grad_year).map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="-mt-8">
          <Chips
            legend="Any of these describe you?"
            hint="Optional. Helps us find people on a path like yours."
            tags={ABOUT_TAGS}
            chosen={about}
            onToggle={(tag) => edited(setAbout)(toggleTag(about, tag, MAX_ABOUT))}
          />
        </div>

        <div>
          <h3 className="font-display text-2xl leading-none font-bold uppercase">Courses you&rsquo;ve taken</h3>
          <div className="mt-3">
            <CoursePicker selected={courses} onChange={edited(setCourses)} />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 font-semibold text-cardinal">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" className={PRIMARY_BUTTON}>
          Save changes
        </button>
        <p aria-live="polite" className="font-semibold">
          {saved && "Saved. Your next search uses these details."}
        </p>
      </div>
    </form>
  );
}

/** Download, replay the walkthrough, and read the privacy notice again. */
function YourData({
  profile,
  sent,
  onShowNotice,
}: {
  profile: Profile;
  sent: SentRequest[];
  onShowNotice: () => void;
}) {
  const router = useRouter();

  // Build the file in the browser: nothing is fetched, since everything is here.
  function download() {
    const data = { exported_at: new Date().toISOString(), profile, sent_requests: sent };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tommys-roster-my-data.json";
    link.click();
    // Give the browser a moment to start the download before freeing the file.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function replayWalkthrough() {
    updateProfile({ tour_done: false });
    router.push("/");
  }

  return (
    <section className={SECTION} aria-labelledby="data-heading">
      <h2 id="data-heading" className={SECTION_HEADING}>Your data</h2>
      <p className="mt-2 text-graphite">
        Your profile and the {sent.length === 1 ? "1 message" : `${sent.length} messages`} you sent are saved in this
        browser.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={download} className={SECONDARY_BUTTON}>
          Download my data
        </button>
        <button type="button" onClick={replayWalkthrough} className={SECONDARY_BUTTON}>
          Replay the walkthrough
        </button>
        <button type="button" onClick={onShowNotice} className={SECONDARY_BUTTON}>
          How your information is used
        </button>
      </div>
    </section>
  );
}

/** Sign out: the profile is removed from this browser. */
function SignOut() {
  const router = useRouter();

  async function signOut() {
    // The server forgets its signed cookie first, then the browser its data.
    await endSession();
    signOutLocally();
    router.replace("/signin");
  }

  return (
    <section className={SECTION} aria-labelledby="signout-heading">
      <h2 id="signout-heading" className={SECTION_HEADING}>Sign out</h2>
      <p className="mt-2 max-w-xl text-graphite">
        Signing out removes your profile and your sent history from this browser. To use the site again you sign in
        and fill in your profile again. Requests you already sent stay with the people you asked.
      </p>
      <button type="button" onClick={signOut} className={`${SECONDARY_BUTTON} mt-6`}>
        Sign out
      </button>
    </section>
  );
}

type DeleteState = "idle" | "confirm" | "deleting" | "error";

/**
 * "Delete my data", with a confirm step. The server is asked first; only when
 * it says the data is gone does the browser forget everything too. If the
 * server call fails, nothing in the browser is cleared, so the person can try
 * again (the browser id is what tells the server which records are theirs).
 */
function DeleteData({ verified }: { verified: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<DeleteState>("idle");
  const [error, setError] = useState("");

  async function deleteEverything() {
    setState("deleting");
    setError("");
    try {
      // DELETE is not in components/api.ts, so the request is made here.
      let response: Response;
      try {
        response = await fetch("/api/me", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ client_id: clientId() }),
        });
      } catch {
        throw new Error("Can't reach the server. Check your connection and try again.");
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete your data. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your data. Please try again.");
      setState("error");
      return;
    }
    await endSession();
    clearLocalData();
    router.replace("/signin");
  }

  return (
    <section className={SECTION} aria-labelledby="delete-heading">
      <h2 id="delete-heading" className={SECTION_HEADING}>Delete my account</h2>

      {state === "idle" && (
        <>
          <p className="mt-2 max-w-xl text-graphite">
            Close your account and remove everything you gave this site, here and on our server.
          </p>
          <button type="button" onClick={() => setState("confirm")} className={`${SECONDARY_BUTTON} mt-6`}>
            Delete my account and all data
          </button>
        </>
      )}

      {state !== "idle" && (
        <div className="mt-4 border-2 border-cardinal p-4 sm:p-5" aria-live="polite">
          <p className="font-semibold">This removes:</p>
          <ul className="mt-2 grid list-disc gap-1 pl-5">
            <li>the intro requests you sent, from our server, including your message and USC email;</li>
            <li>your roster sign-ups, which also takes you off those course rosters;</li>
            <li>your profile and sent history from this browser, which signs you out.</li>
          </ul>
          <p className="mt-3 text-graphite">It can&rsquo;t be undone. Messages already emailed to people stay in their inbox.</p>
          {!verified && (
            <p className="mt-3 text-graphite">
              You signed in as a guest, so your address was not verified. Only what was sent from this browser can
              be removed, not what you sent from another phone or computer.
            </p>
          )}

          {state === "error" && (
            <p role="alert" className="mt-4 font-semibold text-cardinal">
              {error} Nothing was removed from this browser.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={deleteEverything}
              disabled={state === "deleting"}
              className={PRIMARY_BUTTON}
            >
              {state === "deleting" ? "Deleting…" : state === "error" ? "Try again" : "Yes, delete everything"}
            </button>
            <button
              type="button"
              onClick={() => setState("idle")}
              disabled={state === "deleting"}
              className={`${SECONDARY_BUTTON} disabled:cursor-default disabled:opacity-50`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
