# People of USC

Source for [peopleofusc.com](https://peopleofusc.com). Currently a "website in progress" placeholder page, deployed on Vercel.

## Trojan Course Advice

Advice from USC students who took a course, summarized by AI with every point linked
to the student quotes it came from. Built at the AI@USC hackathon. The full spec is in
[SPEC.md](SPEC.md) and the build rules are in [CONTEXT.md](CONTEXT.md).

### Run it

```bash
npm install
cp .env.example .env.local   # keeps USE_SAMPLE_DATA=true, so it runs with no real data
npm run dev                  # http://localhost:3000
```

Try the API:

```bash
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/courses/writ150
```

### Environment

| Variable | What it does |
| --- | --- |
| `GEMINI_API_KEY` | Gemini key. Only the moderation and briefing scripts and `/ask` use it. |
| `GEMINI_MODEL` | Gemini model name. |
| `USE_SAMPLE_DATA` | `true` loads `data/sample-advice.csv` (fake rows, first name `SAMPLE`). Leave it unset for the real demo. |

`.env.local` is gitignored. Never commit a key.

### Data and privacy

The form export has student emails, so it never goes into git.

1. Download the form responses as CSV and save them as `data/private/form-export.csv`.
   The `data/private/` folder is gitignored.
2. Run `npm run prepare-data`. It writes `data/advice.csv` with the email column removed
   and the rows in the same order. If the header row is the form's question text, it maps
   columns by position and prints the mapping so you can check it.
3. Commit `data/advice.csv`. Restart the dev server to load it.

The app only reads `data/advice.csv`, and the loader has no email field at all, so no
API response can include one. An advice id is the row's position in the file, which is
also its position in the raw export.

### Rerunning the scripts

| Command | When to run it | Output |
| --- | --- | --- |
| `npm run prepare-data` | Every time a new form export is downloaded | `data/advice.csv` |

The moderation and briefing scripts come next (step 3 in SPEC.md) and will be listed here.
They need to be rerun, in that order, whenever `data/advice.csv` changes. With sample data
on, they read and write `data/sample-*.json` instead, so sample results never mix with
real ones.

### Who owns what

- Backend: `app/api/**`, `lib/**`, `scripts/**`, `data/**`
- Frontend: `app/**` except `app/api`, `components/**`, `public/**`
- Shared, change only by agreement: `SPEC.md`, `package.json`
