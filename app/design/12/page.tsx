import { Atkinson_Hyperlegible_Next, Crimson_Pro } from "next/font/google";
import { Blocks } from "../_variants/Blocks";

// Design 12 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Crimson_Pro({ variable: "--d-display", subsets: ["latin"], style: ["normal", "italic"] });
const text = Atkinson_Hyperlegible_Next({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 12: Blocks" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <Blocks />
    </div>
  );
}
