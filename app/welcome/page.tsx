import { Onboarding } from "@/components/Onboarding";

export const metadata = { title: "Welcome" };

// /welcome: the three onboarding steps after sign-in, then the privacy notice.
// Everything runs in the browser, where the profile is kept.
export default function WelcomePage() {
  return <Onboarding />;
}
