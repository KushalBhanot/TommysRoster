# Tommy's Roster

Describe what you are trying to figure out about a course, and get matched with up to
three USC students who took it and opted in to be asked. Each match comes with a reason
taken from what that person wrote, and a draft message to send. Built at the AI@USC
hackathon. The full spec is in [SPEC.md](SPEC.md) and the build rules are in
[CONTEXT.md](CONTEXT.md).

### Run it

```bash
npm install
cp .env.example .env.local   # then put your Claude API key in it
npm run dev                  # http://localhost:3000
```

It runs without a key too: matching then only works for questions that name a course,
and shows the most recent people from it with no reason.

Try the API:

```bash
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/courses/csci103/people
curl "http://localhost:3000/api/catalog?q=calculus"
curl -X POST http://localhost:3000/api/match -H 'content-type: application/json' \
  -d '{"question":"I have never coded before. Is CSCI 103 doable?"}'
```

### Environment

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key from the Claude Console. Used by matching, the personal draft and Tommy (the helper). Without it they fall back to plain answers built in code. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-5-5`. Set `claude-sonnet-5-5` for higher quality at a higher price. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. Turn on USC Google sign-in (see below). |
| `AUTH_SECRET` | Needed with the two above. Signs the session cookie. 32+ random characters: `openssl rand -base64 48`. |
| `ALLOW_DEMO_SIGNIN` | Optional. `true` keeps the demo sign-in next to Google sign-in. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional. Email intro requests through Resend instead of only storing them. |

`.env.local` is gitignored. Never commit a key. `.env.example` explains each one.

### Sign-in

- **USC Google sign-in** (real): "Continue with USC Google" sends the browser to Google,
  limited to usc.edu accounts. USC's Google accounts log in on USC's own NetID page, so
  this site never sees a password. Google tells the server the verified address, and
  the server keeps it in a signed, HttpOnly cookie. Set it up with the steps in
  `.env.example` (create an OAuth client in Google Cloud, add the redirect URI
  `https://YOUR-SITE/api/auth/callback`).
- **Demo sign-in**: type a USC email. Only the ending is checked, and the page says so.
  It is the only way in until Google sign-in is set up, and stays next to it when
  `ALLOW_DEMO_SIGNIN=true` (useful for people without a USC account, such as judges).

With Google sign-in on and the demo off, the server only believes its own cookie:
intro requests and roster sign-ups are saved under the verified address whatever the
page sends, and the AI routes and the lists of people answer 401 without a session.

### Email (optional)

Set `RESEND_API_KEY` and an intro request is emailed to the person, with reply-to set to
the asker. The address comes from the person's own sign-up, or from
`data/private/person-emails.json` (`{ "<person_id>": "<email>" }`, gitignored) for
people who did not sign up through the site. Without a verified sending domain, Resend
only delivers to the address the Resend account was created with.

### Data

| File | What it is | Made by |
| --- | --- | --- |
| `data/catalog.json` | 1,595 undergraduate courses (code, title, department) | `npm run fetch-catalog` |
| `data/instructors.json` | Who taught each course in each semester | `npm run fetch-catalog` |
| `data/majors.json` | USC bachelor's degree names (USC Catalogue 2023-24) | copied once from the official list |
| `data/demo-people.csv` | 45 invented students, 99 rows, for the demo | `npm run generate-demo` |

Courses, semesters and professors are never typed by hand: they come from the official
USC Schedule of Classes. The demo students are invented, but every course, semester and
professor attached to them is checked against those files before the CSV is written.

### A new semester

Run `npm run fetch-catalog` and redeploy. The script asks USC which semesters exist and
adds any fall or spring semester that has started; the site reads its list of semesters
from the data, so nothing else needs editing. Add `-- --refresh` to download semesters
it already has again (for example to pick up instructor changes).

### Privacy

The statement users see is in `lib/privacy.ts` (shown after onboarding, on `/account`
and at `/privacy`). What the code does to back it up:

- The profile and the sent history live in the browser only. There is no account database.
- The model is sent no names and no emails. Every person, course, year and phrase in its answer is checked in code before it is shown.
- An email is saved only under `data/private/` (gitignored), the people list in memory has no email field, and no API response includes anyone else's email.
- Questions typed into the search box, the draft and the helper are not stored or logged.
- "Delete my account and all data" on `/account` removes the person's requests and sign-ups from the server, takes them off the roster, ends the session and clears the browser.
- Anthropic's API terms: data sent through the API is not used to train its models and is deleted within 30 days (longer only to enforce its usage policy or comply with the law).

### Known limitations

- Sign-ups and intro requests are stored in memory (plus a local file when the disk is writable), so on a host like Vercel they are lost when the server restarts; a real launch needs a small database behind those two routes.
- The rate limits on the AI routes (per IP, per minute) are also in memory, so they are counted per server instance.
- Intro requests are emailed only when Resend is set up; otherwise they are stored and someone has to forward them.
- The roster itself (demo people, first names, majors, what they offered to talk about) is not encrypted at rest; it holds no emails.

### Layout

- `app/api/**`, `lib/**`: the API routes and the code behind them
- `app/**` (other than `app/api`), `components/**`: the pages
- `scripts/**`, `data/**`: data preparation and the data files
