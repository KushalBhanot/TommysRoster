import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { TrojanCard } from "../_variants/TrojanCard";

// Design 2 uses exactly two typefaces; they are exposed to the page as the
// CSS variables --d-display and --d-text (see ../design.css).
const display = Bricolage_Grotesque({ variable: "--d-display", subsets: ["latin"] });
const text = IBM_Plex_Mono({ variable: "--d-text", subsets: ["latin"], weight: ["400", "500"] });

export const metadata = { title: "Design 2: Trojan Card" };

export default function Page() {
  return (
    <div className={`${display.variable} ${text.variable}`}>
      <TrojanCard />
    </div>
  );
}
