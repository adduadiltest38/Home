import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Box, BoxRow} from './primitives';
import {useMats} from './materials';

type V3 = [number, number, number];

/**
 * A framed window in its own local frame: origin = bottom-left corner of the
 * opening, x across, y up, z towards the room. The frame occupies z ∈ [-depth, 0].
 * Dark-brown frame + mullions, white horizontal-bar security grill (IMG_2/IMG_3).
 */
export const WindowUnit: React.FC<{
	width: number;
	height: number;
	panels: number;
	frameWidth: number;
	depth: number;
	/** skip the frame (when an outer frame is shared, e.g. the double-door assembly) */
	noOuterFrame?: boolean;
}> = ({width, height, panels, frameWidth: fw, depth, noOuterFrame}) => {
	const m = useMats();
	const innerW = width - 2 * fw;
	const paneW = (innerW - (panels - 1) * fw) / panels;
	const innerH = height - 2 * fw;
	const zMid = -depth / 2;

	const grill = useMemo(() => {
		const bars: V3[] = [];
		const rods: V3[] = [];
		const barPitch = 0.048;
		for (let p = 0; p < panels; p++) {
			const x0 = fw + p * (paneW + fw);
			const cx = x0 + paneW / 2;
			const inset = 0.035;
			rods.push([x0 + inset, fw + innerH / 2, 0], [x0 + paneW - inset, fw + innerH / 2, 0]);
			for (let y = fw + 0.06; y < fw + innerH - 0.04; y += barPitch) {
				bars.push([cx, y, 0]);
			}
		}
		return {bars, rods};
	}, [panels, paneW, fw, innerH]);

	return (
		<group>
			{!noOuterFrame && (
				<>
					<Box size={[width, fw, depth]} position={[width / 2, fw / 2, zMid]} material={m.windowFrame} />
					<Box size={[width, fw, depth]} position={[width / 2, height - fw / 2, zMid]} material={m.windowFrame} />
					<Box size={[fw, height, depth]} position={[fw / 2, height / 2, zMid]} material={m.windowFrame} />
					<Box size={[fw, height, depth]} position={[width - fw / 2, height / 2, zMid]} material={m.windowFrame} />
				</>
			)}
			{Array.from({length: panels - 1}, (_, i) => (
				<Box
					key={i}
					size={[fw, innerH, depth]}
					position={[fw + (i + 1) * paneW + i * fw + fw / 2, height / 2, zMid]}
					material={m.windowFrame}
				/>
			))}
			{/* glass shutters behind the grill */}
			{Array.from({length: panels}, (_, i) => (
				<group key={`g${i}`} position={[fw + i * (paneW + fw) + paneW / 2, height / 2, -depth + 0.015]}>
					<mesh material={m.glass}>
						<planeGeometry args={[paneW, innerH]} />
					</mesh>
					{/* thin shutter frame */}
					<Box size={[paneW, 0.035, 0.03]} position={[0, innerH / 2 - 0.0175, 0]} material={m.windowFrame} />
					<Box size={[paneW, 0.035, 0.03]} position={[0, -innerH / 2 + 0.0175, 0]} material={m.windowFrame} />
				</group>
			))}
			{/* white grill: horizontal bars between two vertical rods, per panel */}
			<group position={[0, 0, -depth * 0.35]}>
				<BoxRow size={[paneW - 0.07, 0.012, 0.018]} positions={grill.bars} material={m.grill} />
				<BoxRow size={[0.014, innerH - 0.02, 0.02]} positions={grill.rods} material={m.grill} />
			</group>
		</group>
	);
};

/** Vertical dusk gradient used for the sky outside the windows. */
export function useDuskMaterial(top: string, bottom: string) {
	return useMemo(() => {
		const n = 64;
		const data = new Uint8Array(n * 4);
		const a = new THREE.Color(bottom);
		const b = new THREE.Color(top);
		for (let i = 0; i < n; i++) {
			const c = a.clone().lerp(b, Math.pow(i / (n - 1), 0.7)).convertLinearToSRGB();
			data[i * 4] = Math.round(c.r * 255);
			data[i * 4 + 1] = Math.round(c.g * 255);
			data[i * 4 + 2] = Math.round(c.b * 255);
			data[i * 4 + 3] = 255;
		}
		const tex = new THREE.DataTexture(data, 1, n);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.magFilter = THREE.LinearFilter;
		tex.needsUpdate = true;
		return new THREE.MeshBasicMaterial({map: tex});
	}, [top, bottom]);
}
