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
1. Polish beats scope. One path must work flawlessly end to end: describe what you
   are trying to figure out → see the top 3 matches with reasons → request an intro →
   sign up as someone who took a course.
   Do not add anything outside SPEC.md. If something is ambiguous, pick the simpler
   option and note it.
2. Accuracy is the differentiator. Every match reason must come from what that person
   wrote. Never invent people, courses, or facts. A wrong reason is worse than a
   missing feature.
3. Privacy. The raw form export contains emails and must never be committed. Keep it
   in data/private/ (gitignored). A script writes data/people.csv with the email
   column removed; only that file is committed and loaded. No API returns an email.
4. The demo must not depend on the LLM being up. Only /api/match calls the model at
   request time; if the call fails it falls back to the most recent people with no
   reason, never a crash.
5. Feature freeze is Saturday 10 PM. After that: bug fixes and visual polish only.
6. All code must be written during the event. Open-source libraries are fine.
