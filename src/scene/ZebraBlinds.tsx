import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box} from '../components/primitives';
import {useMats} from '../components/materials';
import {DD_TOTAL_W, DOUBLE_DOOR, WALL} from '../config/room';
import {COLORS} from '../config/palette';

const OPAQUE = 0.07;
const SHEER = 0.05;
const PITCH = OPAQUE + SHEER;
/** fraction of the window height the blind is lowered */
const LOWERED = 0.5;

/** Day-night (zebra) roller blind inside the recess of each IMG_3 side window. */
export const ZebraBlinds: React.FC = () => {
	const m = useMats();

	const stripeMat = useMemo(() => {
		// one pitch = 24 px: 14 opaque, 10 sheer
		const px = 24;
		const data = new Uint8Array(px * 4);
		const c = new THREE.Color(COLORS.creamFabric).convertLinearToSRGB();
		for (let i = 0; i < px; i++) {
			const opaque = i < Math.round((OPAQUE / PITCH) * px);
			data.set([c.r * 255, c.g * 255, c.b * 255, opaque ? 255 : 90].map(Math.round), i * 4);
		}
		const tex = new THREE.DataTexture(data, 1, px);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
		tex.magFilter = THREE.LinearFilter;
		tex.needsUpdate = true;
		return (len: number) => {
			const t = tex.clone();
			t.repeat.set(1, len / PITCH);
			t.needsUpdate = true;
			return new THREE.MeshStandardMaterial({
				map: t,
				transparent: true,
				roughness: 0.9,
				side: THREE.DoubleSide,
				depthWrite: false,
			});
		};
	}, []);

	const fw = DOUBLE_DOOR.frameWidth;
	const ddX0 = DOUBLE_DOOR.centerX - DD_TOTAL_W / 2;
	const winXs = [ddX0 + fw, ddX0 + DD_TOTAL_W - fw - DOUBLE_DOOR.sideWindowWidth];
	const top = DOUBLE_DOOR.doorHeight;
	const glassH = top - (DOUBLE_DOOR.sideWindowSill + fw);
	const len = glassH * LOWERED;
	const w = DOUBLE_DOOR.sideWindowWidth + 0.04;
	const z = WALL.north - DOUBLE_DOOR.nicheDepth + 0.035;
	const mat = useMemo(() => stripeMat(len), [stripeMat, len]);

	return (
		<group>
			{winXs.map((x0, i) => {
				const cx = x0 + DOUBLE_DOOR.sideWindowWidth / 2;
				return (
					<group key={i}>
						{/* cassette + roller */}
						<Box size={[w + 0.02, 0.06, 0.06]} position={[cx, top + 0.035, z]} material={m.cream} />
						{/* two fabric layers, aligned (open "day" position) */}
						<mesh position={[cx, top - len / 2, z + 0.004]} material={mat}>
							<planeGeometry args={[w, len]} />
						</mesh>
						<mesh position={[cx, top - len / 2, z - 0.004]} material={mat}>
							<planeGeometry args={[w, len]} />
						</mesh>
						{/* weighted bottom rail */}
						<Box size={[w, 0.022, 0.02]} position={[cx, top - len - 0.011, z]} material={m.cream} />
						<Box size={[w * 0.9, 0.004, 0.022]} position={[cx, top - len - 0.02, z]} material={m.gold} />
					</group>
				);
			})}
		</group>
	);
};
