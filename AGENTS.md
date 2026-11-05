# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini...)
working in this repo. Humans: see [CONTRIBUTING.md](CONTRIBUTING.md).

## What this repo is

One File Apps: a collection of small apps, each a single self-contained HTML
file with data stored only in the user's browser. The repo holds only apps,
their metadata, docs and the checks. There is no backend and no shared code.

## Before you change anything

1. Read [ARTIFACTS-DEVELOPMENT.md](ARTIFACTS-DEVELOPMENT.md). It is the source
   of truth for every rule (naming, layout, manifest, design, languages, data,
   security, review). Follow it exactly.
2. Load the relevant skills from [`.ai/skills/`](.ai/README.md):
   `impeccable` and `frontend-design` for any UI work, `webapp-testing` for
   browser tests, `web-artifacts-builder` only for React-based apps.
3. Look at `catalog.json` to see what already exists before adding an app type.

## Where things go

- A new app: `apps/<appType>/<variant>/`, where `variant` says what makes it
  different (`muscle-map`, `minimal`), never a number like `v1`. Each variant
  folder holds `<appType>-<variant>.html`, `manifest.json`, `README.md` (short,
  shows the screenshots), `CHANGELOG.md`, `screenshots/` (3+), `sample-data/`.
  App type names are plain and self-explanatory (`gym-tracker`, not a brand-like name).
- `authors` in the manifest is the GitHub login of the person who asked for /
  created the app. Ask for it if you don't know it; never invent one.
- A change to an existing app: edit that variant and bump `version` by semver
  (PATCH fix, MINOR compatible feature, MAJOR breaking or data change with a
  `dataVersion` bump and migration). Add a CHANGELOG.md entry.
- If the HTML is built from `src/`, edit `src/` and run the variant's build;
  never hand-edit the built file.
- Do not add files outside this layout, shared libraries, package managers in
  app folders, or new top-level folders without being asked.

## Non-negotiables

- One HTML file. No external requests of any kind: no CDN, web fonts,
  analytics, `fetch`, iframes. Keep the strict CSP meta.
- English and Polish UI with a switch.
- Phone-first, compact, minimal text, light + dark. Use space well: no logo,
  no artificial header or app-name banner, no footer.
- Only open-source assets, credited in the manifest. No logos or brands.
- Sample data is fake. Never put real personal data anywhere, including
  screenshots, tests and commit messages.
- Escape user data; never use `eval`, `new Function` or `innerHTML` with
  unescaped input.

## Commands

```bash
python3 tools/check.py [apps/<type>/<variant>]       # static checks (needs: pip install jsonschema)
node tools/smoke-test.mjs [apps/<type>/<variant>]    # browser smoke test (needs: npm ci)
node tools/screenshots.mjs apps/<type>/<variant>     # regenerate screenshots
python3 tools/catalog.py                             # refresh catalog.json + README table
```

All four must pass, and screenshots and catalog must be regenerated, before
you open a pull request. Use the PR template and fill in every checklist item.

## Pull requests

- Every change goes through a pull request **from a fork**, including docs
  and tooling. Never push to this repository (no `main`, no branches here).
  Push a branch to the contributor's fork, open the PR against `main`, and
  keep it rebased (`git pull --rebase upstream main`); PRs are merged with
  rebase only, so keep commits clean.
- One app variant per pull request.
- Title: `<appType>/<variant>: <what changed>`.
- New apps start with `"status": "review"`; only a maintainer sets `stable`.
- Do not commit `node_modules/`, test output, personal data or secrets.
