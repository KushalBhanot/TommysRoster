import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { AskAround } from "../_variants/AskAround";

// Design 4 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Newsreader({ variable: "--d-display", subsets: ["latin"] });
const text = Plus_Jakarta_Sans({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 4: Ask Around" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <AskAround />
    </div>
  );
}
