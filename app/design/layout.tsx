import "./design.css";

// Wraps the /design previews. The stylesheet hides the site's own header and
// footer on these pages, so each preview shows only its own design.
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
