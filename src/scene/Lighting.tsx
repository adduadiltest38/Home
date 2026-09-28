import React, {useMemo} from 'react';
import {Environment, Lightformer} from '@react-three/drei';
import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {centroid} from '../components/curves';
import {BACKDROP, CEILING, DOWNLIGHTS, ENTRY_DOOR_Z, ENTRY_X0, ENTRY_X1, LOFT_FRONT_Z, ROOM, WALL} from '../config/room';
import {COLORS, LIGHT} from '../config/palette';
import {CEILING_SHAPES} from './Ceiling';

RectAreaLightUniformsLib.init();

const Downlight: React.FC<{x: number; z: number; castShadow: boolean}> = ({x, z, castShadow}) => {
	const target = useMemo(() => new THREE.Object3D(), []);
	// aim slightly toward the nearest wall so the cone draws a scallop on it
	const dx = Math.abs(x - WALL.east) < 0.5 ? 0.22 : Math.abs(x - WALL.west) < 0.5 ? -0.22 : 0;
	const dz = Math.abs(z - WALL.north) < 0.5 ? -0.22 : Math.abs(z - LOFT_FRONT_Z) < 0.5 ? 0.22 : 0;
	const y = ROOM.height - CEILING.bandDrop - 0.01;
	return (
		<>
			<primitive object={target} position={[x + dx, 0, z + dz]} />
			<spotLight
				position={[x, y, z]}
				target={target}
				color={COLORS.light3000k}
				intensity={LIGHT.downlight}
				angle={THREE.MathUtils.degToRad(LIGHT.downlightAngleDeg)}
				penumbra={LIGHT.downlightPenumbra}
				decay={2}
				distance={0}
				castShadow={castShadow}
				shadow-mapSize-width={1024}
				shadow-mapSize-height={1024}
				shadow-bias={-0.0004}
				shadow-radius={6}
				shadow-camera-near={0.1}
				shadow-camera-far={4}
			/>
		</>
	);
};

export const Lighting: React.FC = () => {
	const coveCentres = useMemo(() => CEILING_SHAPES.map((s) => centroid(s)), []);
	const bz0 = BACKDROP.z0;
	const bz1 = BACKDROP.z1;

	return (
		<group>
			<ambientLight intensity={LIGHT.ambient} color={COLORS.light3000k} />
			<hemisphereLight args={[LIGHT.hemiSky, LIGHT.hemiGround, LIGHT.hemi]} />

			{/* downlights */}
			{DOWNLIGHTS.map(([x, z, shadow], i) => (
				<Downlight key={i} x={x} z={z} castShadow={Boolean(shadow)} />
			))}

			{/* cove glow: one soft warm point per shape, just under the ceiling */}
			{coveCentres.map((c, i) => (
				<pointLight
					key={i}
					position={[c.x, ROOM.height - 0.25, c.y]}
					color={COLORS.led3000k}
					intensity={LIGHT.cove}
					distance={3.2}
					decay={2}
				/>
			))}

			{/* backdrop LED grazing down the slats */}
			<rectAreaLight
				position={[WALL.east - 0.07, BACKDROP.height - 0.02, (bz0 + bz1) / 2]}
				rotation={[-Math.PI / 2, 0, 0]}
				width={0.06}
				height={bz1 - bz0}
				color={COLORS.light3000k}
				intensity={LIGHT.backdrop}
			/>

			{/* dim corridor light so the dolly-in isn't a black void */}
			<pointLight
				position={[(ENTRY_X0 + ENTRY_X1) / 2, 2.5, ENTRY_DOOR_Z + ROOM.wallThickness + 1.1]}
				color={COLORS.light3000k}
				intensity={3.5}
				distance={4}
				decay={2}
			/>

			{/* local image-based lighting for reflections (no network: built from lightformers) */}
			<Environment resolution={64} frames={1} background={false}>
				<color attach="background" args={['#1a1510']} />
				<Lightformer form="rect" intensity={1.2} color={COLORS.led3000k} position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[3, 3, 1]} />
				<Lightformer form="rect" intensity={0.6} color="#FFE8CC" position={[0, 1.5, -3]} scale={[4, 1.5, 1]} />
				<Lightformer form="rect" intensity={0.4} color="#9FB0C8" position={[-3, 1.5, 0]} rotation-y={Math.PI / 2} scale={[3, 1.5, 1]} />
				<Lightformer form="rect" intensity={0.5} color={COLORS.led3000k} position={[3, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[3, 1.5, 1]} />
			</Environment>
		</group>
	);
};
