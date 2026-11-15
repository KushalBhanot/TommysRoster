// The privacy statement, in one place. It is shown in three spots: the notice
// at the end of onboarding, "How your information is used" on /account, and
// the public /privacy page. Every line here has to stay true of the code:
// if the code changes what is stored or sent, change this file with it.

/** What we promise. Short, and first. */
export const PRIVACY_PROMISES = [
  "We never sell your data.",
  "We never use your data to train AI. Anthropic, whose Claude model reads your questions, does not train on it either under its terms for this service, and deletes it within 30 days unless its usage rules or the law require longer.",
  "We share it with nobody else. Two services make the site work: Anthropic (the AI) and Resend (delivers your message by email). Your name and email are never sent to the AI.",
  "You can delete your account and all your data at any time on the Account page. You have the right to access, rectify, or delete your personal data. To exercise these rights, use the Account page.",
];

/** What is kept, where, and what leaves this site. */
export const PRIVACY_DETAILS = [
  "Your onboarding profile (name, major, year, courses) and the list of messages you send are saved in this browser, not in an account on our servers.",
  "Sign-in: with USC Google sign-in you log in on USC's own page. We receive your USC email address and nothing else, never your password. Guest access does not verify the address you type, so it can only delete what was sent from the same browser.",
  "When you search, get a draft message or chat with Tommy, what you typed and your major, level, year and course list are sent to the AI to answer you. We do not store them.",
  "When you ask someone, your message and USC email are stored so the request can be passed on. If it is emailed, the person can reply to your USC address. Your email is never shown on the site.",
  "If you join a course roster, your first name, major, year, and that course, semester and professor are shown to people using the site, and your USC email is stored (never shown) so questions can reach you. Deleting your account removes them.",
];
