# Tommy's Roster

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
curl -X POST http://localhost:3000/api/match -H 'content-type: application/json' \
  -d '{"question":"How do I get through the pointers unit?","code":"csci103"}'
```

With `ANTHROPIC_API_KEY` set, each match has a one-sentence `reason`.
Without it (or if the model call fails) the same request still works and returns the
most recent people with `"reason": null`; the server log says why.

### Environment

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key from the Claude Console. Only `POST /api/match` uses it. Without it, matching falls back to the most recent people with no reason. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-5-5`. Set `claude-sonnet-5-5` for higher quality at a higher price. |
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

### Sign-ups and intro requests

`POST /api/people` and `POST /api/request` keep what they receive in memory and also
try to write it to `data/private/new-people.json` and `data/private/requests.json`.

### Known limitations

- Sign-ups and intro requests are stored in memory (plus a local file when the disk is writable), so on a host like Vercel they are lost when the server restarts; a real launch needs a small database behind those two routes.
- The `/api/match` rate limit (10 requests per minute per IP) is also in memory, so it is counted per server instance.

### Rerunning the scripts

| Command | When to run it | Output |
| --- | --- | --- |
| `npm run prepare-data` | Every time a new form export is downloaded | `data/people.csv`, `data/private/person-emails.csv` |

Nothing else is precomputed: matching runs at request time.

### Layout

- `app/api/**`, `lib/**`: the API routes and the code behind them
- `app/**` (other than `app/api`), `components/**`: the pages
- `scripts/**`, `data/**`: data preparation and the data files
