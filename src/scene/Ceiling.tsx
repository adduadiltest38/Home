import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {useGlobalFrame} from '../components/frame';
import * as THREE from 'three';
import {BoxMM, Lathe} from '../components/primitives';
import {useMats} from '../components/materials';
import {coveHalo, crescent, extrudedPlanShape, swoosh, type P2} from '../components/curves';
import {CEILING, DOWNLIGHTS, LOFT_FRONT_Z, ROOM, WALL} from '../config/room';
import {COLORS} from '../config/palette';

const v = (x: number, z: number) => new THREE.Vector2(x, z);
const H = ROOM.height;
/** Gap between the top of each floating shape and the ceiling (hides the LED strip) */
const COVE_GAP = 0.04;
const SHAPE_TOP = H - COVE_GAP;

/**
 * Plan outlines of the raised plaster shapes (x, z in metres) — read off the
 * four photos: a crescent above the double door (IMG_3), a crescent above the
 * bed wall (IMG_4) and two wave "swooshes" above the window side (IMG_2).
 */
export const CEILING_SHAPES: P2[][] = [
	// crescent above the double door, horns toward the room centre
	crescent(v(-0.35, -0.95), 0.6, v(-0.35, -0.68), 0.43),
	// crescent above the bed, horns toward the fan
	crescent(v(0.95, -0.35), 0.56, v(0.7, -0.33), 0.4),
	// wave swooshes on the window side
	swoosh(v(-1.5, -0.35), v(-0.85, -0.2), v(-1.35, 0.7), v(-0.6, 0.92), 0.26),
	swoosh(v(-1.12, -0.62), v(-0.5, -0.42), v(-0.95, 0.5), v(-0.2, 0.72), 0.2),
];

export const Ceiling: React.FC = () => {
	const m = useMats();
	const frame = useGlobalFrame();
	const {fps} = useVideoConfig();

	const {shapes, halos, haloMat} = useMemo(() => {
		const led = new THREE.Color(COLORS.led3000k);
		return {
			shapes: CEILING_SHAPES.map((pts) => extrudedPlanShape(pts, CEILING.shapeDepth)),
			halos: CEILING_SHAPES.map((pts) => coveHalo(pts, 0.05, CEILING.coveGlowWidth, led, H - 0.002)),
			haloMat: new THREE.MeshBasicMaterial({
				vertexColors: true,
				transparent: true,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				side: THREE.DoubleSide,
				toneMapped: false,
				opacity: 1,
			}),
		};
	}, []);

	const bw = CEILING.bandWidth;
	const bandY0 = H - CEILING.bandDrop;
	const zSouth = LOFT_FRONT_Z;

	// Frame-driven fan rotation (deterministic)
	const fanAngle = (frame / fps) * CEILING.fan.rps * Math.PI * 2;
	const fanY = H - CEILING.fan.dropFromCeiling;

	return (
		<group>
			{/* Ceiling plane */}
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={m.ceiling}>
				<planeGeometry args={[ROOM.width, ROOM.depth]} />
			</mesh>

			{/* Perimeter band (north, east, west, loft front) */}
			<BoxMM min={[WALL.west, bandY0, WALL.north]} max={[WALL.east, H, WALL.north + bw]} material={m.ceiling} />
			<BoxMM min={[WALL.west, bandY0, WALL.north]} max={[WALL.west + bw, H, zSouth]} material={m.ceiling} />
			<BoxMM min={[WALL.east - bw, bandY0, WALL.north]} max={[WALL.east, H, zSouth]} material={m.ceiling} />
			<BoxMM min={[WALL.west, bandY0, zSouth - 0.12]} max={[WALL.east, H, zSouth]} material={m.ceiling} />

			{/* Floating plaster shapes + LED cove wash on the ceiling above them */}
			{shapes.map((g, i) => (
				<mesh key={i} geometry={g} material={m.ceilingShape} position={[0, SHAPE_TOP - CEILING.shapeDepth, 0]} />
			))}
			{halos.map((g, i) => (
				<mesh key={`h${i}`} geometry={g} material={haloMat} renderOrder={2} />
			))}

			{/* Recessed downlights: trim ring + lens (lights themselves live in Lighting.tsx) */}
			{DOWNLIGHTS.map(([x, z], i) => (
				<group key={i} position={[x, bandY0 - 0.001, z]}>
					<mesh rotation={[Math.PI / 2, 0, 0]} material={m.gold}>
						<ringGeometry args={[0.035, 0.05, 32]} />
					</mesh>
					<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={m.led}>
						<circleGeometry args={[0.035, 32]} />
					</mesh>
				</group>
			))}

			{/* 3-blade ceiling fan */}
			<group position={[CEILING.fan.x, 0, CEILING.fan.z]}>
				<mesh position={[0, (H + fanY) / 2, 0]} material={m.walnutFan}>
					<cylinderGeometry args={[0.012, 0.012, H - fanY, 12]} />
				</mesh>
				<Lathe
					position={[0, H - 0.05, 0]}
					profile={[
						[0.0, 0.05],
						[0.05, 0.05],
						[0.06, 0.0],
						[0.0, 0.0],
					]}
					material={m.walnutFan}
				/>
				<group position={[0, fanY, 0]} rotation={[0, fanAngle, 0]}>
					{/* motor housing */}
					<Lathe
						profile={[
							[0.0, 0.07],
							[0.07, 0.07],
							[0.1, 0.04],
							[0.105, 0.0],
							[0.09, -0.03],
							[0.0, -0.03],
						]}
						material={m.walnutFan}
						castShadow
					/>
					{/* light bowl */}
					<Lathe
						position={[0, -0.03, 0]}
						profile={[
							[0.0, -0.075],
							[0.04, -0.07],
							[0.07, -0.045],
							[0.085, 0.0],
							[0.0, 0.0],
						]}
						material={m.fanBowl}
					/>
					{[0, 1, 2].map((k) => (
						<group key={k} rotation={[0, (k * Math.PI * 2) / 3, 0]}>
							{/* bracket */}
							<mesh position={[0.14, 0.005, 0]} material={m.walnutFan}>
								<boxGeometry args={[0.14, 0.012, 0.035]} />
							</mesh>
							{/* blade: slightly tapered, pitched */}
							<mesh
								position={[0.2 + CEILING.fan.bladeLength / 2, 0.012, 0]}
								rotation={[0.12, 0, 0]}
								material={m.fanBlade}
								castShadow
							>
								<boxGeometry args={[CEILING.fan.bladeLength, 0.008, CEILING.fan.bladeWidth]} />
							</mesh>
						</group>
					))}
				</group>
			</group>
		</group>
	);
};
