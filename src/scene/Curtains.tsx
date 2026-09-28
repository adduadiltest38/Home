import React, {useLayoutEffect, useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {useGlobalFrame} from '../components/frame';
import * as THREE from 'three';
import {Box} from '../components/primitives';
import {useMats} from '../components/materials';
import {CEILING, CURTAINS, ROOM, WALL} from '../config/room';
import {COLORS} from '../config/palette';

/**
 * Procedurally folded drape. Plane in local XY (x across, y down from the
 * track), vertices displaced z = A·sin(2π·x / pitch + φ). `sway` adds a tiny
 * frame-driven ripple that grows toward the hem.
 */
const Drape: React.FC<{
	width: number;
	height: number;
	pitch: number;
	amplitude: number;
	material: THREE.Material;
	swayAmp: number;
	phase: number;
}> = ({width, height, pitch, amplitude, material, swayAmp, phase}) => {
	const geom = useMemo(() => {
		const segX = Math.max(24, Math.ceil((width / pitch) * 12));
		const g = new THREE.PlaneGeometry(width, height, segX, 6);
		g.translate(0, -height / 2, 0);
		g.userData.base = Float32Array.from(g.attributes.position.array as Float32Array);
		return g;
	}, [width, height, pitch]);

	useLayoutEffect(() => {
		const pos = geom.attributes.position as THREE.BufferAttribute;
		const base = geom.userData.base as Float32Array;
		for (let i = 0; i < pos.count; i++) {
			const x = base[i * 3];
			const y = base[i * 3 + 1];
			const hem = -y / height; // 0 at track → 1 at hem
			const k = (2 * Math.PI) / pitch;
			const ripple = swayAmp * hem * Math.sin(phase + x * 1.7);
			const z = amplitude * (0.85 + 0.15 * hem) * Math.sin(k * x + ripple * 6) + ripple * 0.3;
			pos.setXYZ(i, x, y, z);
		}
		pos.needsUpdate = true;
		geom.computeVertexNormals();
	}, [geom, amplitude, pitch, height, swayAmp, phase]);

	return <mesh geometry={geom} material={material} castShadow={false} receiveShadow />;
};

/** Two-layer "infinity" curtains across the full window wall (IMG_2). */
export const Curtains: React.FC = () => {
	const m = useMats();
	const frame = useGlobalFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	const {sheerMat, blackoutMat} = useMemo(
		() => ({
			sheerMat: new THREE.MeshStandardMaterial({
				color: COLORS.creamFabric,
				roughness: 1,
				transparent: true,
				opacity: CURTAINS.sheerOpacity,
				side: THREE.DoubleSide,
				depthWrite: false,
			}),
			blackoutMat: new THREE.MeshStandardMaterial({
				color: COLORS.taupeBlackout,
				roughness: 0.92,
				side: THREE.DoubleSide,
			}),
		}),
		[],
	);

	const trackY = ROOM.height - CEILING.bandDrop - 0.012;
	const dropTop = trackY - 0.02;
	const height = dropTop - 0.005; // floor-kissing
	const span = CURTAINS.z1 - CURTAINS.z0;
	const midZ = (CURTAINS.z0 + CURTAINS.z1) / 2;
	const bs = CURTAINS.blackoutStack;

	// local +z of the drape must face the room (+x): rotate +90° about Y.
	// local +x then points to world −z, so "left" (south) stack is at local −x.
	const rotY = Math.PI / 2;

	return (
		<group>
			{/* ceiling track, corner to corner */}
			<Box
				size={[0.1, 0.024, span + 0.03]}
				position={[WALL.west + 0.13, trackY, midZ]}
				material={m.ceiling}
			/>

			{/* blackout layer — drawn to both sides (behind) */}
			{[CURTAINS.z0 + bs / 2, CURTAINS.z1 - bs / 2].map((z, i) => (
				<group key={i} position={[WALL.west + CURTAINS.blackoutOffset, dropTop, z]} rotation={[0, rotY, 0]}>
					<Drape
						width={bs}
						height={height}
						pitch={0.075}
						amplitude={0.045}
						material={blackoutMat}
						swayAmp={0}
						phase={0}
					/>
				</group>
			))}

			{/* sheer layer — full width, in front, gently breathing */}
			<group position={[WALL.west + CURTAINS.sheerOffset, dropTop, midZ]} rotation={[0, rotY, 0]}>
				<Drape
					width={span}
					height={height}
					pitch={CURTAINS.foldPitch}
					amplitude={CURTAINS.foldAmplitude}
					material={sheerMat}
					swayAmp={0.025}
					phase={t * 1.3}
				/>
			</group>
		</group>
	);
};
