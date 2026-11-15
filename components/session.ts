"use client";

// What the server knows about this browser's sign-in (GET /api/auth/session):
// - email:  the USC address Google verified, or null
// - google: USC Google sign-in is set up on this server
// - demo:   typing a USC email (unverified) is accepted as signing in
// Asked once per page load and shared by every component that needs it.

import { useEffect, useState } from "react";

export interface SessionInfo {
  email: string | null;
  google: boolean;
  demo: boolean;
}

// If the server cannot be reached, behave like the plain demo: nothing else
// on the site works without the server anyway.
const UNKNOWN: SessionInfo = { email: null, google: false, demo: true };

let pending: Promise<SessionInfo> | null = null;

function loadSession(): Promise<SessionInfo> {
  pending ??= fetch("/api/auth/session", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : UNKNOWN))
    .then((data: Partial<SessionInfo> | null) => ({
      email: typeof data?.email === "string" ? data.email : null,
      google: data?.google === true,
      demo: data?.demo !== false,
    }))
    .catch(() => UNKNOWN);
  return pending;
}

/** The sign-in state from the server, or null while it is still being asked. */
export function useSessionInfo(): SessionInfo | null {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  useEffect(() => {
    let current = true;
    void loadSession().then((loaded) => {
      if (current) setInfo(loaded);
    });
    return () => {
      current = false;
    };
  }, []);
  return info;
}

/** Sign out on the server: it forgets the signed cookie. Never throws. */
export async function endSession(): Promise<void> {
  pending = null;
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // The cookie expires on its own; the browser's data is cleared regardless.
  }
}
