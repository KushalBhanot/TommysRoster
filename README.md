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
| `ANTHROPIC_API_KEY` | Claude API key from the Claude Console. Only `POST /api/match` uses it. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-haiku-5-5`. Set `claude-sonnet-5-5` for higher quality at a higher price. |

`.env.local` is gitignored. Never commit a key.

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

An email is collected when someone joins the roster or asks for an intro. It is saved
only under `data/private/` (gitignored), the people list in memory has no email field at
all, and no API response includes one. The model is sent no names and no emails.

### Known limitations

- Sign-ups and intro requests are stored in memory (plus a local file when the disk is writable), so on a host like Vercel they are lost when the server restarts; a real launch needs a small database behind those two routes.
- The `/api/match` rate limit (10 requests per minute per IP) is also in memory, so it is counted per server instance.
- Intro requests are stored, not emailed. Someone has to forward them.

### Layout

- `app/api/**`, `lib/**`: the API routes and the code behind them
- `app/**` (other than `app/api`), `components/**`: the pages
- `scripts/**`, `data/**`: data preparation and the data files
