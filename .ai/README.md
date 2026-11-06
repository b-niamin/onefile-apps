# .ai

Agent skills used to build and review apps in this repo. They are vendored
(copied in) so every contributor and every agent uses the same version.

| Skill | Source | License | Use it for |
|---|---|---|---|
| [impeccable](skills/impeccable/SKILL.md) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 ([LICENSE](skills/impeccable/LICENSE.txt), [NOTICE](skills/impeccable/NOTICE.md)) | design direction, `critique`, `audit`, `polish`, `harden`, `adapt` |
| [frontend-design](skills/frontend-design/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Apache-2.0 | choosing a distinctive, non-generic visual direction |
| [webapp-testing](skills/webapp-testing/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Apache-2.0 | Playwright tests of app flows |
| [web-artifacts-builder](skills/web-artifacts-builder/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder) | Apache-2.0 | React apps bundled into one HTML file (rarely needed here) |
| [visual-pr](skills/visual-pr/SKILL.md) | [humanlayer/skills](https://github.com/humanlayer/skills/tree/main/plugins/visual-pr) | MIT ([LICENSE](skills/visual-pr/LICENSE.txt)) | short pull request descriptions |

Installed with the [skills.sh](https://skills.sh) CLI; versions are pinned by
content hash in [`../skills-lock.json`](../skills-lock.json).

## Agent folders

Agents look for skills in different places. They all point here:

- `.claude/skills` → `../.ai/skills` (Claude Code)
- `.agents/skills` → `../.ai/skills` (Codex, Cursor, Gemini CLI and others that read `.agents/`)

Create the links with `tools/link-agent-skills.sh` (they are committed as
symlinks; rerun only if your checkout lost them).

## Updating or adding a skill

```bash
tools/update-skills.sh                                   # refresh all of them to the latest upstream
tools/update-skills.sh owner/repo skill-name             # add another skill
```

Review the diff before committing: skills run with the agent's permissions.
Only add skills under an open-source license, and add a row to the table above.

## Repo-specific notes for skills

- Our rules in [ARTIFACTS-DEVELOPMENT.md](../ARTIFACTS-DEVELOPMENT.md) win over
  any skill. In particular: no web fonts or CDN links (frontend-design and
  impeccable may suggest Google Fonts; embed an open-source subset instead),
  and every app is one HTML file.
- `impeccable live` and its design hooks are not needed here; use the
  `critique` and `audit` commands on a single app file.
- `web-artifacts-builder` targets claude.ai artifacts with React + shadcn/ui.
  Use it only when an app really needs a framework, and the bundle must still
  pass `tools/check.py` and the smoke test.
- `visual-pr` writes the pull request body. Run it as `/visual-pr` (Claude
  Code) or ask your agent to follow its `SKILL.md`. Keep it short: simple
  English, short sentences, one-word bullets are fine. Add the `Screenshots`
  and `Checklist` sections from the PR template for app changes. Its draft
  goes to `.humanlayer/`, which is git-ignored.
