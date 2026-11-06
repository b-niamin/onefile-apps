# Artifacts development guide

The rules every app in this repo follows. Humans and AI agents both build from
this file, and every pull request is reviewed against it. Where a rule says
**must**, the checks in `tools/` or the reviewer will block the change.

Contents: [What we build](#1-what-we-build) · [Hard rules](#2-hard-rules) ·
[Naming](#3-naming) · [Where an app goes](#4-where-an-app-goes) ·
[Folder layout](#5-folder-layout) · [Manifest](#6-manifest) ·
[Design and UX](#7-design-and-ux) · [Languages](#8-languages) ·
[Data and storage](#9-data-and-storage) · [Security](#10-security) ·
[Building](#11-building-from-sources) · [Testing](#12-testing) ·
[Review and release](#13-review-and-release) · [Skills](#14-skills) ·
[Definition of done](#15-definition-of-done)

---

## 1. What we build

Small, useful apps that each live in **one HTML file**. A person can open the
file in any browser, or paste it into an AI chat (Claude, ChatGPT, Gemini...)
and ask for it to be shown as an artifact. There is no server, no account and
no install. Data stays on the person's device.

Good candidates replace a small single-purpose phone app: trackers, logs,
calculators, timers, splitters, planners. Anything that needs a backend, an
external API, a large database (food, maps) or sync between people is out of
scope.

## 2. Hard rules

1. **One self-contained HTML file.** All CSS, JS, fonts and images are inline.
   No CDN, no web fonts, no external images, no `fetch`.
2. **No network at all.** No external scripts, trackers, analytics, ads,
   beacons, iframes or embeds. The page carries a strict CSP (see
   [Security](#10-security)) and the smoke test fails on any request.
3. **Data stays local.** Browser storage only (`localStorage`, or IndexedDB if
   really needed). Export and import let people back up and move their data.
4. **English and Polish.** Every app ships both languages with an in-app switch.
   The repo itself (code, docs, manifests' keys) is English.
5. **Open-source assets only.** No logos, brand names, trademarks, stock or
   scraped photos, or anything with an unclear license. Every third-party font,
   icon set or shape is listed in the manifest's `thirdParty` with its license.
6. **Fake sample data.** Sample data is made up and harmless: generic first
   names (Alex, Maya, Tomek, Zoe), invented amounts, and either invented places
   or well-known public ones (a city, a landmark, an airport). Never a real
   person's name, address, email, phone, account number or health data.
7. **Self-explanatory names.** `gym-tracker`, not "IronLog Pro". See
   [Naming](#3-naming).
8. **Phone first.** Designed for a phone and the AI chat artifact viewer, then
   scaled up to desktop. See [Design and UX](#7-design-and-ux).
9. **Every pixel does a job.** No logo, no decorative header or app-name
   banner, no footer, no taglines, credits or version lines in the UI. The
   screen belongs to the person's data and the controls they need.
10. **No AI slop.** Each app may have its own look, but it must be deliberate,
   high quality and pass a design critique (see [Skills](#14-skills)).
11. **Human review.** Nothing becomes `stable` without a maintainer's review.

## 3. Naming

Names must say what the app does, in plain words.

| Thing | Rule | Good | Bad |
|---|---|---|---|
| App type (`appType`, folder) | lowercase kebab-case noun phrase for the job the app does | `gym-tracker`, `habit-tracker`, `trip-expense-splitter`, `water-intake-tracker` | `ironlog`, `tally`, `pocket-ledger`, `split-the-trip` |
| Variant (`variant`, folder) | lowercase kebab-case, 1-3 words on what makes this variant different from its siblings | `muscle-map`, `minimal`, `weekly-grid`, `multi-currency` | `v1`, `v2`, `new`, `final`, `pro`, `alex-version` |
| Variant label (`variantName`) | the same idea in plain words, per language, shown next to the name | "Muscle map" / "Mapa mięśni" | "Pro", "Ultimate" |
| File | always `<appType>-<variant>.html` | `gym-tracker-muscle-map.html` | `index.html`, `app.html` |
| Display name (`name`) | plain name in each language | "Gym Tracker" / "Dziennik treningowy" | "Gym Notebook Pro" |
| In-app title | same as the display name, or no title at all | | |

A variant name never encodes a version or an order. `gym-tracker/minimal` is a
second, different gym tracker next to `gym-tracker/muscle-map`; improvements
to `muscle-map` stay in that folder and only change its `version` (see
[Versioning](#versioning)).

Also avoid AI vendor feature names (Artifacts, Canvas, Gems, GPTs, Spaces,
Studio...) and anything that sounds like an existing product or brand.

## 4. Where an app goes

Every app lives at `apps/<appType>/<variant>/`. Decide like this:

1. **Is it a fix or improvement of an existing variant** (same idea, same data
   format)? Change that variant in place and bump its `version`.
2. **Is it the same job done in a clearly different way** (different layout,
   feature set or audience, e.g. a minimal gym log next to one with a muscle
   map)? Add a **new variant** under the existing `apps/<appType>/` with the
   descriptive variant name (`minimal`, `big-buttons`...).
   A variant must be meaningfully different; near-duplicates are rejected.
3. **Is it a new job?** Create `apps/<new-app-type>/<variant>/`. Check
   `catalog.json` first so you don't create a second name for an existing type
   (`workout-log` when `gym-tracker` exists).

Each variant is independent: its own file, manifest, storage keys, sample data
and version. Variants never share code at runtime.

## 5. Folder layout

```
apps/
  gym-tracker/                       app type
    muscle-map/                      variant
      gym-tracker-muscle-map.html    the app (required)
      manifest.json                  metadata (required)
      README.md                      short description + screenshots (required)
      CHANGELOG.md                   one entry per version (required)
      screenshots/                   generated by tools/screenshots.mjs (required, at least 3)
        phone-light.png
        phone-dark.png
        phone-progress.png
      sample-data/                   importable example data (recommended)
        gym-tracker-sample.json
      src/ + build.py                optional, only when the HTML is built from sources
      assets/                        optional source assets (fonts, SVG) that the build inlines
```

Nothing else goes in a variant folder; `tools/check.py` rejects unknown files.

**Variant README.md** is short and always shows the screenshots. Generate a
starter with `python3 tools/variant_readme.py apps/<appType>/<variant>`, then
write 3-6 feature bullets. Sections: title + one-line description (EN and PL),
screenshots, Features, Use it, Your data, Credits.
Repo-level folders: `schemas/` (manifest schema), `tools/` (checks and
generators), `.ai/` (agent skills), `.github/` (CI and templates).

## 6. Manifest

`manifest.json` follows [`schemas/manifest.schema.json`](schemas/manifest.schema.json).
Start from an existing one. Fields:

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | `1` |
| `id`, `appType`, `variant` | yes | must match the folder: `id` = `<appType>/<variant>` |
| `name`, `variantName`, `description` | yes | objects with one entry per language: `{"en": "...", "pl": "..."}`. Description is one sentence, max 200 chars |
| `version` | yes | semver `MAJOR.MINOR.PATCH`, see [Versioning](#versioning) |
| `dataVersion` | yes | integer version of the stored/exported data structure, starts at 1 |
| `status` | yes | `draft` · `review` · `stable` · `deprecated` |
| `category` | yes | `health-fitness`, `money`, `productivity`, `travel`, `home`, `family`, `learning`, `fun`, `tools` |
| `tags` | yes | 1-12 kebab-case search words |
| `languages` | yes | must include `en`; all apps here use `["en", "pl"]` |
| `entry` | yes | `<appType>-<variant>.html` |
| `license` | yes | SPDX id, normally `MIT` |
| `storage` | yes | every storage key the app writes; keys must be unique across the repo |
| `authors` | yes | GitHub logins of the creators: `[{ "github": "login" }]`. The first is whoever created the variant; add people who made substantial changes. Optional `name` |
| `screenshots` | yes | at least 3: main screen light + dark, and one or more other screens. Each has `file`, `theme`, `device`, optional `caption` and `actions` (`[{"click": "text=Progress"}]`) that `tools/screenshots.mjs` performs before capturing |
| `madeWith` | no | AI tools used, e.g. `["Claude"]`, for transparency |
| `created`, `updated` | no | `YYYY-MM-DD` |
| `dataFormats` | no | what export and import support: `json`, `csv`, `txt`, `ics` |
| `browserApis` | no | features beyond storage: `clipboard`, `file-input`, `download`, `wake-lock`, `vibrate`, `audio`, `notifications`, `camera`... Anything that prompts for permission must be listed |
| `sampleData` | no | files with a description per language |
| `thirdParty` | if any | name, license, URL and usage of every embedded third-party asset |
| `build` | if any | `{"command": "python3 build.py", "sources": "src/"}` |

### Versioning

Every variant has its own [semantic version](https://semver.org/) in
`version`, so anyone can tell a fix from a rebuild:

| Change | Bump | Example | Data |
|---|---|---|---|
| Bug fix, copy or translation fix, visual polish, no new behavior | PATCH | 1.2.0 → 1.2.1 | unchanged |
| New feature or setting that keeps old data and backups working as is | MINOR | 1.2.1 → 1.3.0 | may add optional fields; `dataVersion` unchanged |
| Rebuild, removed feature, or a data structure that older versions can't read | MAJOR | 1.3.0 → 2.0.0 | `dataVersion` + 1, migration required |

Rules:
- Any change to the app file (or `src/`) needs a version bump. Docs and
  screenshots alone don't.
- `dataVersion` is the version of the data the app saves and exports. Write it
  into the stored object and the export. When it goes up, the MAJOR version
  goes up too, and the app must migrate older data on load and on import,
  never silently drop it. Changing storage keys counts as a data change.
- `CHANGELOG.md` gets a `## <version> - <YYYY-MM-DD>` entry for every version,
  with short bullets; mark breaking changes with **Breaking:** and say how
  data is migrated.
- Versions only go up. `0.x` is allowed for drafts that are not public yet.
- `tools/check.py --base origin/main` (run in CI on every PR) fails when the
  app changed without a bump, when `dataVersion` or storage keys changed
  without a MAJOR bump, or when the CHANGELOG entry is missing.

## 7. Design and UX

Read [`.ai/skills/impeccable/SKILL.md`](.ai/skills/impeccable/SKILL.md) and
[`.ai/skills/frontend-design/SKILL.md`](.ai/skills/frontend-design/SKILL.md)
before designing. Apps here are "operate" surfaces: precision and restraint
over spectacle.

**Phone and artifact viewer first**
- Design at 360-430 px wide first; it must work at 320 px and scale to desktop
  (center a column of max ~600 px, or a two-pane layout on wide screens).
- **Use the space well.** No logo, no artificial header, no footer, no
  "made with" or version line, no hero area. The first thing on screen is the
  content or the main control (today's habits, this month's spending).
- The only top bar allowed is a compact functional one (date or selector +
  icon buttons). If it doesn't hold a control, drop it. Credits and the
  version belong in settings or the README, not on the main screen.
- No decorative empty space: tight but breathable spacing, no oversized
  padding or cards around a single number.
- Minimal text: no taglines, subtitles or explanatory paragraphs. Short
  labels; a hint only where an action is not obvious.
- Primary action within thumb reach (bottom bar or floating button). Forms and
  dialogs open as bottom sheets on phones.
- Tabs instead of one long scroll when there are several views.
- Touch targets at least 44 × 44 px. No hover-only controls.
- Respect safe areas (`viewport-fit=cover`, `env(safe-area-inset-*)`).
- No horizontal scroll at any width (the smoke test checks 320, 360, 390, 1280).

**Quality**
- Light and dark themes via `prefers-color-scheme`, both designed, both
  screenshotted.
- WCAG AA contrast, visible focus, labels on every input, real `<button>`s,
  `prefers-reduced-motion` respected.
- Useful empty states and first run (sample data, see below).
- Numbers, dates and currencies formatted with `Intl` for the active language.
- System font stack, or an open-source font subset and embedded as base64
  (keep the file small).

**Avoid AI slop.** Each app gets its own considered look that fits its job.
Do not ship the defaults: Inter-for-everything, purple-to-blue gradients,
cards in cards, icon tiles above every heading, gray text on colored
backgrounds, emoji as icons, glassmorphism for no reason, generic hero
copy. Run `impeccable critique` and `impeccable audit` and fix P0-P1 findings
before asking for review.

## 8. Languages

- English and Polish in every app, with a visible switch (e.g. `EN | PL` in
  the top bar or settings).
- First visit: pick from `navigator.language`, fall back to English. Remember
  the choice in the app's storage.
- All UI strings live in one dictionary object per language; no hardcoded text
  in markup that the switch can't reach. Set `<html lang>` when switching.
- Polish needs proper plural forms (1 trening, 2 treningi, 5 treningów): use
  `Intl.PluralRules` or a small tested plural helper.
- Sample data may stay in one language, but labels around it must switch.

## 9. Data and storage

- **Storage keys** are namespaced and versioned, unique across the repo, and
  listed in the manifest. New apps use `<appType>-<variant>:data` (e.g. `gym-tracker-minimal:data`) and keep a format version inside the saved object. (The first
  four apps keep their original keys.)
- **Store a version** in the saved object and migrate older versions on load.
  Never throw away data you can't parse; keep it and show a recovery option.
- **Survive storage failure.** Private mode and some viewers block storage:
  wrap access in `try/catch`, keep working in memory and say so once.
- **Export** to JSON (full backup, includes app id and format version) and,
  where it makes sense, CSV. Downloads are blocked inside AI chat artifact
  viewers, so always offer **Copy to clipboard** next to Download.
- **Import** validates and sanitizes everything (types, lengths, ranges,
  unknown fields dropped), previews what will change, and offers merge or
  replace. Guard CSV export against formula injection (`=`, `+`, `-`, `@`).
- **Sample data on first run.** Load clearly marked example data on the very
  first visit, with a one-line banner and a one-tap "Clear". Ship the same
  data as `sample-data/<appType>-sample.json` in the export format so people
  can import it.
- Money as integer minor units; dates as ISO `YYYY-MM-DD` in local time.

## 10. Security

- Required `<head>` meta, exactly like this unless a feature needs more:
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'">
  <meta name="referrer" content="no-referrer">
  ```
- Never put user data into `innerHTML` without escaping; prefer
  `textContent` and DOM building.
- Forbidden: `eval`, `new Function`, `document.write`, `fetch`/XHR/WebSocket,
  `<script src>`, `<iframe>`, cookies, service workers, remote URLs in
  `src`/`href`/`url()`.
- No minified third-party code you can't read. Vendored code must be small,
  reviewed and credited in `thirdParty`.
- Permissions (camera, notifications, location) only when the feature truly
  needs them, asked at the moment of use, and listed in `browserApis`.
- See [SECURITY.md](SECURITY.md) for reporting.

## 11. Building from sources

Prefer writing the HTML file directly. When an app grows past ~1,500 lines,
split it into `src/` and add a `build.py` (standard library only) that
concatenates the parts into the single file. The build must be deterministic;
the built file is committed and CI checks it is up to date. See
`apps/gym-tracker/muscle-map/` for the pattern. Frameworks (React via
`web-artifacts-builder`) are allowed only if the bundled result passes every
check here and stays small.

## 12. Testing

Run before every pull request:

```bash
python3 tools/check.py            # manifest schema, file layout, CSP, forbidden APIs, build freshness
node tools/smoke-test.mjs         # opens each app: no requests, no errors, no sideways scroll, EN + PL
node tools/screenshots.mjs apps/<type>/<variant>   # regenerate screenshots after visual changes
python3 tools/catalog.py          # refresh catalog.json and the README table
```

Also test the main flows by hand or with the `webapp-testing` skill: first
run with sample data, add/edit/delete, language switch, export then import
into a fresh profile, storage blocked, dark mode, 320 px width.

## 13. Review and release

1. Build on a branch with `status: "draft"`; share a preview (e.g. an
   artifact) for early feedback on the overall shape.
2. When the shape is right, set `status: "review"`, make the checks green and
   open a pull request. Every change reaches `main` through a pull request
   from a fork (merged by rebase), never by a push to this repository.
3. A maintainer reviews design, copy (both languages), data safety and
   security. Every app is reviewed by a human.
4. On approval set `status: "stable"`, run `tools/catalog.py`, merge.

## 14. Skills

Agent skills live in [`.ai/skills/`](.ai/README.md). Use them like this:

| Skill | Use it for |
|---|---|
| `impeccable` | design direction, `critique` and `audit` before review, `polish`, `harden`, `adapt` (mobile) |
| `frontend-design` | committing to a distinctive visual direction for a new app |
| `webapp-testing` | Playwright scripts to test flows in a real browser |
| `web-artifacts-builder` | only for complex apps that need React; output must still pass all checks |
| `visual-pr` | the pull request description: short, simple English |

## 15. Definition of done

- [ ] Lives in `apps/<appType>/<variant>/`, both names self-explanatory
- [ ] `version` bumped by the semver rules, `dataVersion` and CHANGELOG.md updated
- [ ] Small README.md with features and screenshots; `authors` has your GitHub login
- [ ] One HTML file, strict CSP, no network, `tools/check.py` and smoke test green
- [ ] English and Polish, switch works, `<html lang>` updates
- [ ] Phone-first, works at 320 px, light + dark
- [ ] Space used well: no logo, no artificial header, no footer, minimal text
- [ ] First-run sample data (fake), clearable; same data in `sample-data/`
- [ ] Export (with Copy fallback) and validated import; data versioned
- [ ] Only open-source assets, all listed in `thirdParty`
- [ ] Manifest complete; screenshots (3+) regenerated; catalog refreshed
- [ ] Design critique done; reviewed by a maintainer
