// Opens every app variant in Chromium at phone size and fails when the page
// makes any network request, logs an error, or scrolls sideways.
//   node tools/smoke-test.mjs [apps/<type>/<variant> ...]
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(process.env.ONEFILE_ROOT || join(import.meta.dirname, '..'));
const SIZES = [{ width: 320, height: 640 }, { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 1280, height: 800 }];

function variantDirs() {
  const args = process.argv.slice(2);
  if (args.length) return args.map((a) => resolve(ROOT, a));
  return readdirSync(join(ROOT, 'apps'), { withFileTypes: true })
    .filter((t) => t.isDirectory())
    .flatMap((t) => readdirSync(join(ROOT, 'apps', t.name), { withFileTypes: true })
      .filter((v) => v.isDirectory())
      .map((v) => join(ROOT, 'apps', t.name, v.name)))
    .filter((d) => existsSync(join(d, 'manifest.json')));
}

const browser = await chromium.launch();
let failures = 0;
for (const dir of variantDirs()) {
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const url = pathToFileURL(join(dir, m.entry)).href;
  for (const viewport of SIZES) {
    for (const lang of m.languages) {
      const ctx = await browser.newContext({ viewport, locale: lang });
      const page = await ctx.newPage();
      const problems = [];
      await ctx.route('**/*', (route) => {
        const u = route.request().url();
        if (u === url || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
        problems.push(`network request: ${u}`);
        return route.abort();
      });
      page.on('pageerror', (e) => problems.push(`page error: ${e}`));
      page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
      await page.goto(url);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) problems.push(`horizontal scroll: ${overflow}px wider than the viewport`);
      const label = `${m.id} ${viewport.width}px ${lang}`;
      if (problems.length) { failures++; console.error(`✗ ${label}\n  ${problems.join('\n  ')}`); }
      else console.log(`✓ ${label}`);
      await ctx.close();
    }
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
