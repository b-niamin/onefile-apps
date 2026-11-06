# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Project skills live in `.ai/skills/`. Claude Code reads `.claude/skills/`,
  which is a symlink to `../.ai/skills` (run `tools/link-agent-skills.sh` if it
  is missing after a fresh clone on a system without symlink support).
- For UI work invoke `/impeccable` (e.g. `/impeccable critique apps/habit-tracker/weekly-grid`)
  and read the `frontend-design` skill before writing CSS.
- Write pull request descriptions with `/visual-pr`.
- Before showing any screen (artifact, screenshot, PR), check it against the
  UI rules in `ARTIFACTS-DEVELOPMENT.md#ui-rules`.
- Use the `webapp-testing` skill for browser checks; Playwright with Chromium
  is the only test dependency.
- When a person asks to "make an artifact" from an app here, give them the
  single HTML file as is; it already works in the artifact viewer.
