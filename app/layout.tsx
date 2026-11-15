import type { Metadata } from "next";
import { Hanken_Grotesk, Libre_Caslon_Text } from "next/font/google";
import Link from "next/link";
import { usingSampleData } from "@/lib/data";
import "./globals.css";

// Sans: the interface and anything the AI wrote.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

// Serif: words a student wrote. Caslon is the family USC's own wordmark uses.
const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tommy's Roster",
  description:
    "Describe what you're trying to figure out about a USC course and get matched with students who already took it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} ${caslon.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 pt-5 sm:px-6 sm:pt-8">
          <Link href="/" className="font-serif text-lg whitespace-nowrap">
            Tommy&rsquo;s Roster
          </Link>
          {usingSampleData() && (
            <span className="rounded-full border border-gold bg-gold/15 px-2 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap">
              SAMPLE DATA
            </span>
          )}
          {/* The short label keeps the header on one line on a 380px phone. */}
          <Link href="/join" className="ml-auto text-sm whitespace-nowrap underline underline-offset-4">
            Join<span className="hidden sm:inline"> the roster</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-5 sm:px-6">{children}</main>

        <footer className="mx-auto w-full max-w-2xl px-5 py-10 text-sm text-graphite sm:px-6">
          Matches are suggested by AI from what students wrote about themselves.
        </footer>
      </body>
    </html>
  );
}
