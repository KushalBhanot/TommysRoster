import { CourseSearch } from "@/components/CourseSearch";
import { Gate } from "@/components/Gate";
import { HomeFinder } from "@/components/HomeFinder";
import { Tour } from "@/components/Tour";

// Home: ask a question and get matched, or browse by course.
// Signed-in people only (see components/Gate.tsx).
export default function Home() {
  return (
    <Gate>
      <div className="pt-10 sm:pt-16">
        <HomeFinder />
      </div>
      <div className="mt-20 sm:mt-28">
        <CourseSearch />
      </div>
      {/* Runs once, right after onboarding; "Replay the walkthrough" on /account starts it again. */}
      <Tour />
    </Gate>
  );
}
