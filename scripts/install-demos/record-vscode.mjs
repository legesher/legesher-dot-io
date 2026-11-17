// usage: node record-vscode.mjs <playwright dir> <url> <profile dir> <out dir> <name> <file> <word> [<word> ...]
//
// Opens <file> in VS Code's web mode and rests the pointer on each <word> in
// turn, so the Legesher language server's hover card shows. Screenshots are
// taken beside those real actions and joined into the recording.
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [pw, url, profile, out, name, file, ...words] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { chromium } = require(pw);
const frames = `${out}/${name}-frames`;
const REST = { x: 470, y: 290 };
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const context = await chromium.launchPersistentContext(profile, { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2.5 });
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.monaco-workbench', { timeout: 60000 });
await page.waitForTimeout(5000);
const run = async (command) => {
  await page.keyboard.press('F1'); await page.waitForTimeout(500);
  await page.keyboard.type(command); await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
};
// setup, not recorded: the one file open, the caret at its end, nothing else on screen
await run('View: Close All Editors'); await page.waitForTimeout(1200);
await run('Go to File...'); await page.waitForTimeout(700);
await page.keyboard.type(file); await page.waitForTimeout(1200); await page.keyboard.press('Enter');
await page.waitForTimeout(7000);
for (const x of await page.locator('.notification-toast .codicon-notifications-clear').all()) await x.click().catch(() => {});
// a click below the last line puts the caret at the end of the file; the pointer then rests on empty editor
await page.mouse.click(REST.x, REST.y); await page.waitForTimeout(1500);
console.log('status:', JSON.stringify(await page.$$eval('.statusbar-item', (els) => els.map((e) => e.getAttribute('aria-label') || e.textContent).filter(Boolean))));
// recorded from here
let i = 0, on = true; const stamps = []; const shown = [];
const loop = (async () => { while (on) { stamps.push(Date.now()); await page.screenshot({ path: `${frames}/${String(i++).padStart(4, '0')}.png` }); await page.waitForTimeout(40); } })();
await page.waitForTimeout(1400);
for (const [k, word] of words.entries()) {
  const box = await page.locator('.monaco-editor .view-line span span', { hasText: word }).first().boundingBox();
  if (!box) throw new Error(`"${word}" is not in the file`);
  await page.mouse.move(box.x + Math.min(box.width / 2, 20), box.y + box.height / 2, { steps: 14 });
  await page.waitForTimeout(2800);
  shown.push(await page.locator('.monaco-hover:visible').first().innerText().catch(() => '(no hover)'));
  if (k < words.length - 1) { await page.mouse.move(REST.x, REST.y, { steps: 10 }); await page.waitForTimeout(700); }
}
await page.waitForTimeout(1600);
on = false; await loop;
const fps = ((stamps.length - 1) * 1000) / (stamps.at(-1) - stamps[0]);
await context.close();
for (const [k, text] of shown.entries()) console.log('hover on', words[k], '=>', JSON.stringify(text));
const last = `${frames}/${String(i - 1).padStart(4, '0')}.png`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps.toFixed(3), '-i', `${frames}/%04d.png`, '-vf', 'scale=1280:-2:flags=lanczos,fps=12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'veryslow', '-movflags', '+faststart', '-an', `${out}/${name}.mp4`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', last, '-vf', 'scale=1280:-2:flags=lanczos', `${out}/${name}.png`]);
rmSync(frames, { recursive: true, force: true });
console.log(name, 'frames', i, 'measured fps', fps.toFixed(2));
