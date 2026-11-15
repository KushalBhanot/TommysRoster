"use client";

// The bar at the top of every page: the roster mark and name on the left and,
// once someone is signed in and through onboarding, their three places on the
// right: what they have sent, joining the roster, and their account.

import Image from "next/image";
import Link from "next/link";
import { useProfile, useSent } from "./profile";

export function SiteHeader() {
  const { profile, ready } = useProfile();
  const sent = useSent();
  // The links only make sense for someone who can use the site.
  const signedIn = ready && profile !== null && profile.onboarded && profile.privacy_seen;

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center gap-2 px-5 pt-5 sm:gap-3">
      <Link href="/" className="flex min-h-11 min-w-11 shrink-0 items-center gap-2 sm:gap-2.5">
        {/* The roster mark: three people, three rows, the middle row gold. */}
        <Image src="/roster-mark.png" alt="" width={46} height={36} priority className="h-7 w-auto sm:h-9" />
        <span className="font-display text-lg font-semibold tracking-wide whitespace-nowrap uppercase max-[359px]:sr-only sm:text-xl">
          Tommy&rsquo;s Roster
        </span>
      </Link>

      {signedIn && (
        <nav aria-label="Your pages" className="ml-auto flex items-center gap-1 sm:gap-5">
          <Link
            href="/sent"
            data-tour="sent"
            className="inline-flex min-h-11 min-w-11 items-center justify-center font-medium whitespace-nowrap underline underline-offset-4"
          >
            Sent{sent.length > 0 && <span className="ml-1">({sent.length})</span>}
          </Link>
          <Link
            href="/join"
            className="inline-flex min-h-11 min-w-11 items-center justify-center font-medium whitespace-nowrap underline underline-offset-4"
          >
            Join<span className="hidden sm:inline">&nbsp;the roster</span>
          </Link>
          <Link
            href="/account"
            data-tour="account"
            aria-label={`Account for ${profile.first_name}`}
            className="inline-flex size-11 items-center justify-center border-2 border-ink font-display text-xl font-bold uppercase transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            {/* Their initial stands in for a photo. */}
            {profile.first_name.charAt(0) || "?"}
          </Link>
        </nav>
      )}
    </header>
  );
}
