import { Gate } from "@/components/Gate";
import { SentList } from "@/components/SentList";

export const metadata = { title: "Sent" };

// /sent: the intro requests this person has sent. They live only in this
// browser, so the list itself is a client component (components/SentList.tsx)
// that reads the browser store and shows nothing until it has.
export default function SentPage() {
  return (
    <Gate>
      <SentList />
    </Gate>
  );
}
