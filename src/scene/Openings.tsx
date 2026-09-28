import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box} from '../components/primitives';
import {useMats} from '../components/materials';
import {WindowUnit, useDuskMaterial} from '../components/WindowUnit';
import {
	DD_TOTAL_W,
	DOUBLE_DOOR,
	ENTRANCE,
	ENTRY_DOOR_Z,
	ENTRY_X0,
	ENTRY_X1,
	ROOM,
	WALL,
	WINDOW,
} from '../config/room';
import {COLORS} from '../config/palette';

const T = ROOM.wallThickness;

/** Raised teak panel: optional arched top, bevelled edge. Local origin = panel bottom-centre. */
const RaisedPanel: React.FC<{w: number; h: number; arched?: boolean; material: THREE.Material}> = ({
	w,
	h,
	arched,
	material,
}) => {
	const geom = useMemo(() => {
		const s = new THREE.Shape();
		const r = w / 2;
		s.moveTo(-r, 0);
		s.lineTo(r, 0);
		if (arched) {
			s.lineTo(r, h - r);
			s.absarc(0, h - r, r, 0, Math.PI, false);
		} else {
			s.lineTo(r, h);
			s.lineTo(-r, h);
		}
		s.closePath();
		return new THREE.ExtrudeGeometry(s, {
			depth: 0.006,
			bevelEnabled: true,
			bevelThickness: 0.008,
			bevelSize: 0.012,
			bevelSegments: 2,
			curveSegments: 24,
		});
	}, [w, h, arched]);
	return <mesh geometry={geom} material={material} castShadow receiveShadow />;
};

/** One teak leaf of the IMG_3 double door, local origin bottom-left, front at z = 0. */
const TeakLeaf: React.FC<{w: number; h: number; t: number; mirror?: boolean}> = ({w, h, t, mirror}) => {
	const m = useMats();
	const teak = m.teak(w, h);
	const panelMat = m.teak(0.3, 0.9);
	const archW = w * 0.56;
	const lowerW = w * 0.28;
	const rows = [0.16, 0.45, 0.77];
	const lowerH = 0.24;
	const meetX = mirror ? 0.04 : w - 0.04; // meeting stile side
	return (
		<group>
			<Box size={[w, h, t]} position={[w / 2, h / 2, -t / 2]} material={teak} castShadow />
			{/* upper arched panel */}
			<group position={[w / 2, 1.15, 0]}>
				<RaisedPanel w={archW} h={0.85} arched material={panelMat} />
			</group>
			{/* 3 rows × 2 lower raised panels (6 per leaf) */}
			{rows.map((y) =>
				[-1, 1].map((sx) => (
					<group key={`${y}:${sx}`} position={[w / 2 + sx * (lowerW / 2 + 0.03), y, 0]}>
						<RaisedPanel w={lowerW} h={lowerH} material={panelMat} />
					</group>
				)),
			)}
			{/* mid rail moulding */}
			<Box size={[w - 0.08, 0.035, 0.012]} position={[w / 2, 1.07, 0.006]} material={teak} />
			{/* brass tower bolt at the top of the meeting stile */}
			<group position={[meetX, h - 0.22, 0.012]}>
				<Box size={[0.03, 0.16, 0.01]} material={m.gold} />
				<mesh position={[0, 0.03, 0.012]} rotation={[Math.PI / 2, 0, 0]} material={m.gold}>
					<cylinderGeometry args={[0.006, 0.006, 0.02, 10]} />
				</mesh>
			</group>
			{/* small brass pull + mid bolt */}
			<Box size={[0.012, 0.12, 0.02]} position={[meetX + (mirror ? 0.02 : -0.02), 1.02, 0.02]} material={m.gold} />
			{!mirror && <Box size={[0.14, 0.018, 0.012]} position={[w - 0.09, 0.72, 0.012]} material={m.gold} />}
		</group>
	);
};

export const Openings: React.FC = () => {
	const m = useMats();
	const dusk = useDuskMaterial(COLORS.dusk, '#C9A27E');
	const fw = DOUBLE_DOOR.frameWidth;
	const fd = DOUBLE_DOOR.frameDepth;
	const ddX0 = DOUBLE_DOOR.centerX - DD_TOTAL_W / 2;
	const ddZ = WALL.north - DOUBLE_DOOR.nicheDepth;
	const doorX0 = ddX0 + 2 * fw + DOUBLE_DOOR.sideWindowWidth;
	const doorX1 = doorX0 + DOUBLE_DOOR.doorWidth;
	const hTop = DOUBLE_DOOR.doorHeight;
	const sill = DOUBLE_DOOR.sideWindowSill;
	const sideW = DOUBLE_DOOR.sideWindowWidth + 2 * fw;
	const leafW = DOUBLE_DOOR.doorWidth / 2 - 0.004;

	const frame = m.teak(0.1, 2.1);
	const teakFrame = m.teak(0.1, 2.2);

	// entry door
	const eW = ENTRANCE.width;
	const eLeafW = eW - 0.08;
	const hingeX = ENTRY_X1 - 0.04;
	const hingeZ = ENTRY_DOOR_Z + T;

	return (
		<group>
			{/* ─── West wall: 3-panel window (IMG_2) ─── */}
			<group
				position={[WALL.west - 0.015, WINDOW.sill, WINDOW.centerZ + WINDOW.width / 2]}
				rotation={[0, Math.PI / 2, 0]}
			>
				<WindowUnit
					width={WINDOW.width}
					height={WINDOW.height}
					panels={WINDOW.panels}
					frameWidth={WINDOW.frameWidth}
					depth={WINDOW.frameDepth}
				/>
			</group>
			<mesh position={[WALL.west - 1.2, 1.5, WINDOW.centerZ]} rotation={[0, Math.PI / 2, 0]} material={dusk}>
				<planeGeometry args={[4, 3.2]} />
			</mesh>

			{/* ─── North wall: window | teak double door | window, one wooden frame (IMG_3) ─── */}
			<group position={[0, 0, ddZ]}>
				{/* outer frame: head + jambs + mullions (teak, like the photo) */}
				<Box size={[DD_TOTAL_W, fw, fd]} position={[DOUBLE_DOOR.centerX, hTop + fw / 2, -fd / 2]} material={teakFrame} />
				{[ddX0, doorX0 - fw, doorX1, ddX0 + DD_TOTAL_W - fw].map((x, i) => (
					<Box key={i} size={[fw, hTop, fd]} position={[x + fw / 2, hTop / 2, -fd / 2]} material={teakFrame} />
				))}
				{/* side windows (frames share the outer frame; sill member added) */}
				{[ddX0 + fw, doorX1 + fw].map((x, i) => (
					<group key={`w${i}`}>
						<Box
							size={[DOUBLE_DOOR.sideWindowWidth, fw, fd]}
							position={[x + DOUBLE_DOOR.sideWindowWidth / 2, sill + fw / 2, -fd / 2]}
							material={teakFrame}
						/>
						<group position={[x - fw, sill, 0]}>
							<WindowUnit
								width={sideW}
								height={hTop - sill + fw}
								panels={1}
								frameWidth={fw}
								depth={fd}
								noOuterFrame
							/>
						</group>
					</group>
				))}
				{/* teak double door, closed */}
				<group position={[doorX0 + 0.002, 0.005, -0.02]}>
					<TeakLeaf w={leafW} h={hTop - 0.01} t={DOUBLE_DOOR.leafThickness} />
				</group>
				<group position={[doorX0 + leafW + 0.006, 0.005, -0.02]}>
					<TeakLeaf w={leafW} h={hTop - 0.01} t={DOUBLE_DOOR.leafThickness} mirror />
				</group>
			</group>
			<mesh position={[DOUBLE_DOOR.centerX, 1.5, WALL.north - 1.3]} material={dusk}>
				<planeGeometry args={[4.5, 3.2]} />
			</mesh>

			{/* ─── Entry door (IMG_1): frame + leaf swung out into the corridor ─── */}
			<group>
				<Box size={[0.05, ENTRANCE.doorHeight, T]} position={[ENTRY_X0 + 0.025, ENTRANCE.doorHeight / 2, ENTRY_DOOR_Z + T / 2]} material={frame} />
				<Box size={[0.05, ENTRANCE.doorHeight, T]} position={[ENTRY_X1 - 0.025, ENTRANCE.doorHeight / 2, ENTRY_DOOR_Z + T / 2]} material={frame} />
				<Box size={[eW, 0.05, T]} position={[(ENTRY_X0 + ENTRY_X1) / 2, ENTRANCE.doorHeight - 0.025, ENTRY_DOOR_Z + T / 2]} material={frame} />
				<group position={[hingeX, 0, hingeZ]} rotation={[0, THREE.MathUtils.degToRad(ENTRANCE.leafOpenDeg), 0]}>
					{/* leaf thickness on local −z so, swung ~180°, it lies on the corridor side of the wall */}
					<Box
						size={[eLeafW, ENTRANCE.doorHeight - 0.06, ENTRANCE.leafThickness]}
						position={[-eLeafW / 2, (ENTRANCE.doorHeight - 0.06) / 2, -ENTRANCE.leafThickness / 2 - 0.005]}
						material={m.teak(eLeafW, 2)}
					/>
					<Box size={[0.02, 0.14, 0.03]} position={[-eLeafW + 0.07, 1.0, -ENTRANCE.leafThickness - 0.02]} material={m.gold} />
				</group>
			</group>
		</group>
	);
};
