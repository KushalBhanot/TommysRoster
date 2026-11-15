"use client";

// The gate around a page: only a person who has signed in, finished
// onboarding and accepted the privacy notice sees it. Everyone else is sent
// to the step they still need. Each page that needs it wraps its content in
// <Gate>; /signin, /welcome and /privacy do not, so they are always open.
// The rules are in SPEC.md ("Gate").

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "./profile";
import { useSessionInfo } from "./session";

export function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, ready } = useProfile();
  const session = useSessionInfo();

  // Where this person has to go first, or null if they may stay.
  let sendTo: string | null = null;
  if (ready) {
    if (!profile) sendTo = "/signin";
    // When only USC Google sign-in is accepted, the profile saved in this
    // browser counts only while the server's signed cookie names the same
    // person. (The server checks again on every request that matters.)
    else if (session && !session.demo && session.email !== profile.email) sendTo = "/signin";
    else if (!profile.onboarded || !profile.privacy_seen) sendTo = "/welcome";
  }

  useEffect(() => {
    if (sendTo) router.replace(sendTo);
  }, [sendTo, router]);

  // The page is always rendered, so Next can prepare it ahead of time, but it
  // stays hidden until the browser has read the profile, and while the person
  // is being sent elsewhere. That way a page never flashes at someone who
  // should not see it. (Nothing private is in the page itself: people and
  // matches come from the API.)
  return <div hidden={!ready || sendTo !== null}>{children}</div>;
}
