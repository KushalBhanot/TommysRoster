import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import { PlainNote } from "../_variants/PlainNote";

// Design 9 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Source_Serif_4({ variable: "--d-display", subsets: ["latin"] });
const text = Source_Sans_3({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 9: Plain Note" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <PlainNote />
    </div>
  );
}
