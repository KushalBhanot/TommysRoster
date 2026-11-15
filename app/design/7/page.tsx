import { Syne, Space_Mono } from "next/font/google";
import { TwoInk } from "../_variants/TwoInk";

// Design 7 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Syne({ variable: "--d-display", subsets: ["latin"] });
const text = Space_Mono({ variable: "--d-text", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });

export const metadata = { title: "Design 7: Two Ink" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <TwoInk />
    </div>
  );
}
