// Generate the screenshots listed in each manifest (phone 390x844).
//   node tools/screenshots.mjs                    # all apps
//   node tools/screenshots.mjs apps/gym-tracker/muscle-map
// A screenshot entry can have `actions` ([{click: selector} | {scroll: selector}])
// to reach a screen other than the first one. The app loads its own fake sample
// data on first run, so screenshots never contain real personal data.
// Needs: npm ci && npx playwright install chromium
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(process.env.ONEFILE_ROOT || join(import.meta.dirname, '..'));
const DEVICES = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1280, height: 800 } };

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
let failed = false;
for (const dir of variantDirs()) {
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const url = pathToFileURL(join(dir, m.entry)).href;
  for (const shot of m.screenshots) {
    const ctx = await browser.newContext({ viewport: DEVICES[shot.device], colorScheme: shot.theme, deviceScaleFactor: 1, locale: 'en-US' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    try {
      await page.goto(url);
      await page.waitForTimeout(500);
      for (const a of shot.actions || []) {
        if (a.click) await page.click(a.click, { timeout: 3000 });
        if (a.scroll) await page.locator(a.scroll).first().scrollIntoViewIfNeeded({ timeout: 3000 });
        await page.waitForTimeout(400);
      }
      const out = join(dir, shot.file);
      mkdirSync(dirname(out), { recursive: true });
      await page.screenshot({ path: out });
    } catch (e) { errors.push(String(e).split('\n')[0]); }
    await ctx.close();
    if (errors.length) { failed = true; console.error(`✗ ${m.id} ${shot.file}\n  ${errors.join('\n  ')}`); }
    else console.log(`✓ ${m.id} ${shot.file}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
