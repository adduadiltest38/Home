import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, BoxRow, Lathe, SoftBox} from '../components/primitives';
import {useMats} from '../components/materials';
import {BACKDROP, BED, BED_HEAD_X, WALL} from '../config/room';
import {COLORS, LIGHT} from '../config/palette';

type V3 = [number, number, number];

/** Vertical gradient glow plane (brightest at the top where the LED sits). */
function useGlowMaterial(intensity: number) {
	return useMemo(() => {
		const n = 64;
		const data = new Uint8Array(n * 4);
		const led = new THREE.Color(COLORS.led3000k);
		for (let i = 0; i < n; i++) {
			const t = i / (n - 1); // 0 bottom → 1 top
			const a = 0.08 + 0.92 * Math.pow(t, 3);
			const c = led.clone().multiplyScalar(a).convertLinearToSRGB();
			data.set([c.r * 255, c.g * 255, c.b * 255, 255].map(Math.round), i * 4);
		}
		const tex = new THREE.DataTexture(data, 1, n);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.magFilter = THREE.LinearFilter;
		tex.needsUpdate = true;
		const mat = new THREE.MeshBasicMaterial({map: tex, toneMapped: false});
		mat.color.setScalar(intensity);
		return mat;
	}, [intensity]);
}

/** Ceramic table lamp with a fabric drum shade and a warm point light inside. */
export const TableLamp: React.FC<{position: V3}> = ({position}) => {
	const m = useMats();
	const shadeMat = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: COLORS.creamFabric,
				roughness: 0.9,
				side: THREE.DoubleSide,
				emissive: COLORS.led3000k,
				emissiveIntensity: 0.9,
			}),
		[],
	);
	return (
		<group position={position}>
			<Lathe
				profile={[
					[0, 0],
					[0.06, 0],
					[0.085, 0.06],
					[0.09, 0.13],
					[0.07, 0.2],
					[0.025, 0.25],
					[0.018, 0.29],
					[0, 0.29],
				]}
				material={m.ceramic}
				castShadow
			/>
			<mesh position={[0, 0.39, 0]} material={shadeMat}>
				<cylinderGeometry args={[0.1, 0.13, 0.2, 32, 1, true]} />
			</mesh>
			<pointLight position={[0, 0.36, 0]} color={COLORS.light3000k} intensity={LIGHT.bedsideLamp} distance={2.5} decay={2} />
		</group>
	);
};

export const BedWall: React.FC = () => {
	const m = useMats();
	const glow = useGlowMaterial(LIGHT.backdropEmissive * 0.35);
	const c = BED.centerZ;
	const pz0 = c - BACKDROP.panelWidth / 2;
	const pz1 = c + BACKDROP.panelWidth / 2;
	const H = BACKDROP.height;
	const xWall = WALL.east;
	const xFront = BED_HEAD_X;

	const slats = useMemo(() => {
		const pos: V3[] = [];
		const x = xWall - 0.012 - BACKDROP.slatDepth / 2;
		const add = (z0: number, z1: number) => {
			const n = Math.floor((z1 - z0 - BACKDROP.slatWidth) / BACKDROP.slatPitch) + 1;
			const used = (n - 1) * BACKDROP.slatPitch + BACKDROP.slatWidth;
			const start = z0 + (z1 - z0 - used) / 2 + BACKDROP.slatWidth / 2;
			for (let i = 0; i < n; i++) pos.push([x, H / 2, start + i * BACKDROP.slatPitch]);
		};
		add(BACKDROP.z0 + 0.005, pz0 - 0.01);
		add(pz1 + 0.01, BACKDROP.z1 - 0.005);
		return pos;
	}, [H, pz0, pz1, xWall]);

	const channels = useMemo(() => {
		const n = Math.round(BACKDROP.panelWidth / BACKDROP.channelWidth);
		const w = BACKDROP.panelWidth / n;
		return Array.from({length: n}, (_, i) => pz0 + w / 2 + i * w);
	}, [pz0]);
	const chW = BACKDROP.panelWidth / channels.length;

	// bed geometry (x runs from head at the backdrop toward the room)
	const headX = xFront - 0.02;
	const footX = headX - BED.length;
	const midX = (headX + footX) / 2;
	const topMat = BED.platformHeight + BED.mattressHeight;

	const bedsideX = xFront - BED.bedsideD / 2;
	const leftZ = BACKDROP.z0 + 0.01 + BED.bedsideW / 2;
	const rightZ = BACKDROP.z1 - 0.01 - BED.bedsideW / 2;

	return (
		<group>
			{/* ── Backdrop ── */}
			{/* glowing backing behind the slats */}
			<mesh position={[xWall - 0.004, H / 2, (BACKDROP.z0 + pz0) / 2]} rotation={[0, -Math.PI / 2, 0]} material={glow}>
				<planeGeometry args={[pz0 - BACKDROP.z0, H]} />
			</mesh>
			<mesh position={[xWall - 0.004, H / 2, (pz1 + BACKDROP.z1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={glow}>
				<planeGeometry args={[BACKDROP.z1 - pz1, H]} />
			</mesh>
			<BoxRow
				size={[BACKDROP.slatDepth, H, BACKDROP.slatWidth]}
				positions={slats}
				material={m.walnut(BACKDROP.slatWidth, H)}
				castShadow
			/>
			{/* centre walnut panel + channel-tufted upholstered headboard */}
			<Box
				size={[BACKDROP.depth - 0.02, H, BACKDROP.panelWidth]}
				position={[xWall - (BACKDROP.depth - 0.02) / 2, H / 2, c]}
				material={m.walnut(BACKDROP.panelWidth, H)}
			/>
			{channels.map((z, i) => (
				<SoftBox
					key={i}
					size={[0.07, BACKDROP.headboardHeight, chW - 0.006]}
					radius={0.03}
					position={[xFront - 0.01, BACKDROP.headboardBottom + BACKDROP.headboardHeight / 2, z]}
					material={m.beige}
					smoothness={3}
				/>
			))}
			{/* top cap with LED strip washing down */}
			<Box
				size={[0.09, 0.03, BACKDROP.z1 - BACKDROP.z0]}
				position={[xWall - 0.045, H + 0.015, (BACKDROP.z0 + BACKDROP.z1) / 2]}
				material={m.walnut(0.09, BACKDROP.z1 - BACKDROP.z0, true)}
			/>
			<mesh
				position={[xWall - 0.07, H - 0.001, (BACKDROP.z0 + BACKDROP.z1) / 2]}
				rotation={[Math.PI / 2, 0, 0]}
				material={m.led}
			>
				<planeGeometry args={[0.012, BACKDROP.z1 - BACKDROP.z0 - 0.02]} />
			</mesh>

			{/* ── King bed ── */}
			<group>
				{/* recessed plinth → floating look */}
				<Box size={[BED.length - 0.2, 0.08, BED.width - 0.2]} position={[midX + 0.05, 0.04, c]} material={m.black} />
				<Box
					size={[BED.length, BED.platformHeight - 0.08, BED.width]}
					position={[midX, 0.08 + (BED.platformHeight - 0.08) / 2, c]}
					material={m.walnut(BED.length, BED.platformHeight, true)}
					castShadow
				/>
				{/* mattress */}
				<SoftBox
					size={[BED.length - 0.05, BED.mattressHeight, BED.width - 0.05]}
					radius={0.05}
					position={[midX, BED.platformHeight + BED.mattressHeight / 2, c]}
					material={m.cream}
					castShadow
				/>
				{/* duvet (cream) draping over the sides */}
				<SoftBox
					size={[BED.length * 0.74, 0.07, BED.width + 0.04]}
					radius={0.03}
					position={[footX + BED.length * 0.37 - 0.01, topMat + 0.015, c]}
					material={m.cream}
					castShadow
				/>
				<SoftBox
					size={[BED.length * 0.74, 0.34, 0.03]}
					radius={0.012}
					position={[footX + BED.length * 0.37 - 0.01, topMat - 0.13, c + BED.width / 2 + 0.02]}
					material={m.cream}
				/>
				<SoftBox
					size={[BED.length * 0.74, 0.34, 0.03]}
					radius={0.012}
					position={[footX + BED.length * 0.37 - 0.01, topMat - 0.13, c - BED.width / 2 - 0.02]}
					material={m.cream}
				/>
				{/* folded beige top sheet band */}
				<SoftBox
					size={[0.22, 0.085, BED.width + 0.05]}
					radius={0.035}
					position={[footX + BED.length * 0.74 - 0.08, topMat + 0.03, c]}
					material={m.beige}
					castShadow
				/>
				{/* taupe throw across the foot */}
				<SoftBox
					size={[0.48, 0.09, BED.width + 0.08]}
					radius={0.035}
					position={[footX + 0.3, topMat + 0.04, c]}
					material={m.taupe}
					castShadow
				/>
				<SoftBox
					size={[0.03, 0.3, BED.width + 0.08]}
					radius={0.012}
					position={[footX - 0.02, topMat - 0.1, c]}
					material={m.taupe}
				/>
				{/* 5 pillows: 2 euro (back), 2 standard, 1 lumbar */}
				{(
					[
						{z: c - 0.43, x: headX - 0.13, size: [0.16, 0.6, 0.72], rot: -0.32, s: [1, 1, 1], mat: 'beige'},
						{z: c + 0.43, x: headX - 0.13, size: [0.16, 0.6, 0.72], rot: -0.3, s: [1, 0.98, 1.01], mat: 'beige'},
						{z: c - 0.42, x: headX - 0.33, size: [0.15, 0.45, 0.66], rot: -0.5, s: [1, 1, 0.97], mat: 'cream'},
						{z: c + 0.41, x: headX - 0.34, size: [0.15, 0.45, 0.66], rot: -0.52, s: [1.02, 0.97, 1], mat: 'cream'},
						{z: c + 0.01, x: headX - 0.47, size: [0.13, 0.3, 0.52], rot: -0.6, s: [1, 1, 1], mat: 'taupe'},
					] as const
				).map((p, i) => (
					<SoftBox
						key={i}
						size={p.size as unknown as V3}
						radius={0.06}
						position={[p.x, topMat + (p.size[1] / 2) * Math.cos(p.rot) + 0.01, p.z]}
						rotation={[0, 0, p.rot]}
						scale={p.s as unknown as V3}
						material={m[p.mat]}
						castShadow
						smoothness={4}
					/>
				))}
			</group>

			{/* ── Floating bedside tables (1 drawer each) ── */}
			{[leftZ, rightZ].map((z, i) => (
				<group key={i}>
					<Box
						size={[BED.bedsideD, BED.bedsideH, BED.bedsideW]}
						position={[bedsideX, BED.bedsideTop - BED.bedsideH / 2, z]}
						material={m.walnut(BED.bedsideW, BED.bedsideH, true)}
						castShadow
					/>
					<Box
						size={[0.004, 0.004, BED.bedsideW - 0.04]}
						position={[bedsideX - BED.bedsideD / 2 - 0.001, BED.bedsideTop - 0.05, z]}
						material={m.black}
					/>
					<Box
						size={[0.012, 0.01, 0.16]}
						position={[bedsideX - BED.bedsideD / 2 - 0.006, BED.bedsideTop - 0.12, z]}
						material={m.gold}
					/>
					<TableLamp position={[bedsideX + 0.03, BED.bedsideTop, z + (i === 0 ? 0.08 : -0.1)]} />
				</group>
			))}
			{/* books on the left bedside */}
			<group position={[bedsideX - 0.07, BED.bedsideTop, leftZ - 0.12]}>
				<Box size={[0.16, 0.03, 0.22]} position={[0, 0.015, 0]} material={m.taupe} />
				<Box size={[0.15, 0.025, 0.2]} position={[0.005, 0.0425, 0.004]} rotation={[0, 0.12, 0]} material={m.cream} />
			</group>
		</group>
	);
};
