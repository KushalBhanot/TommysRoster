import { Instrument_Sans, Newsreader } from "next/font/google";
import { Shortlist } from "../_variants/Shortlist";

// Design 11 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Newsreader({ variable: "--d-display", subsets: ["latin"], style: ["normal", "italic"] });
const text = Instrument_Sans({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 11: Shortlist" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <Shortlist />
    </div>
  );
}
