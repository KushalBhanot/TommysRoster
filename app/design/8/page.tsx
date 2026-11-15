import { DM_Serif_Display, Figtree } from "next/font/google";
import { OneBox } from "../_variants/OneBox";

// Design 8 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = DM_Serif_Display({ variable: "--d-display", subsets: ["latin"], weight: "400" });
const text = Figtree({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 8: One Box" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <OneBox />
    </div>
  );
}
