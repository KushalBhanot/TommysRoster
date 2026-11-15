import { Bodoni_Moda, Work_Sans } from "next/font/google";
import { TheFeature } from "../_variants/TheFeature";

// Design 3 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Bodoni_Moda({ variable: "--d-display", subsets: ["latin"], style: ["normal", "italic"] });
const text = Work_Sans({ variable: "--d-text", subsets: ["latin"] });

export const metadata = { title: "Design 3: The Feature" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <TheFeature />
    </div>
  );
}
