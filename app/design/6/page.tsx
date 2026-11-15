import { Young_Serif, Schibsted_Grotesk } from "next/font/google";
import { Portraits } from "../_variants/Portraits";

// Design 6 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Young_Serif({ variable: "--d-display", subsets: ["latin"], weight: "400" });
const text = Schibsted_Grotesk({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 6: Portraits" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <Portraits />
    </div>
  );
}
