import { Archivo_Black, Archivo } from "next/font/google";
import { Cardinal } from "../_variants/Cardinal";

// Design 5 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Archivo_Black({ variable: "--d-display", subsets: ["latin"], weight: "400" });
const text = Archivo({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 5: Cardinal" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <Cardinal />
    </div>
  );
}
