import { Inter_Tight, Inter } from "next/font/google";
import { BigType } from "../_variants/BigType";

// Design 10 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Inter_Tight({ variable: "--d-display", subsets: ["latin"] });
const text = Inter({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 10: Big Type" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <BigType />
    </div>
  );
}
