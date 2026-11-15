import Link from "next/link";
import { VARIANTS } from "./_shared/mock";

export const metadata = { title: "Design options" };

const ROUNDS = [
  { round: 2, title: "Round two", note: "Two design-forward directions (6, 7) and three deliberately plain ones (8, 9, 10)." },
  { round: 1, title: "Round one", note: "The first five." },
];

// Index of the design previews. Deliberately plain, so it does not compete
// with the designs it links to.
export default function DesignIndex() {
  return (
    <div className="design-root bg-white px-5 py-12 text-black" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Design options</h1>
        <p className="mt-2 text-[#555]">
          Each one is the same screen: the question box, the wait, three matches and an
          &ldquo;Ask&rdquo; button. They all show the same fixed example and none of them calls
          the API. Type a question or tap an example, then press the button.
        </p>

        {ROUNDS.map(({ round, title, note }) => (
          <section key={round} className="mt-10">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-[#555]">{note}</p>
            <ol className="mt-3 border-t border-black/15">
              {VARIANTS.filter((variant) => variant.round === round).map((variant) => (
                <li key={variant.id} className="border-b border-black/15">
                  <Link href={`/design/${variant.id}`} className="block py-4 hover:bg-black/[0.03]">
                    <span className="text-lg font-semibold">
                      {variant.id}. {variant.name}
                    </span>
                    <span className="mt-1 block text-[#555]">{variant.summary}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
