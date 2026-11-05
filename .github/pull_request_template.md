## What

<!-- Which app variant (apps/<appType>/<variant>) and what changed. One variant per PR. -->

## Screenshots

<!-- 3+ phone screenshots. Regenerate with: node tools/screenshots.mjs apps/<type>/<variant> -->

## Checklist

- [ ] Follows [ARTIFACTS-DEVELOPMENT.md](../ARTIFACTS-DEVELOPMENT.md)
- [ ] Self-explanatory names: `apps/<appType>/<variant>/`, file `<appType>-<variant>.html`
- [ ] Short README.md with screenshots; my GitHub login in `authors`
- [ ] One HTML file, no network requests, strict CSP kept
- [ ] English + Polish, language switch works
- [ ] Phone-first (320-430 px), light + dark, minimal text
- [ ] Space used well: no logo, no artificial header, no footer
- [ ] Sample data is fake; `sample-data/` updated
- [ ] Export (with Copy fallback) and import tested
- [ ] Only open-source assets, listed in `thirdParty`
- [ ] `version` bumped by semver (PATCH fix, MINOR feature, MAJOR breaking + `dataVersion`), CHANGELOG.md entry added
- [ ] `python3 tools/check.py`, `node tools/smoke-test.mjs` pass
- [ ] Screenshots and `catalog.json` regenerated
