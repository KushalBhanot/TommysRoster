# Trojan Course Advice — build spec

## What it is
A web app where USC students (1) read real advice from students who took a course,
summarized by AI with every claim linked to the original student quotes, (2) ask a
follow-up question that AI answers only from that advice, and (3) if the advice
doesn't cover it, request an intro to a student who took the course and opted in.
This is advice about succeeding in a COURSE. It is not a professor rating site.

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
Source: data/advice.csv, exported from a Google Form. Columns:
timestamp, code, semester, professor, hours, know_before, tip, avoid,
first_name, major_year, email, open_to

- hours is one of: "0-3", "4-6", "7-10", "11-15", "15+"
- open_to is one of: "no", "questions", "questions+coffee" (map the form's wording)
- Normalize code: uppercase, one space between letters and digits ("writ150" → "WRIT 150").
- Each row gets a stable numeric id (row order). Trim whitespace. Skip rows missing
  code or both know_before and tip.
- email is private. It must never appear in any API response.

Derived files (generated, committed so the app works without live LLM calls):
- data/moderation.json: per advice id → { ok: boolean, reason?: "personal_attack" |
  "academic_integrity" | "pii" | "off_topic" }
- data/briefings.json: per course code → briefing object (see API)
- data/requests.json, data/new-advice.json: appended at runtime (best effort; keep an
  in-memory copy too, since some hosts have read-only or non-persistent disks)

For development before real data arrives, include data/sample-advice.csv with ~12
rows across 3 courses. Every sample row's first_name must be "SAMPLE". A flag
USE_SAMPLE_DATA=true switches to it. Real demo must run with it off.

## Moderation (scripts/moderate.ts)
Classify every advice row with the LLM. Mark not ok if it:
- attacks a named individual personally (criticism of workload/teaching style is fine)
- shares or offers exam questions, answers, old exams, or completed assignments
- contains phone numbers, addresses, or other private info about someone
- is unrelated to the course
Rows marked not ok are excluded everywhere but kept in moderation.json with the reason.

## Briefings (scripts/build-briefings.ts)
For each course with >= 3 ok rows, one LLM call produces:
{ know_before: Point[], how_to_do_well: Point[], watch_out: Point[] }
Point = { point: string, source_ids: number[], professor?: string }

Rules for the prompt and for post-validation in code:
- Use only the provided advice. No outside knowledge about the course or USC.
- Every point must list the ids of the rows that support it.
- If only one student said it, phrase it as one student's view ("One student said…").
  Never write "most students" unless 3+ sources support it.
- If all sources for a point had the same professor, set professor to that name.
- Max 4 points per section, each under 30 words. Plain language.
- After the call, code must verify every source_id exists, is ok, and belongs to that
  course; drop any point that fails. Log what was dropped.
Courses with 1–2 rows get no briefing; the UI shows the raw advice only.

hours_per_week is computed in code, not by the LLM: the distribution over the five
buckets and the median bucket.

## API
All responses JSON. Errors: { "error": string } with a 4xx/5xx status.

GET /api/courses
→ [{ code, advice_count, has_briefing }]  sorted by advice_count desc

GET /api/courses/[code]
→ {
    code, advice_count,
    hours_per_week: { median: string, distribution: Record<string, number> },
    briefing: { know_before: Point[], how_to_do_well: Point[], watch_out: Point[] } | null,
    sources: [{ id, semester, professor, hours, know_before, tip, avoid }],
    people_count: number
  }
404 if the course has no ok rows.

GET /api/courses/[code]/people
→ [{ id, first_name, major_year, semester, professor, open_to }]
Only rows with open_to != "no". No email, ever.

POST /api/courses/[code]/ask
body { question: string }  (max 300 chars)
→ { answer: string, source_ids: number[], covered: boolean,
    suggested_people: Person[] }
The LLM gets the question plus all ok advice for this course and must answer only
from it, citing ids. If the advice doesn't answer the question, covered=false and
answer says so in one sentence. suggested_people: up to 3 from /people, preferring
a professor named in the question, then most recent semester. Validate source_ids
in code as with briefings.

POST /api/courses/[code]/request
body { person_id: number, question: string, from_email: string }
→ { ok: true }
Reject if from_email doesn't end in "@usc.edu" or person isn't open to questions.
Store the request. Do not send email in v1; the UI says the request was sent.

POST /api/advice
body { code, semester, professor?, hours, know_before, tip, avoid?,
       first_name?, major_year?, email?, open_to }
→ { ok: true }
Validate, run the same moderation check on this one row, store it. It appears in
sources immediately if ok; briefings are rebuilt offline.

## Pages
/  — Search. One input with autocomplete over /api/courses, showing code and
     "N students". Below it, the most-covered courses as cards. One-line tagline.
/course/[code] — the main screen, in this order:
  1. Header: course code, "Advice from N students", hours-per-week bar chart.
  2. Briefing: three sections. Each point has a "N sources" chip that expands to
     show the exact student quotes (semester, professor). If no briefing, say
     "Not enough advice yet for a summary" and show the raw advice.
  3. Ask box: question in, answer out with the same source chips. If covered=false,
     show "No one has covered this yet. Ask someone who took it:" with people cards.
  4. People: cards with first name, major/year, semester, professor, and a badge for
     coffee chats. "Ask [name]" opens a modal (question + your USC email) → request.
  5. All advice, newest first. "Add your advice" button.
/contribute — the advice form (same fields as the API), course code prefilled from
  a ?code= query param. Success state thanks them and links back to the course.

UX rules: mobile-first, works at 380px. Loading, empty, and error states for every
fetch. No login. Clean and calm: white background, generous spacing, one accent
color (USC cardinal #990000) used sparingly, gold only for small highlights.
Footer line: "Advice comes from USC students. Summaries are AI-generated and link
to their sources."

## Out of scope for v1
Accounts, chat, payments, professor ratings, email sending, scheduling, admin UI.

## Order of work
1. Skeleton deployed: home page calls GET /api/courses and renders the list.
2. Backend: data loading + /api/courses + /api/courses/[code] on sample data.
   Frontend: course page against that endpoint.
3. moderate + build-briefings scripts; briefing shows with source chips.
4. /ask, /people, /request. Then /contribute and POST /api/advice.
5. Swap in real data, rerun scripts, polish.
