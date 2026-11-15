import { Barlow_Condensed, Barlow } from "next/font/google";
import { RosterBoard } from "../_variants/RosterBoard";

// Design 1 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Barlow_Condensed({ variable: "--d-display", subsets: ["latin"], weight: ["600", "700"] });
const text = Barlow({ variable: "--d-text", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = { title: "Design 1: Roster Board" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <RosterBoard />
    </div>
  );
}
