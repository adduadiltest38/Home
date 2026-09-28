import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Lathe} from '../components/primitives';
import {useMats} from '../components/materials';
import {BED, BED_HEAD_X, BACKDROP, RUG, WALL} from '../config/room';
import {COLORS} from '../config/palette';

/** Deterministic PRNG so plants look identical on every render. */
function rng(seed: number) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

/** Snake plant: extruded, tapering blades in a ceramic pot. */
const SnakePlant: React.FC<{position: [number, number, number]}> = ({position}) => {
	const m = useMats();
	const {blades, leafMat} = useMemo(() => {
		const r = rng(7);
		const out: Array<{geom: THREE.ExtrudeGeometry; rot: [number, number, number]; pos: [number, number, number]}> = [];
		for (let i = 0; i < 9; i++) {
			const h = 0.55 + r() * 0.4;
			const w = 0.035 + r() * 0.025;
			const s = new THREE.Shape();
			s.moveTo(-w / 2, 0);
			s.bezierCurveTo(-w * 0.7, h * 0.4, -w * 0.5, h * 0.8, 0, h);
			s.bezierCurveTo(w * 0.5, h * 0.8, w * 0.7, h * 0.4, w / 2, 0);
			s.closePath();
			const g = new THREE.ExtrudeGeometry(s, {depth: 0.004, bevelEnabled: false, curveSegments: 8});
			const a = (i / 9) * Math.PI * 2 + r() * 0.5;
			out.push({
				geom: g,
				rot: [(r() - 0.5) * 0.35, a, (r() - 0.5) * 0.3],
				pos: [Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04],
			});
		}
		return {
			blades: out,
			leafMat: new THREE.MeshStandardMaterial({color: COLORS.plantGreen, roughness: 0.6, side: THREE.DoubleSide}),
		};
	}, []);
	return (
		<group position={position}>
			<Lathe
				profile={[
					[0, 0],
					[0.11, 0],
					[0.14, 0.05],
					[0.15, 0.32],
					[0.135, 0.32],
					[0, 0.3],
				]}
				material={m.ceramic}
				castShadow
			/>
			<group position={[0, 0.3, 0]}>
				{blades.map((b, i) => (
					<mesh key={i} geometry={b.geom} material={leafMat} rotation={b.rot} position={b.pos} castShadow />
				))}
			</group>
		</group>
	);
};

/** Pothos: small cluster of heart-ish leaves spilling over a pot. */
const Pothos: React.FC<{position: [number, number, number]; scale?: number}> = ({position, scale = 1}) => {
	const m = useMats();
	const {leaves, leafGeom, leafMat, leafMat2} = useMemo(() => {
		const r = rng(19);
		const s = new THREE.Shape();
		s.moveTo(0, 0);
		s.bezierCurveTo(0.025, 0.01, 0.03, 0.04, 0, 0.06);
		s.bezierCurveTo(-0.03, 0.04, -0.025, 0.01, 0, 0);
		const g = new THREE.ShapeGeometry(s, 6);
		const list: Array<{pos: [number, number, number]; rot: [number, number, number]; alt: boolean}> = [];
		for (let i = 0; i < 26; i++) {
			const a = r() * Math.PI * 2;
			const rad = 0.03 + r() * 0.09;
			const y = 0.1 + r() * 0.1 - Math.max(0, rad - 0.08) * 1.5;
			list.push({
				pos: [Math.cos(a) * rad, y, Math.sin(a) * rad],
				rot: [-0.6 - r() * 0.8, a + Math.PI / 2, (r() - 0.5) * 0.6],
				alt: r() > 0.6,
			});
		}
		return {
			leaves: list,
			leafGeom: g,
			leafMat: new THREE.MeshStandardMaterial({color: COLORS.plantGreen, roughness: 0.5, side: THREE.DoubleSide}),
			leafMat2: new THREE.MeshStandardMaterial({color: COLORS.plantGreenLight, roughness: 0.5, side: THREE.DoubleSide}),
		};
	}, []);
	return (
		<group position={position} scale={scale}>
			<Lathe
				profile={[
					[0, 0],
					[0.05, 0],
					[0.065, 0.1],
					[0.058, 0.1],
					[0, 0.09],
				]}
				material={m.ceramic}
			/>
			{leaves.map((l, i) => (
				<mesh key={i} geometry={leafGeom} material={l.alt ? leafMat2 : leafMat} position={l.pos} rotation={l.rot} />
			))}
		</group>
	);
};

export const Accessories: React.FC = () => {
	const m = useMats();
	const footX = BED_HEAD_X - 0.02 - BED.length;
	// rug under the lower two-thirds of the bed
	const rugX1 = footX + (BED.length * 2) / 3;
	const rugX0 = rugX1 - RUG.lengthX;
	const rightBedsideZ = BACKDROP.z1 - 0.01 - BED.bedsideW / 2;
	return (
		<group>
			<mesh position={[(rugX0 + rugX1) / 2, RUG.thickness / 2, BED.centerZ]} material={m.ivoryRug} receiveShadow>
				<boxGeometry args={[RUG.lengthX, RUG.thickness, RUG.widthZ]} />
			</mesh>
			{/* snake plant in the window/double-door corner */}
			<SnakePlant position={[WALL.west + 0.42, 0, WALL.north + 0.3]} />
			{/* pothos on the right bedside, under the switchboard */}
			<Pothos position={[BED_HEAD_X - 0.12, BED.bedsideTop, rightBedsideZ + 0.13]} scale={0.9} />
		</group>
	);
};
