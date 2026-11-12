# Shared AI project instructions (Claude Code / Codex / Cursor / Antigravity)

## At the start of each task
1. Read `ai-memory/PROJECT_STATE.md`, `ai-memory/DECISIONS.md`, `ai-memory/NEXT_STEPS.md`, and `ai-memory/RESEARCH.md`.
2. Inspect the relevant source code and, when Git is present, recent commits (`git log -5 --oneline`).
3. Treat the actual code as authoritative if notes disagree with it.
4. Do not assume access to previous conversations in another AI tool.

## While working
- Preserve the project's conventions and existing architecture unless requested otherwise.
- Keep changes scoped to the current task; avoid modifying unrelated files.
- Do not expose or record secrets, passwords, API keys, private customer data, or `.env` values.
- Ask before destructive actions or broad refactors.

## At the end of a task
- Summarize files changed, tests run (and not run), and any remaining issues.
- Update `ai-memory/PROJECT_STATE.md` if implemented functionality or architecture changed.
- Log consequential technical decisions in `ai-memory/DECISIONS.md` with rationale.
- Update `ai-memory/NEXT_STEPS.md` with verified next steps and blockers.
- If you implemented a recommendation from `ai-memory/RESEARCH.md`, mark that entry as implemented (with the commit or files).
- Do not create a Git commit or push unless the user explicitly requested it or another explicitly enabled project workflow requires it.

## External research
`ai-memory/RESEARCH.md` holds findings from external research (web pages, documentation, an agent's browser research) with sources. Treat them as input to verify against the code and official documentation, not as facts about this repository.

## Switching agents
The next agent may be Claude Code, Codex, Cursor, or Antigravity. Leave concise factual notes so another agent can continue without the original chat transcript.
