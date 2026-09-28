// Generates every texture in public/textures/ from the reference photos plus
// a couple of procedural maps. Re-run with `npm run textures`.
//
//   floor_granite.jpg  – cropped from IMG_4 floor, flattened, mirror-tiled
//   teak_door.jpg      – cropped from the IMG_3 door arch panel, mirror-tiled
//   walnut_grain.jpg   – procedural, tileable, grain runs vertically (V axis)
//   fabric_normal.jpg  – procedural, tileable plain-weave normal map
//
// Also downsizes any oversized reference photo in public/ref/ to 1500px wide
// (the video is 1080p; the phone originals are 12–16 MB each).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REF = path.join(ROOT, 'public/ref');
const OUT = path.join(ROOT, 'public/textures');
fs.mkdirSync(OUT, {recursive: true});

// ---------------------------------------------------------------- helpers
async function cropFrac(file, fx, fy, fw, fh) {
	const img = sharp(path.join(REF, file));
	const m = await img.metadata();
	return img.extract({
		left: Math.round(m.width * fx),
		top: Math.round(m.height * fy),
		width: Math.round(m.width * fw),
		height: Math.round(m.height * fh),
	});
}

/** Divide out low-frequency lighting so the patch is evenly lit. */
async function flatten(buf, w, h, blurSigma) {
	const src = await sharp(buf).resize(w, h).removeAlpha().raw().toBuffer();
	const low = await sharp(src, {raw: {width: w, height: h, channels: 3}})
		.blur(blurSigma)
		.raw()
		.toBuffer();
	// global mean per channel
	const mean = [0, 0, 0];
	for (let i = 0; i < src.length; i++) mean[i % 3] += src[i];
	for (let c = 0; c < 3; c++) mean[c] /= w * h;
	const out = Buffer.alloc(src.length);
	for (let i = 0; i < src.length; i++) {
		const v = (src[i] / Math.max(low[i], 1)) * mean[i % 3];
		out[i] = Math.max(0, Math.min(255, Math.round(v)));
	}
	return out;
}

/** Mirror-tile a raw RGB buffer 2×2 so every edge is seamless. */
function mirrorTile(raw, w, h) {
	const W = w * 2;
	const H = h * 2;
	const out = Buffer.alloc(W * H * 3);
	for (let y = 0; y < H; y++) {
		const sy = y < h ? y : H - 1 - y;
		for (let x = 0; x < W; x++) {
			const sx = x < w ? x : W - 1 - x;
			const si = (sy * w + sx) * 3;
			const di = (y * W + x) * 3;
			out[di] = raw[si];
			out[di + 1] = raw[si + 1];
			out[di + 2] = raw[si + 2];
		}
	}
	return {raw: out, width: W, height: H};
}

function saveJpg(raw, width, height, name, quality = 88) {
	return sharp(raw, {raw: {width, height, channels: 3}})
		.jpeg({quality, mozjpeg: true})
		.toFile(path.join(OUT, name));
}

// Deterministic PRNG + periodic value noise (tileable).
function hash(x, y, seed) {
	let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y, px, py, seed) {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = smooth(x - xi);
	const yf = smooth(y - yi);
	const m = (v, p) => ((v % p) + p) % p;
	const a = hash(m(xi, px), m(yi, py), seed);
	const b = hash(m(xi + 1, px), m(yi, py), seed);
	const c = hash(m(xi, px), m(yi + 1, py), seed);
	const d = hash(m(xi + 1, px), m(yi + 1, py), seed);
	return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
function fbm(x, y, px, py, seed, oct = 4) {
	let s = 0;
	let amp = 0.5;
	let f = 1;
	for (let o = 0; o < oct; o++) {
		s += amp * vnoise(x * f, y * f, px * f, py * f, seed + o * 17);
		amp *= 0.5;
		f *= 2;
	}
	return s;
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// ---------------------------------------------------------------- refs
async function downsizeRefs() {
	for (const f of fs.readdirSync(REF)) {
		if (!/\.png$/i.test(f)) continue;
		const p = path.join(REF, f);
		const m = await sharp(p).metadata();
		if (m.width <= 1500) continue;
		const buf = await sharp(p).resize(1500).png({compressionLevel: 9}).toBuffer();
		fs.writeFileSync(p, buf);
		console.log(`downsized ${f} ${m.width}px -> 1500px`);
	}
}

// ---------------------------------------------------------------- granite
async function granite() {
	// Evenly lit floor patch near the camera in IMG_4. Stretch vertically ×1.6
	// to undo the perspective foreshortening of the speckles.
	const crop = await (await cropFrac('IMG_4.png', 0.22, 0.86, 0.56, 0.13)).toBuffer();
	const w = 512;
	const h = 512;
	const flat = await flatten(crop, w, h, 40);
	const t = mirrorTile(flat, w, h);
	await saveJpg(t.raw, t.width, t.height, 'floor_granite.jpg');
}

// ---------------------------------------------------------------- teak
async function teak() {
	// Interior of the left arched upper panel of the IMG_3 double door.
	const crop = await (await cropFrac('IMG_3.png', 0.376, 0.4424, 0.038, 0.087)).toBuffer();
	const w = 256;
	const h = 768;
	const flat = await flatten(crop, w, h, 60);
	// the phone photo is quite red; tone it toward natural teak
	const toned = await sharp(flat, {raw: {width: w, height: h, channels: 3}})
		.modulate({saturation: 0.7, brightness: 1.18, hue: 8})
		.raw()
		.toBuffer();
	const t = mirrorTile(toned, w, h);
	await saveJpg(t.raw, t.width, t.height, 'teak_door.jpg');
}

// ---------------------------------------------------------------- walnut
async function walnut() {
	const W = 512;
	const H = 1024;
	const dark = hex('#3A281B');
	const mid = hex('#5A3A22');
	const light = hex('#6F5038');
	const raw = Buffer.alloc(W * H * 3);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const u = x / W;
			const v = y / H;
			// Grain lines run along V: warp the U coordinate with low-freq noise.
			const warp = fbm(u * 3, v * 1, 3, 1, 3, 3);
			const g = Math.sin((u * 36 + warp * 1.6) * Math.PI * 2) * 0.5 + 0.5;
			const streak = fbm(u * 96, v * 3, 96, 3, 9, 2);
			const pores = hash(x, Math.floor(y / 5), 5) > 0.95 ? 0.25 : 0;
			const band = fbm(u * 6 + warp, v * 0.5, 6, 1, 21, 3);
			let t = 0.18 + 0.22 * Math.pow(g, 4) + 0.35 * streak + 0.3 * band - pores * 0.3;
			t = Math.max(0, Math.min(1, t));
			const c = t < 0.5 ? mix(dark, mid, t * 2) : mix(mid, light, (t - 0.5) * 2);
			const i = (y * W + x) * 3;
			raw[i] = c[0];
			raw[i + 1] = c[1];
			raw[i + 2] = c[2];
		}
	}
	// pull saturation down a touch so warm 3000K light doesn't push it to mahogany
	const toned = await sharp(raw, {raw: {width: W, height: H, channels: 3}}).modulate({saturation: 0.82}).raw().toBuffer();
	await saveJpg(toned, W, H, 'walnut_grain.jpg', 90);
}

// ---------------------------------------------------------------- fabric
async function fabricNormal() {
	const S = 512;
	const threads = 64; // weave repeats per tile
	const height = new Float32Array(S * S);
	for (let y = 0; y < S; y++) {
		for (let x = 0; x < S; x++) {
			const u = (x / S) * threads;
			const v = (y / S) * threads;
			const cu = Math.floor(u);
			const cv = Math.floor(v);
			const over = (cu + cv) % 2 === 0;
			const fu = u - cu;
			const fv = v - cv;
			// warp threads bulge along u, weft along v
			const hw = Math.sin(fu * Math.PI);
			const hf = Math.sin(fv * Math.PI);
			const n = fbm(x / 32, y / 32, S / 32, S / 32, 7, 3) * 0.35;
			height[y * S + x] = (over ? hw * 0.9 + hf * 0.3 : hf * 0.9 + hw * 0.3) + n;
		}
	}
	const raw = Buffer.alloc(S * S * 3);
	const strength = 2.2;
	for (let y = 0; y < S; y++) {
		for (let x = 0; x < S; x++) {
			const hL = height[y * S + ((x - 1 + S) % S)];
			const hR = height[y * S + ((x + 1) % S)];
			const hD = height[((y + 1) % S) * S + x];
			const hU = height[((y - 1 + S) % S) * S + x];
			let nx = (hL - hR) * strength;
			let ny = (hD - hU) * strength;
			let nz = 1;
			const l = Math.hypot(nx, ny, nz);
			nx /= l;
			ny /= l;
			nz /= l;
			const i = (y * S + x) * 3;
			raw[i] = Math.round((nx * 0.5 + 0.5) * 255);
			raw[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
			raw[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
		}
	}
	await saveJpg(raw, S, S, 'fabric_normal.jpg', 92);
}

await downsizeRefs();
await Promise.all([granite(), teak(), walnut(), fabricNormal()]);
console.log('textures written to', path.relative(ROOT, OUT));
