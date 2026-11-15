# Trojan Course Advice — build spec

## What it is
A web app where a USC student describes what they are trying to figure out about a
course, and AI matches them with up to three students who took it and opted in to be
asked. Each match comes with a one-sentence reason drawn only from what that person
wrote, plus a draft message the asker can send. The asker then requests an intro.
Anyone who took a course can sign up to be listed.
This is about finding the right PERSON to ask. It is not a professor rating site, and
the AI does not write course advice itself.

## Stack
- Next.js (App Router) + TypeScript + Tailwind. One app, no separate backend service.
- No database. Data lives in /data as CSV/JSON files, loaded into memory.
- LLM calls go through lib/llm.ts only, so the provider can be swapped in one place.
  Use the Claude API (official @anthropic-ai/sdk) with JSON/structured output. The
  model name comes from env ANTHROPIC_MODEL and defaults to claude-haiku-5-5.
- Env: ANTHROPIC_API_KEY, ANTHROPIC_MODEL (optional). Never commit .env. Provide
  .env.example.

## Ownership
One owner for now: Leo builds the backend and the first version of the frontend in the
same session, so the earlier backend / frontend split no longer applies. SPEC.md and
package.json are still changed only on purpose, with a note in the commit.

## Data
Source: data/people.csv, one row per person per course. Columns:
person_id, first_name, major, grad_year, code, semester, professor, can_help_with,
open_to

- person_id is the same on every row of the same person.
- open_to is "questions" or "questions+coffee". A row with any other value is not
  loaded: nobody is listed unless they clearly opted in.
- Normalize code: uppercase, one space between letters and digits ("writ150" → "WRIT 150").
- Trim whitespace. Skip rows missing person_id, first_name or code.
- grad_year is kept as text, the way it was typed ("2028").

Privacy. The raw form export contains emails and is never committed:
- It lives in data/private/ (gitignored) as data/private/form-export.csv, with columns
  timestamp, first_name, major, grad_year, email, code, semester, professor,
  can_help_with, open_to (one form response per course).
- `npm run prepare-data` writes data/people.csv from it: email and timestamp removed,
  person_id assigned from the email (same email → same id, numbered in order of first
  appearance, so ids stay stable as responses are appended), rows that did not opt in
  dropped. It also writes data/private/person-emails.csv (person_id → email) so a human
  can forward an intro request.
- Only data/people.csv is committed and loaded. No API returns an email, ever.

Written at runtime (best effort; an in-memory copy is kept too, since some hosts have
read-only or non-persistent disks). Both hold emails, so both stay in data/private/:
- data/private/requests.json
- data/private/new-people.json

For development before real data arrives, include data/sample-people.csv with 15 rows
across 3 courses. Every sample row's first_name must be "SAMPLE". A flag
USE_SAMPLE_DATA=true switches to it. Real demo must run with it off. While the flag is
on, every API response carries the header `X-Sample-Data: true`.

## API
All responses JSON. Errors: { "error": string } with a 4xx/5xx status.

Person = { person_id, first_name, major, grad_year, semester, professor,
           can_help_with, open_to }
It describes one person in one course (semester, professor and can_help_with are the
ones for that course). All values are strings except person_id (number). A missing
optional value is "".

GET /api/courses
→ [{ code, people_count }]  sorted by people_count desc, then code

GET /api/courses/[code]/people
→ Person[]  most recent semester first
A course nobody has signed up for returns [] (200), so the page can show an empty state.

POST /api/match
body { question: string (max 300 chars), asker_major?: string, asker_year?: string,
       code?: string }
→ { status: "matched" | "fallback" | "no_match" | "unclear" | "off_topic" | "unavailable",
    matches: [{ person: Person, code: string, courses: string[], reason: string | null }],
    draft_message: string }
One LLM call via lib/llm.ts. Input: the question, the asker info, and the people (for
that course if code is given, otherwise everyone). Output: up to 3 person_ids ranked,
each with a one-sentence reason using only facts from that person's rows, plus a short
friendly draft message the asker could send.
- person is that person's row for the given course. When no code is given it is the
  row the model based its reason on, or their most recent row. code is the course of
  that row, and courses lists every course code that person is signed up for.
- The model is sent no names and no emails, only person_id, major, grad_year and the
  course rows.
- Code validates every person_id the LLM returns and drops any that is not in the list
  it was given. A reason that names a course or a year that is not in that person's
  rows, or that contains stray markup, is replaced by null. Never invent people or facts.
- The model first says what it was given. Gibberish, a greeting or text too vague to
  read is "unclear"; a real question about something other than a course is
  "off_topic". Both return matches: [] and the page says so plainly. Text that is
  obviously not a sentence (almost no letters, one letter repeated) is "unclear"
  without calling the model at all.
- If the LLM call fails, people are shown only when the course is known: code was
  given, or the question names a course that is on the roster. Then the most recent
  people from that course are returned with reason: null and status "fallback".
  Otherwise status is "unavailable" and matches is []. Nobody is ever suggested for a
  question that could not be read.
- Rate limit: 10 requests per minute per IP, kept in memory. Over the limit → 429 with
  { "error": string }.
- A course question nobody fits, or a course with no people → status "no_match",
  matches: [] and draft_message: "".

POST /api/request
body { person_id: number, code?: string, question: string, from_email: string }
→ { ok: true }
Reject unless from_email ends in "@usc.edu" and person_id exists (and, when code is
given, that person is listed for that course). question is the message to the person,
max 1000 chars. Store it. Do not send email in v1; the UI says the request was sent.

POST /api/people
body { first_name, major, grad_year, email, code, semester, professor?,
       can_help_with, open_to }
→ { ok: true }
Sign up as someone who took a course. email must end in "@usc.edu" and is stored only
in data/private/. code must look like a course code ("WRIT 150", "CSCI 103L"); open_to
must be "questions" or "questions+coffee"; everything except professor is required.
Max lengths: first_name 40, major 60, grad_year 10, semester 20, professor 60,
can_help_with 300. The person appears in the lists right away. Signing up again with
the same email for another course keeps the same person_id.

## Pages
Every page talks to the real API routes. There are no fixtures.

/  — The main screen.
  1. A large free-text box labelled "Describe what you're trying to figure out", with up
     to three clickable example questions under it (built from the courses that have the
     most people, so an example always leads to someone). Optional fields for the
     asker's major and grad year. "Find people" → POST /api/match.
  2. Up to three match entries: first name, major, grad year, the course that makes
     them relevant with its semester and professor, any other courses they took, their
     can_help_with line, the AI's one-sentence reason, and a marker if they are open to
     coffee chats. Each entry has "Ask [name]".
  3. Below: course search over GET /api/courses, each course showing
     "N students took this" and linking to its page.
/course/[code] — the same question box scoped to this course (sends code), then an
  entry for everyone who took it. A link to /join?code=… for people who took the course.
/join — the sign-up form (same fields as POST /api/people), course code prefilled from
  a ?code= query param. Success state thanks them and links back to the course.

"Ask [name]" opens a dialog with an editable message (prefilled with draft_message when
the entry came from a match) and a USC email field → POST /api/request → success state.

UX rules: mobile-first, works at 380px. Loading, empty, and error states for every
request. No login. White background, generous spacing, one accent color (USC cardinal
#990000) used sparingly: the main action and keyboard focus. Gold only for small
markers. Serif type is for words a student wrote (the question, can_help_with, the
message); sans is for the interface and for what the AI wrote.
When a match has reason: null, show the person without a reason line. For status
"fallback", say that the people shown are simply the most recent ones from that course.
When nobody is returned, the message depends on status: could not read the question,
not about a course, nobody fits yet, or matching is unavailable (with a retry).
A visible "SAMPLE DATA" badge in the header while USE_SAMPLE_DATA is on.
Footer line: "Matches are suggested by AI from what students wrote about themselves."

## Out of scope for v1
Accounts, chat, payments, professor ratings, email sending, scheduling, admin UI,
AI-written course summaries, content moderation.

## Order of work
1. Backend: people data, the two GET routes, POST /api/match, /api/request and
   /api/people. Done.
2. Home page end to end. Then /course/[code] and /join.
3. Swap in real data, deploy, polish.
