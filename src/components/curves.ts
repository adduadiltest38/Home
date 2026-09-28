import * as THREE from 'three';

/** Plan-view point: x = world X, y = world Z. */
export type P2 = THREE.Vector2;
const v = (x: number, y: number) => new THREE.Vector2(x, y);

function arc(
	c: P2,
	r: number,
	from: number,
	to: number,
	via: number,
	n: number,
): P2[] {
	// choose the sweep direction whose range contains `via`
	const norm = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
	const ccwSpan = norm(to - from);
	const viaInCcw = norm(via - from) < ccwSpan;
	const span = viaInCcw ? ccwSpan : -(2 * Math.PI - ccwSpan);
	const pts: P2[] = [];
	for (let i = 0; i <= n; i++) {
		const a = from + (span * i) / n;
		pts.push(v(c.x + r * Math.cos(a), c.y + r * Math.sin(a)));
	}
	return pts;
}

/**
 * Crescent = outer disc minus an offset inner disc. The horns point from
 * the outer centre towards the inner centre.
 */
export function crescent(outerC: P2, R: number, innerC: P2, r: number, n = 48): P2[] {
	const d = outerC.distanceTo(innerC);
	const u = innerC.clone().sub(outerC).normalize();
	const perp = v(-u.y, u.x);
	const a = (R * R - r * r + d * d) / (2 * d);
	const h = Math.sqrt(Math.max(R * R - a * a, 0));
	const base = outerC.clone().addScaledVector(u, a);
	const p1 = base.clone().addScaledVector(perp, h);
	const p2 = base.clone().addScaledVector(perp, -h);
	const ang = (c: P2, p: P2) => Math.atan2(p.y - c.y, p.x - c.x);
	const awayFromInner = Math.atan2(-u.y, -u.x);
	const towardOuter = Math.atan2(-u.y, -u.x);
	const outer = arc(outerC, R, ang(outerC, p1), ang(outerC, p2), awayFromInner, n);
	const inner = arc(innerC, r, ang(innerC, p2), ang(innerC, p1), towardOuter, n);
	return [...outer, ...inner.slice(1, -1)];
}

/** Tapered swoosh band along a cubic bezier (thick in the middle, pointed ends). */
export function swoosh(p0: P2, p1: P2, p2: P2, p3: P2, maxW: number, n = 48): P2[] {
	const curve = new THREE.CubicBezierCurve(p0, p1, p2, p3);
	const left: P2[] = [];
	const right: P2[] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const p = curve.getPoint(t);
		const tan = curve.getTangent(t);
		const nrm = v(-tan.y, tan.x);
		const w = (maxW / 2) * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * t), 0.8));
		left.push(p.clone().addScaledVector(nrm, w));
		right.push(p.clone().addScaledVector(nrm, -w));
	}
	return [...left, ...right.reverse().slice(1, -1)];
}

export function signedArea(pts: P2[]) {
	let a = 0;
	for (let i = 0; i < pts.length; i++) {
		const p = pts[i];
		const q = pts[(i + 1) % pts.length];
		a += p.x * q.y - q.x * p.y;
	}
	return a / 2;
}

/** Ensure counter-clockwise winding (in the x/y plan). */
export function ccw(pts: P2[]) {
	return signedArea(pts) < 0 ? [...pts].reverse() : pts;
}

/**
 * Extruded plan shape hanging from the ceiling. The THREE.Shape lives in the
 * X/Y plane; we map plan (x, z) → shape (x, −z) and rotate −90° about X so the
 * extrusion points up.
 */
export function extrudedPlanShape(pts: P2[], depth: number) {
	const s = new THREE.Shape(ccw(pts).map((p) => v(p.x, -p.y)));
	const g = new THREE.ExtrudeGeometry(s, {
		depth,
		bevelEnabled: true,
		bevelThickness: 0.006,
		bevelSize: 0.006,
		bevelSegments: 2,
		curveSegments: 24,
	});
	g.rotateX(-Math.PI / 2);
	return g;
}

/**
 * LED cove wash: a flat strip on the ceiling following the outline, bright at
 * the edge and fading out over `width`. Colour is baked into vertex colours
 * so an additive MeshBasicMaterial gives a soft glow.
 */
export function coveHalo(pts: P2[], inset: number, width: number, color: THREE.Color, y: number) {
	const poly = ccw(pts);
	const n = poly.length;
	const positions: number[] = [];
	const colors: number[] = [];
	const index: number[] = [];
	const rings = 6;
	for (let i = 0; i < n; i++) {
		const prev = poly[(i - 1 + n) % n];
		const cur = poly[i];
		const next = poly[(i + 1) % n];
		const e1 = cur.clone().sub(prev).normalize();
		const e2 = next.clone().sub(cur).normalize();
		// outward normal for CCW polygon is (dy, -dx)
		const n1 = v(e1.y, -e1.x);
		const n2 = v(e2.y, -e2.x);
		const nrm = n1.add(n2).normalize();
		for (let k = 0; k <= rings; k++) {
			const t = k / rings;
			const off = -inset + (inset + width) * t;
			const p = cur.clone().addScaledVector(nrm, off);
			positions.push(p.x, y, p.y);
			// quick falloff: full at the shape edge, soft exponential fade outward
			const tOut = Math.max(0, (off - 0) / width);
			const a = off < 0 ? 1 : Math.exp(-3.2 * tOut) * (1 - tOut);
			colors.push(color.r * a, color.g * a, color.b * a);
		}
	}
	const stride = rings + 1;
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		for (let k = 0; k < rings; k++) {
			const a = i * stride + k;
			const b = j * stride + k;
			index.push(a, b, a + 1, b, b + 1, a + 1);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
	g.setIndex(index);
	return g;
}

export function centroid(pts: P2[]) {
	const c = v(0, 0);
	for (const p of pts) c.add(p);
	return c.multiplyScalar(1 / pts.length);
}
