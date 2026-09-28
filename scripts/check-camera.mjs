// QA for the camera path: angular velocity, speed and wall clearance per frame.
//   npm run check:camera
// Bundles src/camera/cameraPath.ts with esbuild (ships with Remotion) and
// samples every frame of the walkthrough.
import {build} from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'campath-')), 'campath.mjs');
await build({
	entryPoints: [path.join(ROOT, 'src/camera/cameraPath.ts')],
	bundle: true,
	format: 'esm',
	platform: 'node',
	outfile: out,
	logLevel: 'error',
});
const {cameraAt, WALK_START, WALK_END, CAMERA_KEYS} = await import(out);
const room = await build({
	entryPoints: [path.join(ROOT, 'src/config/room.ts')],
	bundle: true,
	format: 'esm',
	platform: 'node',
	write: false,
	logLevel: 'error',
});
const roomFile = path.join(path.dirname(out), 'room.mjs');
fs.writeFileSync(roomFile, room.outputFiles[0].text);
const R = await import(roomFile);

const FPS = 30;
const deg = (r) => (r * 180) / Math.PI;

function clearance(p) {
	const {WALL, LOFT_FRONT_Z, ENTRY_X0, ENTRY_DOOR_Z, CURTAINS, BED_HEAD_X} = R;
	const c = [];
	if (p.z < LOFT_FRONT_Z) {
		c.push(p.x - (WALL.west + CURTAINS.sheerOffset), BED_HEAD_X - p.x, p.z - WALL.north, LOFT_FRONT_Z - p.z + (p.x > ENTRY_X0 ? 1 : 0));
		if (p.x > ENTRY_X0) c.push(Math.hypot(p.x - ENTRY_X0, p.z - LOFT_FRONT_Z));
	} else if (p.z < ENTRY_DOOR_Z + 0.25) {
		c.push(p.x - ENTRY_X0, WALL.east - p.x);
	} else {
		c.push(p.x - (ENTRY_X0 - 0.45), WALL.east + 0.45 - p.x);
	}
	return Math.min(...c);
}

let prev = null;
let maxYaw = 0;
let maxYawF = 0;
let maxSpeed = 0;
let maxSpeedF = 0;
let minClear = Infinity;
let minClearF = 0;
let totalYaw = 0;
const rows = [];
for (let f = WALK_START; f <= WALK_END; f++) {
	const s = cameraAt(f);
	const d = s.target.clone().sub(s.pos);
	const yaw = Math.atan2(d.x, -d.z);
	const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
	const cl = clearance(s.pos);
	if (cl < minClear) {
		minClear = cl;
		minClearF = f;
	}
	if (prev) {
		let dy = yaw - prev.yaw;
		while (dy > Math.PI) dy -= 2 * Math.PI;
		while (dy < -Math.PI) dy += 2 * Math.PI;
		const rate = Math.abs(deg(dy)) * FPS;
		totalYaw += Math.abs(deg(dy));
		const spd = s.pos.distanceTo(prev.pos) * FPS;
		if (rate > maxYaw) {
			maxYaw = rate;
			maxYawF = f;
		}
		if (spd > maxSpeed) { maxSpeed = spd; maxSpeedF = f; }
		if (f % 15 === 0)
			rows.push(
				`${String(f).padStart(4)}  pos(${s.pos.x.toFixed(2)}, ${s.pos.y.toFixed(2)}, ${s.pos.z.toFixed(2)})  yaw ${deg(yaw).toFixed(0).padStart(5)}°  pitch ${deg(pitch).toFixed(0).padStart(4)}°  ω ${rate.toFixed(1).padStart(5)}°/s  v ${spd.toFixed(2)} m/s  clear ${cl.toFixed(2)} m  fov ${s.fov.toFixed(0)}`,
			);
	}
	prev = {yaw, pos: s.pos};
}
console.log(rows.join('\n'));
console.log('\nkeyframes:', CAMERA_KEYS.map((k) => k.frame).join(', '));
console.log(`total yaw swept   ${totalYaw.toFixed(0)}° over ${((WALK_END - WALK_START) / FPS).toFixed(1)} s (avg ${(totalYaw / ((WALK_END - WALK_START) / FPS)).toFixed(1)}°/s)`);
console.log(`max yaw rate      ${maxYaw.toFixed(1)}°/s at frame ${maxYawF}`);
console.log(`max speed         ${maxSpeed.toFixed(2)} m/s at frame ${maxSpeedF}`);
console.log(`min clearance     ${minClear.toFixed(2)} m at frame ${minClearF}`);
