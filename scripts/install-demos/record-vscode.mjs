// usage: node record-vscode.mjs <playwright dir> <url> <profile dir> <out dir> <name>
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [pw, url, profile, out, name] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { chromium } = require(pw);
const frames = `${out}/${name}-frames`;
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const context = await chromium.launchPersistentContext(profile, { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2.5 });
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.monaco-workbench', { timeout: 60000 });
await page.waitForTimeout(5000);
const run = async (command, delay = 0) => {
  await page.keyboard.press('F1'); await page.waitForTimeout(500);
  await page.keyboard.type(command, { delay }); await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
};
const dismiss = async () => {
  const b = page.getByRole('button', { name: 'No Thanks' });
  if (await b.count()) await b.first().click().catch(() => {});
  for (const x of await page.locator('.notification-toast .codicon-notifications-clear').all()) await x.click().catch(() => {});
};
// setup, not recorded: one file open, nothing else on screen
await run('View: Close All Editors'); await page.waitForTimeout(1200);
if (await page.locator('.explorer-folders-view').isVisible().catch(() => false)) {
  await page.locator('.explorer-folders-view').getByText('hello.py').dblclick();
  await page.waitForTimeout(6000);
  await run('View: Toggle Primary Side Bar Visibility'); await page.waitForTimeout(1000);
} else {
  await run('File: Open File...'); await page.waitForTimeout(1500);
  await page.keyboard.type('hello.py'); await page.waitForTimeout(800); await page.keyboard.press('Enter'); await page.waitForTimeout(6000);
}
await dismiss();
await page.locator('.monaco-editor .view-lines').first().click({ position: { x: 260, y: 180 } });
await page.waitForTimeout(1500); await dismiss();
console.log('status:', JSON.stringify(await page.$$eval('.statusbar-item', (els) => els.map((e) => e.getAttribute('aria-label') || e.textContent).filter(Boolean))));
// recorded from here: a screenshot loop beside the real actions
let i = 0, on = true; const stamps = [];
const loop = (async () => { while (on) { stamps.push(Date.now()); await page.screenshot({ path: `${frames}/${String(i++).padStart(4, '0')}.png` }); await page.waitForTimeout(40); } })();
await page.waitForTimeout(1600);
await page.keyboard.press('F1'); await page.waitForTimeout(700);
await page.keyboard.type('Legesher: Show Translation Panel', { delay: 55 }); await page.waitForTimeout(1000);
await page.keyboard.press('Enter');
await page.waitForTimeout(3200);
// give the panel the whole window: the default keys for View: Toggle Maximize Editor Group
await page.keyboard.press('Meta+K'); await page.keyboard.press('Meta+M');
await page.waitForTimeout(5200);
on = false; await loop;
const fps = ((stamps.length - 1) * 1000) / (stamps.at(-1) - stamps[0]);
console.log('tabs:', JSON.stringify(await page.$$eval('.tab .label-name', (els) => els.map((e) => e.textContent))));
await context.close();
const last = `${frames}/${String(i - 1).padStart(4, '0')}.png`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps.toFixed(3), '-i', `${frames}/%04d.png`, '-vf', 'scale=1280:-2:flags=lanczos,fps=12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'veryslow', '-movflags', '+faststart', '-an', `${out}/${name}.mp4`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', last, '-vf', 'scale=1280:-2:flags=lanczos', `${out}/${name}.png`]);
rmSync(frames, { recursive: true, force: true });
console.log(name, 'frames', i, 'measured fps', fps.toFixed(2));
