import React from 'react';
import * as THREE from 'three';
import {BoxMM, WallSlab, type Hole} from '../components/primitives';
import {useMats} from '../components/materials';
import {
	DD_TOTAL_W,
	DOUBLE_DOOR,
	ENTRANCE,
	ENTRY_DOOR_Z,
	ENTRY_X0,
	ENTRY_X1,
	HALF_D,
	HALF_W,
	LOFT,
	LOFT_FRONT_Z,
	LOFT_TOP,
	ROOM,
	SKIRTING,
	WALL,
	WINDOW,
} from '../config/room';
import {COLORS} from '../config/palette';

const T = ROOM.wallThickness;
const H = ROOM.height;

// Opening rectangles in each wall's local (u, v) frame — module constants so
// the extruded geometry is built once.
const WEST_HOLES: Hole[] = [
	{
		// u runs south → north starting at z = +HALF_D + T
		u0: HALF_D + T - WINDOW.centerZ - WINDOW.width / 2,
		u1: HALF_D + T - WINDOW.centerZ + WINDOW.width / 2,
		v0: WINDOW.sill,
		v1: WINDOW.sill + WINDOW.height,
	},
];

export const NICHE = {
	x0: DOUBLE_DOOR.centerX - DD_TOTAL_W / 2 - DOUBLE_DOOR.nicheMargin,
	x1: DOUBLE_DOOR.centerX + DD_TOTAL_W / 2 + DOUBLE_DOOR.nicheMargin,
	top: DOUBLE_DOOR.doorHeight + DOUBLE_DOOR.frameWidth + DOUBLE_DOOR.nicheMargin,
};
const NORTH_HOLES: Hole[] = [
	{u0: NICHE.x0 + HALF_W + T, u1: NICHE.x1 + HALF_W + T, v0: 0, v1: NICHE.top},
];

const floorMinX = WALL.west - T;
const floorMaxX = ENTRY_X1 + ENTRANCE.corridorEast + 0.1;
const floorMinZ = WALL.north - T;
const floorMaxZ = ENTRY_DOOR_Z + T + ENTRANCE.corridorLength;

export const Room: React.FC = () => {
	const m = useMats();
	const fw = floorMaxX - floorMinX;
	const fd = floorMaxZ - floorMinZ;
	const skirt = m.granite(2, SKIRTING.height);
	const corridorMat = React.useMemo(
		() => new THREE.MeshStandardMaterial({color: COLORS.corridor, roughness: 0.9}),
		[],
	);

	// Double-door niche: sill blocks below the side windows, set back to the frame plane.
	const ddFrameZ = WALL.north - DOUBLE_DOOR.nicheDepth;
	const leftWinX0 = DOUBLE_DOOR.centerX - DD_TOTAL_W / 2;
	const leftWinX1 = leftWinX0 + DOUBLE_DOOR.sideWindowWidth + 2 * DOUBLE_DOOR.frameWidth;
	const rightWinX1 = DOUBLE_DOOR.centerX + DD_TOTAL_W / 2;
	const rightWinX0 = rightWinX1 - DOUBLE_DOOR.sideWindowWidth - 2 * DOUBLE_DOOR.frameWidth;
	const sill = DOUBLE_DOOR.sideWindowSill;

	return (
		<group>
			{/* Floor */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[(floorMinX + floorMaxX) / 2, 0, (floorMinZ + floorMaxZ) / 2]}
				material={m.granite(fw, fd)}
				receiveShadow
			>
				<planeGeometry args={[fw, fd]} />
			</mesh>

			{/* West wall — window (IMG_2) */}
			<WallSlab
				length={ROOM.depth + 2 * T}
				height={H}
				thickness={T}
				holes={WEST_HOLES}
				material={m.wall}
				position={[WALL.west, 0, HALF_D + T]}
				rotationY={Math.PI / 2}
			/>
			{/* North wall — double door niche (IMG_3) */}
			<WallSlab
				length={ROOM.width + 2 * T}
				height={H}
				thickness={T}
				holes={NORTH_HOLES}
				material={m.wall}
				position={[WALL.west - T, 0, WALL.north]}
				rotationY={0}
			/>
			{/* East wall — bed wall (IMG_4), continues along the entry passage */}
			<WallSlab
				length={ENTRY_DOOR_Z - WALL.north + 2 * T}
				height={H}
				thickness={T}
				material={m.wall}
				position={[WALL.east, 0, WALL.north - T]}
				rotationY={-Math.PI / 2}
			/>
			{/* South wall — entrance wall (IMG_1), west of the passage */}
			<WallSlab
				length={ENTRY_X0 - WALL.west + T}
				height={H}
				thickness={T}
				material={m.wall}
				position={[ENTRY_X0, 0, WALL.south]}
				rotationY={Math.PI}
			/>
			{/* Passage side wall (the ~0.3 m projection) */}
			<BoxMM min={[ENTRY_X0 - T, 0, WALL.south]} max={[ENTRY_X0, H, ENTRY_DOOR_Z + T]} material={m.wall} />
			{/* Wall above the entry door */}
			<BoxMM
				min={[ENTRY_X0 - T, ENTRANCE.doorHeight, ENTRY_DOOR_Z]}
				max={[ENTRY_X1 + T, H, ENTRY_DOOR_Z + T]}
				material={m.wall}
			/>

			{/* Double-door niche sill blocks */}
			<BoxMM min={[leftWinX0, 0, WALL.north - T]} max={[leftWinX1, sill, ddFrameZ]} material={m.wall} />
			<BoxMM min={[rightWinX0, 0, WALL.north - T]} max={[rightWinX1, sill, ddFrameZ]} material={m.wall} />
			{/* niche margin strips beside the frame (plaster returns) */}
			<BoxMM min={[NICHE.x0, 0, WALL.north - T]} max={[leftWinX0, NICHE.top, ddFrameZ]} material={m.wall} />
			<BoxMM min={[rightWinX1, 0, WALL.north - T]} max={[NICHE.x1, NICHE.top, ddFrameZ]} material={m.wall} />
			<BoxMM
				min={[NICHE.x0, DOUBLE_DOOR.doorHeight + DOUBLE_DOOR.frameWidth, WALL.north - T]}
				max={[NICHE.x1, NICHE.top, ddFrameZ]}
				material={m.wall}
			/>

			{/* Loft slab along the entrance wall + over the passage */}
			<BoxMM
				min={[WALL.west, LOFT.bottom, LOFT_FRONT_Z]}
				max={[WALL.east, LOFT_TOP, WALL.south]}
				material={m.wall}
				castShadow
			/>
			<BoxMM
				min={[ENTRY_X0, LOFT.bottom, WALL.south - 0.01]}
				max={[ENTRY_X1, LOFT_TOP, ENTRY_DOOR_Z]}
				material={m.wall}
			/>

			{/* Granite skirting */}
			<group>
				{/* west */}
				<BoxMM
					min={[WALL.west, 0, WALL.north]}
					max={[WALL.west + SKIRTING.thickness, SKIRTING.height, WALL.south]}
					material={skirt}
				/>
				{/* east (incl. passage) */}
				<BoxMM
					min={[WALL.east - SKIRTING.thickness, 0, WALL.north]}
					max={[WALL.east, SKIRTING.height, ENTRY_DOOR_Z]}
					material={skirt}
				/>
				{/* south */}
				<BoxMM
					min={[WALL.west, 0, WALL.south - SKIRTING.thickness]}
					max={[ENTRY_X0, SKIRTING.height, WALL.south]}
					material={skirt}
				/>
				{/* passage side */}
				<BoxMM
					min={[ENTRY_X0, 0, WALL.south]}
					max={[ENTRY_X0 + SKIRTING.thickness, SKIRTING.height, ENTRY_DOOR_Z]}
					material={skirt}
				/>
				{/* north, either side of the niche */}
				<BoxMM
					min={[WALL.west, 0, WALL.north]}
					max={[NICHE.x0, SKIRTING.height, WALL.north + SKIRTING.thickness]}
					material={skirt}
				/>
				<BoxMM
					min={[NICHE.x1, 0, WALL.north]}
					max={[WALL.east, SKIRTING.height, WALL.north + SKIRTING.thickness]}
					material={skirt}
				/>
				{/* along the niche sill blocks and returns */}
				<BoxMM
					min={[NICHE.x0, 0, ddFrameZ]}
					max={[leftWinX1, SKIRTING.height, ddFrameZ + SKIRTING.thickness]}
					material={skirt}
				/>
				<BoxMM
					min={[rightWinX0, 0, ddFrameZ]}
					max={[NICHE.x1, SKIRTING.height, ddFrameZ + SKIRTING.thickness]}
					material={skirt}
				/>
			</group>

			{/* Corridor behind the entry door (dim, only seen in the dolly-in) */}
			<group>
				{(() => {
					const x0 = ENTRY_X0 - ENTRANCE.corridorWest;
					const x1 = ENTRY_X1 + ENTRANCE.corridorEast;
					const z0 = ENTRY_DOOR_Z + T;
					const z1 = z0 + ENTRANCE.corridorLength;
					const ch = 2.85;
					return (
						<>
							<BoxMM min={[x0 - 0.1, 0, z0]} max={[x0, ch, z1]} material={corridorMat} />
							<BoxMM min={[x1, 0, z0]} max={[x1 + 0.1, ch, z1]} material={corridorMat} />
							<BoxMM min={[x0 - 0.1, 0, z1]} max={[x1 + 0.1, ch, z1 + 0.1]} material={corridorMat} />
							<BoxMM min={[x0 - 0.1, ch, z0]} max={[x1 + 0.1, ch + 0.1, z1 + 0.1]} material={corridorMat} />
							<BoxMM min={[x0 - 0.1, ENTRANCE.doorHeight, z0 - 0.02]} max={[x1 + 0.1, ch, z0]} material={corridorMat} />
							<BoxMM min={[x0 - 0.1, 0, z0 - 0.02]} max={[ENTRY_X0 - T, ch, z0]} material={corridorMat} />
							<BoxMM min={[ENTRY_X1 + T, 0, z0 - 0.02]} max={[x1 + 0.1, ch, z0]} material={corridorMat} />
						</>
					);
				})()}
			</group>
		</group>
	);
};
