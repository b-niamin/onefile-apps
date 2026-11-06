# Contributing

Thanks for helping. This repo only contains apps, their metadata and the
checks around them, so contributions are one of:

- **a new app type** (a job no app does yet)
- **a new variant** of an existing app type (the same job, done differently)
- **a fix or improvement** to an existing variant
- **a translation fix** (every app is English + Polish)

## 1. Check it fits

Read [ARTIFACTS-DEVELOPMENT.md](ARTIFACTS-DEVELOPMENT.md), at least the hard
rules and naming. In short: one HTML file, no network, data stays on the
device, English + Polish, phone-first, open-source assets only, fake sample
data, plain names. For a new app type or variant, open an
[App idea issue](../../issues/new/choose) first so nobody builds the same thing twice.

## 2. Set up

```bash
# 1. Fork b-niamin/onefile-apps on GitHub, then:
git clone https://github.com/<your-login>/onefile-apps && cd onefile-apps
git remote add upstream https://github.com/b-niamin/onefile-apps
git switch -c <app-type>-<variant>-<short-change>
pip install jsonschema
npm ci && npx playwright install chromium
```

Building with an AI agent? It will read [AGENTS.md](AGENTS.md) and the skills
in [`.ai/`](.ai/README.md). AI-assisted contributions are welcome; you are
responsible for reviewing what you submit, and please list the tool in the
manifest's `madeWith`.

## 3. Build

```bash
cp -r apps/habit-tracker/weekly-grid apps/<app-type>/<variant>   # variant = what makes it different
```

Rename the HTML file to `<app-type>-<variant>.html`, rewrite the app, then
update `manifest.json` (new `id`, names in both languages, your GitHub login
in `authors`, unique storage keys, `version` 1.0.0, `status` "review").
Replace the sample data with your own made-up data, and write a short
`README.md` (`python3 tools/variant_readme.py apps/<app-type>/<variant>` gives you a
starter).

## 4. Check

```bash
python3 tools/check.py apps/<app-type>/<variant>
node tools/smoke-test.mjs apps/<app-type>/<variant>
node tools/screenshots.mjs apps/<app-type>/<variant>
python3 tools/catalog.py
```

Then test by hand on a real phone if you can: first run, add/edit/delete,
EN/PL switch, export then import, dark mode.

## 5. Open a pull request

One variant per pull request, titled `<app-type>/<variant>: <what changed>`.
Keep the description short, in simple English; the template has three short
sections plus a checklist. With an AI agent, use the `visual-pr` skill from
[`.ai/`](.ai/README.md).
**Every change goes through a pull request from a fork**, maintainers' own
changes included. Nobody pushes to `main` or creates branches in this
repository; work in your fork and open the PR from there. The history of `main` stays linear: pull requests are merged with **rebase
only** (no merge commits, no squash). Keep your branch up to date with
`git pull --rebase upstream main`, never merge `main` into it, and keep commits
small and meaningful because each one lands on `main` as is. CI runs the same checks; a maintainer reviews
design, copy in both languages, data safety and security, and marks the app
`stable` when it is ready.

## Licensing of contributions

By contributing you agree your code is released under the [MIT License](LICENSE)
and your sample data under CC0. Only include third-party material under an
open-source license, credited in `thirdParty` in the manifest.
