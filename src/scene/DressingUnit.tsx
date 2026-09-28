import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';
import {Box, Lathe, SoftBox} from '../components/primitives';
import {useMats} from '../components/materials';
import {coveHalo} from '../components/curves';
import {DRESSING, DRESSING_CX, DRESSING_X0, WALL} from '../config/room';
import {COLORS, LIGHT} from '../config/palette';

function roundedRect(w: number, h: number, r: number, n = 8) {
	const pts: THREE.Vector2[] = [];
	const corners: Array<[number, number, number]> = [
		[w / 2 - r, h / 2 - r, 0],
		[-w / 2 + r, h / 2 - r, Math.PI / 2],
		[-w / 2 + r, -h / 2 + r, Math.PI],
		[w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
	];
	for (const [cx, cy, a0] of corners) {
		for (let i = 0; i <= n; i++) {
			const a = a0 + (i / n) * (Math.PI / 2);
			pts.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
		}
	}
	return pts;
}

/** Floating walnut vanity + backlit mirror + upholstered stool (west end of the wardrobe wall). */
export const DressingUnit: React.FC = () => {
	const m = useMats();
	const w = DRESSING.width - 0.02;
	const zBack = WALL.south;
	const zFront = zBack - DRESSING.depth;
	const topY = DRESSING.counterTop;
	const ct = DRESSING.counterThickness;
	const mirrorCY = DRESSING.mirrorBottom + DRESSING.mirrorH / 2;

	const {mirror, haloGeom, washGeom, washMat, haloMat, bottleMat} = useMemo(() => {
		const r = 0.1;
		const mShape = new THREE.Shape(roundedRect(DRESSING.mirrorW, DRESSING.mirrorH, r));
		const hm = DRESSING.haloMargin;
		const hShape = new THREE.Shape(roundedRect(DRESSING.mirrorW + 2 * hm, DRESSING.mirrorH + 2 * hm, r + hm));
		const led = new THREE.Color(COLORS.led3000k);
		// wall wash: plan-space halo rotated upright (p.y maps to −world y)
		const outline = roundedRect(DRESSING.mirrorW + 2 * hm, DRESSING.mirrorH + 2 * hm, r + hm).map(
			(p) => new THREE.Vector2(p.x, -p.y),
		);
		// true planar reflection, rendered only when the mirror is on screen
		const reflector = new Reflector(new THREE.ShapeGeometry(mShape, 12), {
			textureWidth: 384,
			textureHeight: 768,
			color: 0x7a7a7a,
			clipBias: 0.003,
			multisample: 0,
		});
		reflector.position.z = 0.036; // just proud of the backing panel (avoids z-fighting)
		return {
			mirror: reflector,
			haloGeom: new THREE.ShapeGeometry(hShape, 12),
			washGeom: coveHalo(outline, 0.0, 0.3, led.clone().multiplyScalar(0.9), 0),
			washMat: new THREE.MeshBasicMaterial({
				vertexColors: true,
				transparent: true,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				side: THREE.DoubleSide,
				toneMapped: false,
			}),
			haloMat: new THREE.MeshBasicMaterial({
				color: new THREE.Color(COLORS.led3000k).multiplyScalar(LIGHT.mirrorEmissive),
				toneMapped: false,
			}),
			bottleMat: new THREE.MeshPhysicalMaterial({
				color: '#b98a55',
				roughness: 0.15,
				transparent: true,
				opacity: 0.85,
				clearcoat: 1,
				clearcoatRoughness: 0.15,
			}),
		};
	}, []);

	const drawerW = (w - 0.006) / 2;
	const counterMat = m.walnut(w, ct, true);

	return (
		<group>
			{/* floating counter */}
			<Box
				size={[w, 0.03, DRESSING.depth]}
				position={[DRESSING_CX, topY - 0.015, (zBack + zFront) / 2]}
				material={m.walnut(w, DRESSING.depth, true)}
				castShadow
			/>
			<Box
				size={[w, ct - 0.03, DRESSING.depth - 0.02]}
				position={[DRESSING_CX, topY - 0.03 - (ct - 0.03) / 2, (zBack + zFront) / 2 + 0.01]}
				material={m.black}
				castShadow
			/>
			{/* 2 drawer fronts with gold edge pulls */}
			{[0, 1].map((i) => {
				const x = DRESSING_X0 + 0.01 + drawerW / 2 + i * (drawerW + 0.006);
				return (
					<group key={i}>
						<Box
							size={[drawerW, ct - 0.036, 0.02]}
							position={[x, topY - 0.033 - (ct - 0.036) / 2, zFront + 0.01]}
							material={counterMat}
						/>
						<Box size={[drawerW * 0.5, 0.008, 0.012]} position={[x, topY - 0.04, zFront - 0.004]} material={m.gold} />
					</group>
				);
			})}

			{/* backlit mirror: halo panel, mirror, and warm wash on the wall */}
			<group position={[DRESSING_CX, mirrorCY, zBack - 0.004]} rotation={[0, Math.PI, 0]}>
				<mesh geometry={washGeom} material={washMat} rotation={[Math.PI / 2, 0, 0]} renderOrder={2} />
				<mesh geometry={haloGeom} material={haloMat} position={[0, 0, 0.004]} />
				<primitive object={mirror} />
				<mesh position={[0, 0, 0.018]}>
					<boxGeometry args={[DRESSING.mirrorW - 0.04, DRESSING.mirrorH - 0.04, 0.024]} />
					<meshStandardMaterial color="#1a1714" />
				</mesh>
			</group>
			<pointLight
				position={[DRESSING_CX, mirrorCY, zBack - 0.35]}
				color={COLORS.light3000k}
				intensity={LIGHT.mirrorHalo}
				distance={3}
				decay={2}
			/>

			{/* tray with 3 bottles */}
			<group position={[DRESSING_CX + 0.18, topY, zBack - 0.2]}>
				<Box size={[0.3, 0.012, 0.16]} position={[0, 0.006, 0]} material={m.gold} />
				<Lathe
					position={[-0.08, 0.012, 0]}
					profile={[[0, 0], [0.028, 0], [0.03, 0.1], [0.012, 0.13], [0.012, 0.15], [0, 0.15]]}
					material={bottleMat}
				/>
				<Lathe
					position={[0.0, 0.012, 0.02]}
					profile={[[0, 0], [0.035, 0], [0.035, 0.07], [0.015, 0.085], [0.015, 0.1], [0, 0.1]]}
					material={m.ceramic}
				/>
				<Lathe
					position={[0.08, 0.012, -0.01]}
					profile={[[0, 0], [0.02, 0], [0.022, 0.16], [0.008, 0.19], [0.008, 0.21], [0, 0.21]]}
					material={bottleMat}
				/>
				<mesh position={[0.08, 0.232, -0.01]} material={m.gold}>
					<cylinderGeometry args={[0.01, 0.01, 0.025, 12]} />
				</mesh>
			</group>

			{/* upholstered stool */}
			<group position={[DRESSING_CX - 0.05, 0, zFront - 0.28]}>
				<SoftBox
					size={[DRESSING.stoolRadius * 2, 0.14, DRESSING.stoolRadius * 2]}
					radius={0.06}
					position={[0, DRESSING.stoolHeight - 0.07, 0]}
					material={m.beige}
					castShadow
					smoothness={4}
				/>
				{[
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1],
				].map(([sx, sz], i) => (
					<mesh
						key={i}
						position={[sx * 0.13, (DRESSING.stoolHeight - 0.14) / 2, sz * 0.13]}
						material={m.gold}
						castShadow
					>
						<cylinderGeometry args={[0.009, 0.007, DRESSING.stoolHeight - 0.14, 8]} />
					</mesh>
				))}
			</group>
		</group>
	);
};
