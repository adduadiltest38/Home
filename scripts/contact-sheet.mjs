// Build a labelled contact sheet from out/stills/*.jpg → out/stills/contact.jpg
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(ROOT, 'out/stills');
const want = process.argv.slice(2);
const files = fs
	.readdirSync(dir)
	.filter((f) => /^frame-\d+\.jpg$/.test(f))
	.filter((f) => !want.length || want.includes(String(Number(f.slice(6, 10)))))
	.sort();
const W = 960;
const H = 540;
const cols = 2;
const rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(
	files.map(async (f, i) => {
		const label = Buffer.from(
			`<svg width="${W}" height="${H}"><rect x="0" y="0" width="150" height="40" fill="rgba(0,0,0,0.6)"/><text x="12" y="28" font-size="24" fill="#fff" font-family="DejaVu Sans">${f.slice(6, 10)}</text></svg>`,
		);
		const input = await sharp(path.join(dir, f)).resize(W, H).composite([{input: label}]).toBuffer();
		return {input, left: (i % cols) * W, top: Math.floor(i / cols) * H};
	}),
);
await sharp({create: {width: W * cols, height: H * rows, channels: 3, background: '#000'}})
	.composite(tiles)
	.jpeg({quality: 82})
	.toFile(path.join(dir, 'contact.jpg'));
console.log(`contact sheet: ${files.length} stills`);
