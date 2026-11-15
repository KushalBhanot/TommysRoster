import { Suspense } from "react";
import { CourseScreen } from "@/components/CourseScreen";
import { Gate } from "@/components/Gate";

// /course/[code]: everyone who took one course. The screen reads the course
// code from the address in the browser, so it is wrapped in Suspense.
export default function CoursePage() {
  return (
    <Gate>
      <Suspense fallback={null}>
        <CourseScreen />
      </Suspense>
    </Gate>
  );
}
