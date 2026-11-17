// usage: node record.mjs <playwright dir> <player.html> <demo.json> <out dir> <name>
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [pw, player, demoPath, out, name] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { chromium } = require(pw);
const demo = JSON.parse(readFileSync(demoPath, 'utf-8'));
const FPS = 12;
const frames = `${out}/${name}-frames`;
rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: demo.width ?? 800, height: demo.height ?? 500 }, deviceScaleFactor: 2 });
await page.goto('file://' + player);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate((d) => window.load(d), demo);
// warm the fonts for every glyph before the first frame
await page.evaluate((d) => window.renderAt(d), duration); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
let i = 0;
for (let t = 0; t <= duration; t += 1000 / FPS) {
  await page.evaluate((x) => window.renderAt(x), t);
  await page.screenshot({ path: `${frames}/${String(i++).padStart(4, '0')}.png` });
}
await browser.close();
const last = `${frames}/${String(i - 1).padStart(4, '0')}.png`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${frames}/%04d.png`, '-vf', 'scale=1280:-2:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'veryslow', '-movflags', '+faststart', '-an', `${out}/${name}.mp4`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', last, '-vf', 'scale=1280:-2:flags=lanczos', `${out}/${name}.png`]);
rmSync(frames, { recursive: true, force: true });
console.log(name, 'frames', i, 'seconds', (duration / 1000).toFixed(1));
