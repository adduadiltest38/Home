// Render QA stills with one bundle (much faster than repeated `remotion still`).
//   node scripts/render-stills.mjs 300 500 620 760 880   → out/stills/frame-XXXX.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const frames = process.argv.slice(2).map(Number);
if (!frames.length) frames.push(300, 500, 620, 760, 880);
const outDir = path.join(ROOT, 'out/stills');
fs.mkdirSync(outDir, {recursive: true});

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'BedroomWalkthrough', browserExecutable, chromiumOptions: {gl: 'angle'}});
for (const frame of frames) {
	const t = Date.now();
	const output = path.join(outDir, `frame-${String(frame).padStart(4, '0')}.jpg`);
	await renderStill({
		serveUrl,
		composition,
		frame,
		output,
		imageFormat: 'jpeg',
		jpegQuality: 90,
		browserExecutable,
		chromiumOptions: {gl: 'angle'},
		timeoutInMilliseconds: 180000,
		onBrowserLog: (l) => {
			if (l.type === 'error' || l.type === 'warning') console.log(`[browser ${l.type}]`, l.text.slice(0, 300));
		},
	});
	console.log(`frame ${frame} → ${path.relative(ROOT, output)} (${((Date.now() - t) / 1000).toFixed(1)} s)`);
}
