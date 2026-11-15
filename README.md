# People of USC

Source for [peopleofusc.com](https://peopleofusc.com). Currently a "website in progress" placeholder page, deployed on Vercel.

## Trojan Course Advice

Describe what you are trying to figure out about a course, and get matched with up to
three USC students who took it and opted in to be asked. Each match comes with a reason
taken from what that person wrote, and a draft message to send. Built at the AI@USC
hackathon. The full spec is in [SPEC.md](SPEC.md) and the build rules are in
[CONTEXT.md](CONTEXT.md).

### Run it

```bash
npm install
cp .env.example .env.local   # keeps USE_SAMPLE_DATA=true, so it runs with no real data
npm run dev                  # http://localhost:3000
```

Try the API:

```bash
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/courses/writ150/people
```

### Environment

| Variable | What it does |
| --- | --- |
| `GEMINI_API_KEY` | Gemini key. Only `POST /api/match` uses it. Without it, matching falls back to the most recent people with no reason. |
| `GEMINI_MODEL` | Gemini model name. |
| `USE_SAMPLE_DATA` | `true` loads `data/sample-people.csv` (fake rows, first name `SAMPLE`) and adds the header `X-Sample-Data: true` to every API response. Leave it unset for the real demo. |

`.env.local` is gitignored. Never commit a key.

### Data and privacy

The form export has student emails, so it never goes into git.

1. Download the form responses as CSV and save them as `data/private/form-export.csv`.
   The `data/private/` folder is gitignored. Expected columns, in this order: timestamp,
   first_name, major, grad_year, email, code, semester, professor, can_help_with, open_to.
2. Run `npm run prepare-data`. It writes `data/people.csv` with no email in it, gives each
   person a `person_id` (same email, same id), and drops rows with no email or no opt-in.
   If the header row is the form's question text, it maps columns by position and prints
   the mapping so you can check it.
3. Commit `data/people.csv`. Restart the dev server to load it.

The app only reads `data/people.csv`, and the loader has no email field at all, so no API
response can include one. `data/private/person-emails.csv` maps each `person_id` back to
an email so a person can forward intro requests by hand. Intro requests and new sign-ups
are saved under `data/private/` too.

### Rerunning the scripts

| Command | When to run it | Output |
| --- | --- | --- |
| `npm run prepare-data` | Every time a new form export is downloaded | `data/people.csv`, `data/private/person-emails.csv` |

Nothing else is precomputed: matching runs at request time.

### Who owns what

- Backend: `app/api/**`, `lib/**`, `scripts/**`, `data/**`
- Frontend: `app/**` except `app/api`, `components/**`, `public/**`
- Shared, change only by agreement: `SPEC.md`, `package.json`
