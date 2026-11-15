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
  Use the Gemini API with JSON/structured output. Check the current official docs for
  the SDK package and model name; read the model name from env GEMINI_MODEL.
- Env: GEMINI_API_KEY, GEMINI_MODEL. Never commit .env. Provide .env.example.

## Ownership (do not edit outside your area)
- Backend (Leo): app/api/**, lib/**, scripts/**, data/**
- Frontend (teammate): app/** except app/api, components/**, public/**
- Shared, change only by agreement: SPEC.md, package.json

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
→ { matches: [{ person: Person, code: string, courses: string[], reason: string | null }],
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
  rows is replaced by null. Never invent people or facts.
- If the LLM call fails, fall back to the most recent semester first, with reason: null
  and a plain draft_message built in code from the question.
- No people to choose from → matches: [].

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
/  — The main element is a free-text box: "Describe what you're trying to figure out".
     Submitting it calls POST /api/match and shows the top 3 matches with their reasons.
     Below it, course search: one input with autocomplete over /api/courses, showing
     code and "N students", then the most-covered courses as cards. One-line tagline.
/course/[code] — in this order:
  1. Header: course code, "N students took this and are open to questions".
  2. The same question box, scoped to this course (sends code) → top 3 matches.
  3. Everyone who took it: cards with first name, major, grad year, semester,
     professor, what they can help with, and a badge for coffee chats.
  "Ask [name]" on any card opens a modal (message + your USC email) → POST /api/request.
  The message is prefilled with draft_message when the card came from a match.
  A link to /join?code=… for people who took the course.
/join — the sign-up form (same fields as POST /api/people), course code prefilled from
  a ?code= query param. Success state thanks them and links back to the course.

UX rules: mobile-first, works at 380px. Loading, empty, and error states for every
fetch. No login. Clean and calm: white background, generous spacing, one accent
color (USC cardinal #990000) used sparingly, gold only for small highlights.
When a match has reason: null, show the person without a reason line.
Footer line: "Everyone listed here is a USC student who opted in. Matches are suggested
by AI from what they wrote."

Fixtures: the frontend may fall back to its mock fixtures only in development
(NODE_ENV=development), never in a production build. Show a visible "SAMPLE DATA" badge
whenever fixtures are in use or an API response has the header `X-Sample-Data: true`.

## Out of scope for v1
Accounts, chat, payments, professor ratings, email sending, scheduling, admin UI,
AI-written course summaries, content moderation.

## Order of work
1. Backend: people data + GET /api/courses + GET /api/courses/[code]/people on sample
   data. Frontend: the pages against fixtures in the shapes above.
2. lib/llm.ts + POST /api/match.
3. POST /api/request and POST /api/people. Frontend: modal and /join wired to them.
4. Swap in real data, deploy, polish.
