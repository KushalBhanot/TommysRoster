import { Suspense } from "react";
import { Gate } from "@/components/Gate";
import { JoinForm } from "@/components/JoinForm";

export const metadata = { title: "Join the roster" };

// /join: sign up as someone who took a course. The form reads ?code= from
// the address in the browser, so it is wrapped in Suspense.
export default function JoinPage() {
  return (
    <Gate>
      <Suspense fallback={null}>
        <JoinForm />
      </Suspense>
    </Gate>
  );
}
