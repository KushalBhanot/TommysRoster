import Link from "next/link";
import "./design.css";

// Wraps the /design previews. The stylesheet hides the site's own header and
// footer on these pages, so each preview shows only its own design.
//
// The bar at the top is not part of any design. It says that a preview shows
// the same fixed people whatever is typed, because the previews do not call
// the AI; real matching only runs on the home page.
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <p className="design-note">
        Design preview: the three people shown are a fixed example and do not depend on what you type.{" "}
        <Link href="/">Real AI matching is on the home page</Link>.
      </p>
      {children}
    </>
  );
}
