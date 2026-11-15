# Tommy's Roster — build spec

## What it is
A web app where a USC student describes what they are trying to figure out about a
course, and AI matches them with up to three students who took it and offered to be
asked. Each match comes with a one-sentence reason drawn only from what that person
chose to say about themselves, plus a draft message the asker can send. The asker then
requests an intro. Anyone who took a course can join the roster.
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
One owner for now: Leo builds the backend and the frontend in the same session.
SPEC.md and package.json are changed only on purpose, with a note in the commit.

## Data
Everything about courses comes from the official USC Schedule of Classes, and nothing
about a person is free text that would need moderating.

Course catalog (`npm run fetch-catalog`, scripts/fetch-catalog.ts):
- Reads the public JSON endpoints behind classes.usc.edu, one cached request per
  department per semester, with a short delay between requests.
- Semesters are not hardcoded. The script asks USC which terms exist and takes every
  fall and spring semester from Fall 2024 up to the one in session. A semester that
  has not started yet is left out. Rerunning the script at the start of a semester
  adds it; the app reads its list of semesters from the data.
- data/catalog.json: [{ code, title, department }], undergraduate courses (below 500).
  A code is prefix + number + sequence letter, without USC's flag letters:
  "CHEM 105aLg" is stored as "CHEM 105A", "CSCI 103L" as "CSCI 103".
- data/instructors.json: { "<semester>": { "<code>": [instructor names] } }. A course is
  listed under a semester only if it was offered then. Names come from lecture
  sections only, not discussion, lab or quiz sections.
- data/majors.json: USC bachelor's degree names (USC Catalogue 2023-24).

People (data/demo-people.csv, written by `npm run generate-demo`), one row per person
per course. Columns:
person_id, first_name, major, grad_year, code, semester, professor, help_tags,
about_tags, note, source
- The demo students are invented (first names only). Their courses, semesters and
  professors are real: the generator refuses to write a row whose course is not in the
  catalog, was not offered that semester, or whose professor is not listed for it.
- help_tags (1 to 3, semicolon-separated), exactly from: Workload and time management;
  Exams and how to study; Choosing a professor or section; Taking it with no background
- about_tags (0 to 2), exactly from: Transfer student; International student;
  First-generation student; Switched majors; Pre-med or pre-law
- note: optional, one sentence of personal experience. No checkable claims about the
  course and no opinions about a professor.
- source: "demo" for generated profiles, "real" for people who signed up.

Privacy. An email is collected at sign-up and with an intro request. It is stored only
under data/private/ (gitignored) and no API ever returns one.

Written at runtime (best effort; an in-memory copy is kept too, since some hosts have
read-only or non-persistent disks): data/private/requests.json and
data/private/new-people.json.

## API
All responses JSON. Errors: { "error": string } with a 4xx/5xx status.

Person = { person_id, first_name, major, grad_year, code, title, semester, professor,
           help_tags: string[], about_tags: string[], note, source: "demo" | "real" }
It describes one person in one course. title is the course's official title.

GET /api/courses
→ [{ code, title, people_count }]  courses with at least one person, most people first

GET /api/courses/[code]/people
→ { code, title, people: Person[] }  most recent semester first
The code may be typed any way ("writ150", "CSCI 103L"). A course in the catalog that
nobody has joined returns people: []. A code not in the catalog is a 404.

GET /api/catalog?q=…
→ [{ code, title, people_count }]  up to 8 catalog courses matching a code or title

GET /api/catalog/[code]
→ { code, title, semesters: [{ semester, professors: string[] }] }  newest first
What the sign-up form builds its semester and professor choices from.

GET /api/roster
→ [{ first_name, major, grad_year }]  a few names shown while a search runs

POST /api/match
body { question: string (max 300 chars), code?: string,
       asker_major?: string, asker_year?: string }
→ { status: "matched" | "fallback" | "no_match" | "unclear" | "off_topic" | "unavailable",
    matches: [{ person: Person, reason: string | null, key_phrases: string[] }],
    draft_message: string }
One LLM call via lib/llm.ts. Input: the question and the people (for that course if
code is given, otherwise everyone): their major, grad year, about_tags, and for each
course its semester, professor, help_tags and note. No names and no emails are sent.
Output: up to 3 person_ids ranked, each with a one-sentence reason (at most 20 words)
using only facts from that person's rows, and 1 or 2 key phrases copied from the
reason, which the page shows in bold.
- When the question names a professor, people who took the course with that professor
  come first. The model never gives an opinion about a professor.
- Code validates every person_id and drops any that is not in the list it was given.
  A reason that names a course or a year that is not in that person's rows, or that
  contains stray markup, is replaced by null. A key phrase that is not word for word
  inside the reason is dropped. Never invent people or facts.
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
- Rate limit: 10 requests per minute per IP, kept in memory. Over the limit → 429.
- A course question nobody fits, or a course with no people → status "no_match".

POST /api/request
body { person_id: number, code?: string, question: string, from_email: string }
→ { ok: true }
Reject unless from_email ends in "@usc.edu" and person_id exists (and, when code is
given, that person is listed for that course). question is the message to the person,
max 1000 chars. Store it. Do not send email in v1; the UI says the request was sent.

POST /api/people
body { first_name, email, major, grad_year, code, semester, professor,
       help_tags: string[], about_tags?: string[] }
→ { ok: true }
Join the roster. Only first_name and email are typed. Every other value must be one
the form offered, and is checked again here: major from data/majors.json, code from the
catalog, semester one the course was offered in, professor one listed for that course
that semester, help_tags (1 to 3) and about_tags (0 to 2) from the fixed lists. email
must end in "@usc.edu" and is stored only in data/private/. The person appears in the
lists right away with source "real". Signing up again with the same email for another
course keeps the same person_id.

## Pages
Every page talks to the real API routes.

/  — The main screen.
  1. A large free-text box under the heading "Who on the roster can answer this?",
     with up to three clickable example questions built from the courses that have the
     most people. One button, "Scan the roster" → POST /api/match. There are no fields
     for the asker's major or year here.
  2. While it waits: a few roster rows with a gold bar moving down them.
  3. Up to three numbered entries: first name, major, grad year, the AI's reason with
     its key phrases in bold, course code and title, semester, professor, help_tags and
     about_tags as small chips, the note when there is one, and "Ask [name]".
  4. Below: course search over the whole catalog (GET /api/catalog), showing code,
     title and "N students took this"; with nothing typed, the courses with the most
     people. Each links to its page.
/course/[code] — code and title, a question box scoped to this course, then an entry
  for everyone who took it, and a link to /join?code=… for people who took the course.
/join — the sign-up form (the fields of POST /api/people). First name and USC email
  are typed; major, graduation year, semester and professor are selects; the course is
  searched in the catalog; "I can talk about" and "Any of these describe you?" are
  chips. The course is prefilled from ?code=. Success state links to the course.

"Ask [name]" opens a dialog with an editable message (prefilled with draft_message when
the entry came from a match) and a USC email field → POST /api/request → success state.

Look. A team roster: white page, black type, square corners, ruled rows. Barlow
Condensed in capitals for names, numbers and headings; Barlow for sentences. Cardinal
#990000 is the one action color. Gold #FFCC00 marks a match and nothing else. The
header carries the roster mark (public/roster-mark.png) and the name.
Footer: who made it, where it was built, and three lines about what you see, with the
name set very large across the bottom:
"Matches are suggested by AI from what students wrote about themselves."
"Some profiles are demo data created for this prototype."
"Courses and instructors come from the USC Schedule of Classes."

UX rules: mobile-first, works at 380px. Loading, empty, and error states for every
request. No login. 44px tap targets, visible focus rings, motion 150 to 250ms that
respects prefers-reduced-motion.
An entry with source "demo" carries a small "Demo profile" tag.
When a match has reason: null, show the person without a reason line. For status
"fallback", say that the people shown are simply the most recent ones from that course.
When nobody is returned, the message depends on status: could not read the question,
not about a course, nobody fits yet, or matching is unavailable (with a retry).

## Out of scope for v1
Accounts, chat, payments, professor ratings, email sending, scheduling, admin UI,
AI-written course summaries.

## Order of work
1. Backend, the catalog and the demo roster. Done.
2. The three pages in the chosen design. Done.
3. Deploy, record the demo, polish.
