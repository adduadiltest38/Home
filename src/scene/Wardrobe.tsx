import React from 'react';
import {Box, BoxMM} from '../components/primitives';
import {useMats} from '../components/materials';
import {
	CEILING,
	LOFT,
	LOFT_CABINET,
	LOFT_FRONT_Z,
	LOFT_TOP,
	ROOM,
	WALL,
	WARDROBE,
	WARDROBE_X0,
	WARDROBE_X1,
} from '../config/room';

/**
 * 4-door handleless walnut wardrobe under the loft (IMG_1 wall) + flush
 * sliding loft shutters whose joints line up with the wardrobe doors.
 */
export const Wardrobe: React.FC = () => {
	const m = useMats();
	const doorW = (WARDROBE.width - (WARDROBE.doors - 1) * WARDROBE.reveal) / WARDROBE.doors;
	const doorH = LOFT.bottom - 0.006;
	const zFront = LOFT_FRONT_Z;
	const t = WARDROBE.doorThickness;
	const doorMat = m.walnut(doorW, doorH);

	// loft shutters
	const loftH = ROOM.height - CEILING.bandDrop - LOFT_TOP - 0.004;
	const panelW = LOFT_CABINET.panelWidth - WARDROBE.reveal;
	const nPanels = Math.round((WALL.east - WALL.west) / LOFT_CABINET.panelWidth);
	const loftX0 = WARDROBE_X0 - Math.round((WARDROBE_X0 - WALL.west) / LOFT_CABINET.panelWidth) * LOFT_CABINET.panelWidth;
	const loftMat = m.walnut(panelW, loftH);

	return (
		<group>
			{/* carcass */}
			<BoxMM min={[WARDROBE_X0, 0, zFront + t]} max={[WARDROBE_X1, LOFT.bottom, WALL.south]} material={m.black} />
			{/* doors */}
			{Array.from({length: WARDROBE.doors}, (_, i) => {
				const x = WARDROBE_X0 + i * (doorW + WARDROBE.reveal) + doorW / 2;
				return (
					<Box
						key={i}
						size={[doorW, doorH, t]}
						position={[x, 0.003 + doorH / 2, zFront + t / 2]}
						material={doorMat}
						castShadow
					/>
				);
			})}
			{/* 2 slim vertical champagne-gold profile pulls at each pair's meeting joint */}
			{[1, 3].map((k) => {
				const x = WARDROBE_X0 + k * (doorW + WARDROBE.reveal) - WARDROBE.reveal / 2;
				return (
					<Box
						key={k}
						size={[WARDROBE.pullWidth, WARDROBE.pullLength, 0.014]}
						position={[x, 1.05, zFront - 0.004]}
						material={m.gold}
					/>
				);
			})}

			{/* loft sliding shutters on top of the slab */}
			<BoxMM min={[WALL.west, LOFT_TOP, zFront + 0.03]} max={[WALL.east, ROOM.height, WALL.south]} material={m.black} />
			{Array.from({length: nPanels}, (_, i) => {
				const x = loftX0 + i * LOFT_CABINET.panelWidth + LOFT_CABINET.panelWidth / 2;
				if (x - panelW / 2 < WALL.west - 0.01 || x + panelW / 2 > WALL.east + 0.01) return null;
				return (
					<Box
						key={i}
						size={[panelW, loftH, LOFT_CABINET.thickness]}
						position={[x, LOFT_TOP + 0.002 + loftH / 2, zFront + LOFT_CABINET.thickness / 2 + (i % 2) * 0.004]}
						material={loftMat}
					/>
				);
			})}
		</group>
	);
};
