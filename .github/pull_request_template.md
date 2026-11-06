<!-- Title: <appType>/<variant>: <what changed>. One variant per PR. Short, simple English. -->

## Why the change

<!-- One sentence. -->

## Special things to note

- None.

## Change outline

<!-- Short tree or diff blocks, no prose changelog. -->

## Screenshots

<!-- Apps only. 3+ phone screenshots: node tools/screenshots.mjs apps/<type>/<variant> -->

## Checklist

<!-- Apps only. Delete for docs or tooling. -->

- [ ] Follows [ARTIFACTS-DEVELOPMENT.md](../ARTIFACTS-DEVELOPMENT.md)
- [ ] Self-explanatory names: `apps/<appType>/<variant>/`, file `<appType>-<variant>.html`
- [ ] Short README.md with screenshots; my GitHub login in `authors`
- [ ] One HTML file, no network requests, strict CSP kept
- [ ] English + Polish, language switch works
- [ ] Phone-first (320-430 px), light + dark, minimal text
- [ ] Space used well: no logo, no artificial header, no footer
- [ ] Every screen checked against the [UI rules](../ARTIFACTS-DEVELOPMENT.md#ui-rules) (any broken "(default)" rule explained under What)
- [ ] Sample data is fake; `sample-data/` updated
- [ ] Export (with Copy fallback) and import tested
- [ ] Only open-source assets, listed in `thirdParty`
- [ ] `version` bumped by semver (PATCH fix, MINOR feature, MAJOR breaking + `dataVersion`), CHANGELOG.md entry added
- [ ] `python3 tools/check.py`, `node tools/smoke-test.mjs` pass
- [ ] Screenshots and `catalog.json` regenerated
