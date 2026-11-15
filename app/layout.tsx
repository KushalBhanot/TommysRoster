import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

// Everything that is read as a sentence.
const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Names, numbers and headings, set in capitals like a team roster.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tommy's Roster",
  description:
    "Describe what you're trying to figure out about a USC course and get matched with students who already took it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 pt-5">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            {/* The roster mark: three people, three rows, the middle row gold. */}
            <Image src="/roster-mark.png" alt="" width={46} height={36} priority />
            <span className="font-display text-xl font-semibold tracking-wide whitespace-nowrap uppercase">
              Tommy&rsquo;s Roster
            </span>
          </Link>
          <Link
            href="/join"
            className="ml-auto inline-flex min-h-11 items-center font-medium whitespace-nowrap underline underline-offset-4"
          >
            Join<span className="hidden sm:inline">&nbsp;the roster</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
