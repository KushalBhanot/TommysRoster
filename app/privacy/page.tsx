import Link from "next/link";
import { PrivacyStatement } from "@/components/PrivacyNotice";

export const metadata = { title: "Privacy" };

// /privacy: the privacy statement as a page anyone can read, signed in or
// not. The same text is shown at the end of onboarding and on /account.
export default function PrivacyPage() {
  return (
    <div className="pt-10 pb-6 sm:pt-16">
      <h1 className="font-display text-5xl leading-[0.95] font-bold uppercase sm:text-7xl">Your data</h1>
      <p className="mt-4 max-w-xl text-lg text-graphite">
        What Tommy&rsquo;s Roster does with what you give it, in plain words.
      </p>

      <div className="max-w-2xl">
        <PrivacyStatement />
      </div>

      <p className="mt-10 max-w-2xl border-l-4 border-rule pl-4 text-graphite">
        To close your account and delete everything, open{" "}
        <Link href="/account" className="font-semibold text-ink underline underline-offset-4">
          Account
        </Link>{" "}
        and choose &ldquo;Delete my account and all data&rdquo;.
      </p>
    </div>
  );
}
