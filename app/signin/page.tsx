import { Suspense } from "react";
import { SignInForm } from "@/components/SignInForm";

export const metadata = { title: "Sign in" };

// /signin: USC Google sign-in when the server has it set up, and the demo
// sign-in (a USC email, no password) when that is allowed.
// The form reads ?error= from the address, which needs a Suspense boundary.
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
