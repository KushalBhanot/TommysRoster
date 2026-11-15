// The footer: who made this, where the data comes from, and the name set
// very large and cut off by the bottom of the page. It is cardinal, the
// brand color, with white text (contrast 8.9:1).

import Link from "next/link";

// The people who built the site, in the order they should be listed.
const MADE_BY = ["Kushal Bhanot", "Angela Chen", "Alassane Fofana", "Leo Wan"];

export function SiteFooter() {
  return (
    <footer className="mt-24 overflow-hidden bg-cardinal text-paper">
      <div className="mx-auto max-w-5xl px-5 pt-12 sm:pt-16">
        {/* The gold bar from the logo. */}
        <span aria-hidden="true" className="block h-1.5 w-16 bg-gold" />

        <div className="mt-8 grid gap-8 text-[15px] sm:grid-cols-[1fr_1fr_2fr]">
          <div>
            <h2 className="text-paper/75">Made by</h2>
            <ul className="mt-1">
              {MADE_BY.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-paper/75">Built at</h2>
            <p className="mt-1">AI@USC Hackathon 2026</p>
          </div>
          <div>
            <h2 className="text-paper/75">About what you see</h2>
            <p className="mt-1">Matches are suggested by AI from what students wrote about themselves.</p>
            <p>Courses and instructors come from the USC Schedule of Classes.</p>
            <p className="mt-3">
              {/* The padding makes the link a 44px tap target. */}
              <Link href="/privacy" className="-my-3 inline-block py-3 font-semibold underline underline-offset-4 focus-visible:outline-paper">
                How we protect your data
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* The name, as wide as the page, with its lower edge off the page. */}
      <div aria-hidden="true" className="mt-12 overflow-hidden sm:mt-16">
        <p className="-mb-[0.2em] text-center font-display text-[16vw] leading-[0.85] font-bold whitespace-nowrap uppercase">
          Tommy&rsquo;s Roster
        </p>
      </div>
    </footer>
  );
}
