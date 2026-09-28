import {Easing, interpolate} from 'remotion';
import * as THREE from 'three';
import {BED, DRESSING, DRESSING_CX, EYE_HEIGHT, WALL} from '../config/room';

/**
 * ONE continuous camera move for the whole walkthrough.
 *
 * Keyframe `frame` values are GLOBAL composition frames (they match the shot
 * table in the README). Each key has a position and a look-at (either a world
 * `target` or an explicit `yaw`/`pitch` for transitional keys).
 *
 * - Position: centripetal THREE.CatmullRomCurve3 through the key positions.
 * - Look-at: interpolated separately — the look direction of every key is
 *   converted to (yaw, pitch), yaw is unwrapped, and a second
 *   THREE.CatmullRomCurve3 runs through those angles. Interpolating angles
 *   (instead of target points) means the view can never whip around when a
 *   target sweeps close to the camera.
 * - Timing: inside every segment, local time is eased with
 *   Easing.inOut(Easing.cubic) blended with linear time (EASE_BLEND) so the
 *   camera "breathes" at each shot without stopping dead; the first and last
 *   segments use Hermite ramps so the move starts and ends at rest.
 *
 * The path is one clockwise orbit of the room (≈490° of yaw in 26 s):
 * entrance → wardrobe → dressing → curtains → double door → bed → hero.
 * Run `npm run check:camera` for per-frame angular velocity and clearance.
 */

type V3 = [number, number, number];

export type CamKey = {
	frame: number;
	pos: V3;
	/** world point to look at … */
	target?: V3;
	/** … or explicit heading: 0° = north (−Z), 90° = east (+X) */
	yaw?: number;
	pitch?: number;
	fov: number;
	shot?: string;
};

const E = EYE_HEIGHT;
const mirrorC: V3 = [DRESSING_CX, DRESSING.mirrorBottom + DRESSING.mirrorH / 2, WALL.south];

export const CAMERA_KEYS: CamKey[] = [
	// 120–240 · Enter: dolly in from just outside the door, glance up while starting the turn
	{frame: 120, pos: [1.35, E, 3.3], yaw: 0, pitch: 0, fov: 60, shot: 'enter'},
	{frame: 165, pos: [1.33, E, 1.9], yaw: 8, pitch: 2, fov: 60},
	{frame: 215, pos: [1.02, E, 0.72], yaw: 40, pitch: 2, fov: 60},
	// 240–360 · Wardrobe + loft cabinets: the turn settles into a slow pan right along the doors
	{frame: 270, pos: [0.0, E, 0.6], yaw: 95, pitch: 3, fov: 60, shot: 'wardrobe'},
	{frame: 325, pos: [-0.95, E, -0.35], yaw: 142, pitch: 1, fov: 60},
	{frame: 360, pos: [-1.08, E, -0.7], yaw: 163, pitch: 0, fov: 60},
	// 360–450 · Dressing unit: gentle push toward the mirror glow
	{frame: 450, pos: [-1.0, 1.55, -0.05], target: mirrorC, fov: 60, shot: 'dressing'},
	// 450–570 · Curtain wall: arc to face the infinity curtains
	{frame: 500, pos: [-0.55, E, 0.25], yaw: 238, pitch: 0, fov: 60, shot: 'curtains'},
	{frame: 545, pos: [-0.2, E, -0.25], yaw: 276, pitch: -2, fov: 60},
	// 570–660 · Double door + zebra blinds: lateral track along the wall
	{frame: 600, pos: [-0.75, E, 0.45], yaw: 326, pitch: -1, fov: 60, shot: 'double-door'},
	{frame: 650, pos: [-0.2, E, 0.5], yaw: 362, pitch: -1, fov: 60},
	// 660–810 · Bed wall reveal: arc toward the backdrop, slow push
	{frame: 735, pos: [-1.2, E, 0.05], yaw: 414, pitch: 0, fov: 60, shot: 'bed'},
	{frame: 810, pos: [-0.75, 1.55, BED.centerZ], target: [WALL.east, 1.4, BED.centerZ], fov: 60},
	// 810–899 · Hero wide: pull back + rise to 1.9 m, FOV → 70°
	{frame: 899, pos: [-1.35, 1.9, -1.3], target: [1.0, 1.72, 0.55], fov: 70, shot: 'hero'},
];

export const WALK_START = CAMERA_KEYS[0].frame;
export const WALK_END = CAMERA_KEYS[CAMERA_KEYS.length - 1].frame;

/** 0 = linear, 1 = full ease in-out per segment */
export const EASE_BLEND = 0.12;

const easeInOut = Easing.inOut(Easing.cubic);
const DEG = Math.PI / 180;

/** Convert every key to (yaw, pitch) in degrees, unwrapping yaw along the path. */
const ANGLES: Array<{yaw: number; pitch: number}> = (() => {
	const out: Array<{yaw: number; pitch: number}> = [];
	let prevYaw = 0;
	for (const k of CAMERA_KEYS) {
		let yaw: number;
		let pitch: number;
		if (k.target) {
			const dx = k.target[0] - k.pos[0];
			const dy = k.target[1] - k.pos[1];
			const dz = k.target[2] - k.pos[2];
			yaw = Math.atan2(dx, -dz) / DEG;
			pitch = Math.atan2(dy, Math.hypot(dx, dz)) / DEG;
		} else {
			yaw = k.yaw ?? prevYaw;
			pitch = k.pitch ?? 0;
		}
		// unwrap to the value closest to the previous key
		while (yaw - prevYaw > 180) yaw -= 360;
		while (yaw - prevYaw < -180) yaw += 360;
		out.push({yaw, pitch});
		prevYaw = yaw;
	}
	return out;
})();

const posCurve = new THREE.CatmullRomCurve3(
	CAMERA_KEYS.map((k) => new THREE.Vector3(...k.pos)),
	false,
	'centripetal',
);
// (yaw°, pitch°, 0) — a Catmull-Rom through the look angles
const lookCurve = new THREE.CatmullRomCurve3(
	ANGLES.map((a) => new THREE.Vector3(a.yaw, a.pitch, 0)),
	false,
	'catmullrom',
	0.5,
);

/** Map a global frame to the spline parameter u ∈ [0, 1]. */
export function frameToU(frame: number): number {
	const n = CAMERA_KEYS.length;
	if (frame <= CAMERA_KEYS[0].frame) return 0;
	if (frame >= CAMERA_KEYS[n - 1].frame) return 1;
	let i = 0;
	while (i < n - 2 && frame >= CAMERA_KEYS[i + 1].frame) i++;
	const a = CAMERA_KEYS[i].frame;
	const b = CAMERA_KEYS[i + 1].frame;
	const s = (frame - a) / (b - a);
	// inner segments: eased/linear blend → knot velocity = (1 − EASE_BLEND)
	const v = 1 - EASE_BLEND;
	let e: number;
	if (i === 0) {
		// Hermite: start at rest, leave with the shared knot velocity
		e = 3 * s * s - 2 * s ** 3 + v * (s ** 3 - s * s);
	} else if (i === n - 2) {
		// Hermite: arrive with the knot velocity, come to rest on the hero frame
		e = v * (s ** 3 - 2 * s * s + s) + 3 * s * s - 2 * s ** 3;
	} else {
		e = s + EASE_BLEND * (easeInOut(s) - s);
	}
	return (i + e) / (n - 1);
}

export type CamState = {pos: THREE.Vector3; target: THREE.Vector3; fov: number; yaw: number; pitch: number};

export function cameraAt(frame: number): CamState {
	const u = frameToU(frame);
	const pos = posCurve.getPoint(u);
	const look = lookCurve.getPoint(u);
	const yaw = look.x * DEG;
	const pitch = look.y * DEG;
	const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
	const fov = interpolate(
		frame,
		CAMERA_KEYS.map((k) => k.frame),
		CAMERA_KEYS.map((k) => k.fov),
		{easing: easeInOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
	return {pos, target: pos.clone().addScaledVector(dir, 3), fov, yaw: look.x, pitch: look.y};
}
