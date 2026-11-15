import { AccountScreen } from "@/components/AccountScreen";
import { Gate } from "@/components/Gate";

export const metadata = { title: "Account" };

// /account: see, edit, download or delete your own data, and sign out.
// Everything runs in the browser, where the profile is kept.
export default function AccountPage() {
  return (
    <Gate>
      <AccountScreen />
    </Gate>
  );
}
