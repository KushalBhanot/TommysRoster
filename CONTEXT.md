## Context (read first)
This is a 24-hour hackathon project (AI@USC, hosted by HackSC and USC Student
Government). Submission is due Sunday 11:00 AM PT: a deployed prototype, a 3-minute
demo video, and slides. First-round judging is done from those materials.

Judging criteria:
- Impact & Campus Relevance (30%): a real friction point for USC students
- Technical & AI Execution (25%): AI used effectively, accurately, and securely
- Feasibility & Implementation (25%): could USC Student Government realistically
  deploy this next semester
- User Experience & Design (20%): intuitive, accessible, visually polished

What this means for how you build:
1. Polish beats scope. One path must work flawlessly end to end: search a course →
   read the briefing with sources → ask a question → request an intro → add advice.
   Do not add anything outside SPEC.md. If something is ambiguous, pick the simpler
   option and note it.
2. Accuracy is the differentiator. Every AI claim must trace to a real student quote.
   Never invent advice, numbers, courses, or people. A wrong citation is worse than
   a missing feature.
3. Privacy. The raw form export contains emails and must never be committed. Keep it
   in data/private/ (gitignored). A script writes data/advice.csv with the email
   column removed; only that file is committed and loaded. No API returns an email.
4. The demo must not depend on live LLM latency. Briefings are precomputed and
   committed. Only /ask calls the model at request time; handle its failure with a
   clear message, never a crash.
5. Feature freeze is Saturday 10 PM. After that: bug fixes and visual polish only.
6. All code must be written during the event. Open-source libraries are fine.
