import React from 'react';
import {Box} from '../components/primitives';
import {useMats} from '../components/materials';
import {ELECTRICAL, WALL} from '../config/room';

type Point = {wall: string; along: number; y: number; w: number; h: number};

/** Existing switchboards / sockets, kept at the positions seen in the photos. */
const Plate: React.FC<{p: Point; kind: 'board' | 'socket' | 'regulator'}> = ({p, kind}) => {
	const m = useMats();
	let position: [number, number, number];
	let rotY: number;
	if (p.wall === 'east') {
		position = [WALL.east - 0.004, p.y, p.along];
		rotY = -Math.PI / 2;
	} else if (p.wall === 'west') {
		position = [WALL.west + 0.004, p.y, p.along];
		rotY = Math.PI / 2;
	} else {
		position = [p.along, p.y, WALL.north + 0.004];
		rotY = 0;
	}
	const rockers = kind === 'board' ? 3 : kind === 'regulator' ? 2 : 0;
	return (
		<group position={position} rotation={[0, rotY, 0]}>
			<Box size={[p.w, p.h, 0.008]} material={m.switchPlate} />
			{Array.from({length: rockers}, (_, i) => (
				<Box
					key={i}
					size={[0.014, 0.026, 0.006]}
					position={[p.w / 2 - 0.02 - i * 0.02, 0.005, 0.006]}
					material={m.switchPlate}
				/>
			))}
			{kind !== 'socket' && (
				<Box size={[0.03, 0.03, 0.004]} position={[-p.w / 2 + 0.03, 0.0, 0.005]} material={m.black} />
			)}
			{kind === 'socket' && (
				<>
					<Box size={[0.006, 0.01, 0.004]} position={[-0.012, 0.006, 0.005]} material={m.black} />
					<Box size={[0.006, 0.01, 0.004]} position={[0.012, 0.006, 0.005]} material={m.black} />
					<Box size={[0.008, 0.012, 0.004]} position={[0, -0.014, 0.005]} material={m.black} />
				</>
			)}
		</group>
	);
};

export const Electrical: React.FC = () => (
	<group>
		<Plate p={ELECTRICAL.bedWallBoard} kind="board" />
		<Plate p={ELECTRICAL.bedWallSocket} kind="socket" />
		<Plate p={ELECTRICAL.bedWallAc} kind="socket" />
		<Plate p={ELECTRICAL.windowWallBoard} kind="regulator" />
		<Plate p={ELECTRICAL.windowWallAc} kind="socket" />
		<Plate p={ELECTRICAL.northWallAc} kind="socket" />
	</group>
);
