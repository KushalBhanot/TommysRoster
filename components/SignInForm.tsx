"use client";

// /signin: two ways in, depending on how the server is set up
// (GET /api/auth/session says which are on):
//
// 1. "Continue with USC Google": the real one. The button goes to
//    /api/auth/google, the person logs in on USC's own page, and the server
//    keeps their verified address in a signed cookie. No password ever reaches
//    this site.
// 2. Demo sign-in: type a USC email. Only the ending is checked, and the page
//    says so. It is the only way in while Google sign-in is not set up.
//
// Either way the profile itself is kept in this browser (components/profile.ts).

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FIELD, LABEL, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./Onboarding";
import { signIn, useProfile } from "./profile";
import { useSessionInfo } from "./session";

// Something before the @, no spaces, and exactly "@usc.edu" at the end.
const USC_EMAIL = /^[^\s@]+@usc\.edu$/;

// What /api/auth/callback can send back in ?error=.
const SIGN_IN_ERRORS: Record<string, string> = {
  not_usc: "That Google account is not a USC account. Try again and choose the one that ends in @usc.edu.",
  cancelled: "Sign-in was cancelled. Nothing was shared with this site.",
  expired: "That sign-in took too long to finish. Please try again.",
  google: "Google could not confirm your account just now. Please try again.",
  not_configured: "USC Google sign-in is not set up on this server yet.",
};

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, ready } = useProfile();
  const session = useSessionInfo();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const verified = session?.email ?? null;
  // The profile in this browser belongs to whoever is signed in when the
  // server's cookie names the same address, or when demo sign-in is allowed.
  const signedIn = Boolean(profile && session && (verified ? profile.email === verified : session.demo));
  // Where a signed-in person goes next. Someone who typed a demo address and
  // has not finished onboarding stays here, so they can still correct it.
  const next =
    !signedIn || !profile ? null : profile.onboarded && profile.privacy_seen ? "/" : verified ? "/welcome" : null;

  useEffect(() => {
    if (!ready || !session) return;
    // Back from Google with a verified address: it becomes the profile's
    // email. A profile saved under another address is replaced.
    if (verified && profile?.email !== verified) signIn(verified);
    else if (next) router.replace(next);
  }, [ready, session, verified, profile, next, router]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!USC_EMAIL.test(address)) {
      setError("Enter a USC email address that ends in @usc.edu, like ttrojan@usc.edu.");
      return;
    }
    // Signing in again with the same address keeps the onboarding answers
    // already saved; a different address starts a fresh profile.
    if (profile?.email !== address) signIn(address);
    router.push("/welcome");
  }

  // Show nothing until the browser has read the profile and the server has
  // answered, and nothing while moving on, so the form never flashes.
  if (!ready || !session || next || (verified && profile?.email !== verified)) return null;

  const signInError = SIGN_IN_ERRORS[params.get("error") ?? ""];

  return (
    <div className="pt-10 sm:pt-16">
      <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">Sign in</h1>
      <p className="mt-4 max-w-xl text-lg text-graphite">
        Use your USC account to find students who took your courses.
      </p>

      {signInError && (
        <p role="alert" className="mt-6 max-w-xl border-l-4 border-cardinal pl-4 font-semibold text-cardinal">
          {signInError}
        </p>
      )}

      {session.google && (
        <div className="mt-8 max-w-md">
          {/* A plain link: the server sends the browser on to Google and USC. */}
          <a href="/api/auth/google" className={`${PRIMARY_BUTTON} inline-flex w-full items-center justify-center sm:w-auto`}>
            Continue with USC Google
          </a>
          <p className="mt-3 text-sm text-graphite">
            You log in on USC&rsquo;s own page, with your NetID. This site receives your USC email address and
            nothing else, never your password.
          </p>
        </div>
      )}

      {session.demo && (
        <form onSubmit={submit} noValidate className={`max-w-md ${session.google ? "mt-12 border-t border-rule pt-8" : "mt-8"}`}>
          {session.google && (
            <h2 className="mb-4 font-display text-2xl leading-none font-bold uppercase">Or try the demo</h2>
          )}
          <label htmlFor="signin-email" className={LABEL}>USC email</label>
          <input
            id="signin-email"
            type="email"
            required
            autoFocus={!session.google}
            autoComplete="email"
            inputMode="email"
            placeholder="you@usc.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "signin-error" : undefined}
            className={`${FIELD} placeholder:text-[#767676]`}
          />
          {error && (
            <p id="signin-error" role="alert" className="mt-2 font-semibold text-cardinal">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`${session.google ? SECONDARY_BUTTON : PRIMARY_BUTTON} mt-6 w-full justify-center sm:w-auto`}
          >
            {session.google ? "Continue without verifying" : "Continue"}
          </button>
        </form>
      )}

      {/* Honest about what each way of signing in does and does not check. */}
      {session.demo && (
        <p className="mt-10 max-w-xl border-l-4 border-rule pl-4 text-sm text-graphite">
          {session.google
            ? "The demo sign-in is for trying the prototype without a USC account. It only checks that the address ends in @usc.edu and never asks for a password."
            : "Prototype sign-in. A USC deployment would use USC sign-in (NetID). This demo only checks that the address ends in @usc.edu and never asks for a password."}
        </p>
      )}
    </div>
  );
}
