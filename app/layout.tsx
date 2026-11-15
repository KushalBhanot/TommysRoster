import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { AssistantWidget } from "@/components/AssistantWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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
        <SiteHeader />

        <main className="mx-auto w-full max-w-3xl flex-1 px-5">{children}</main>

        <SiteFooter />

        {/* Tommy, the helper in the corner. It hides itself until onboarding is done. */}
        <AssistantWidget />
      </body>
    </html>
  );
}
