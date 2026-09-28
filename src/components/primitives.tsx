import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';

type V3 = readonly [number, number, number];

/** Axis-aligned box given by its min/max corners — easiest way to place architecture. */
export const BoxMM: React.FC<{
	min: V3;
	max: V3;
	material: THREE.Material;
	castShadow?: boolean;
	receiveShadow?: boolean;
}> = ({min, max, material, castShadow, receiveShadow = true}) => {
	const size: V3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
	const pos: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
	return (
		<mesh position={pos} material={material} castShadow={castShadow} receiveShadow={receiveShadow}>
			<boxGeometry args={size as [number, number, number]} />
		</mesh>
	);
};

/** Centre/size box. */
export const Box: React.FC<{
	size: V3;
	position?: V3;
	rotation?: V3;
	material: THREE.Material;
	castShadow?: boolean;
	receiveShadow?: boolean;
}> = ({size, position = [0, 0, 0], rotation, material, castShadow, receiveShadow = true}) => (
	<mesh
		position={position as [number, number, number]}
		rotation={rotation as [number, number, number] | undefined}
		material={material}
		castShadow={castShadow}
		receiveShadow={receiveShadow}
	>
		<boxGeometry args={size as [number, number, number]} />
	</mesh>
);

/** Soft rounded box (cushions, mattress, upholstery channels). */
export const SoftBox: React.FC<{
	size: V3;
	radius: number;
	position?: V3;
	rotation?: V3;
	scale?: V3;
	material: THREE.Material;
	castShadow?: boolean;
	smoothness?: number;
}> = ({size, radius, position = [0, 0, 0], rotation, scale, material, castShadow, smoothness = 3}) => (
	<RoundedBox
		args={size as [number, number, number]}
		radius={radius}
		smoothness={smoothness}
		position={position as [number, number, number]}
		rotation={rotation as [number, number, number] | undefined}
		scale={scale as [number, number, number] | undefined}
		material={material}
		castShadow={castShadow}
		receiveShadow
	/>
);

export type Hole = {u0: number; u1: number; v0: number; v1: number};

/**
 * A wall slab in its local frame: u along the wall (0..length), v up (0..height),
 * extruded `thickness` towards local −Z. Holes are rectangular openings.
 */
export const WallSlab: React.FC<{
	length: number;
	height: number;
	thickness: number;
	holes?: Hole[];
	material: THREE.Material;
	position: V3;
	rotationY: number;
}> = ({length, height, thickness, holes = [], material, position, rotationY}) => {
	const geom = useMemo(() => {
		const s = new THREE.Shape();
		s.moveTo(0, 0);
		s.lineTo(length, 0);
		s.lineTo(length, height);
		s.lineTo(0, height);
		s.closePath();
		for (const h of holes) {
			const p = new THREE.Path();
			p.moveTo(h.u0, h.v0);
			p.lineTo(h.u0, h.v1);
			p.lineTo(h.u1, h.v1);
			p.lineTo(h.u1, h.v0);
			p.closePath();
			s.holes.push(p);
		}
		const g = new THREE.ExtrudeGeometry(s, {depth: thickness, bevelEnabled: false});
		g.translate(0, 0, -thickness);
		return g;
	}, [length, height, thickness, holes]);
	return (
		<mesh
			geometry={geom}
			material={material}
			position={position as [number, number, number]}
			rotation={[0, rotationY, 0]}
			receiveShadow
		/>
	);
};

/** Instanced row of identical boxes, e.g. slats or grill bars. */
export const BoxRow: React.FC<{
	size: V3;
	positions: V3[];
	material: THREE.Material;
	castShadow?: boolean;
}> = ({size, positions, material, castShadow}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	useLayoutEffect(() => {
		const m = new THREE.Matrix4();
		positions.forEach((p, i) => {
			m.makeTranslation(p[0], p[1], p[2]);
			ref.current!.setMatrixAt(i, m);
		});
		ref.current!.instanceMatrix.needsUpdate = true;
		ref.current!.computeBoundingSphere();
	}, [positions]);
	return (
		<instancedMesh
			ref={ref}
			args={[undefined, material, positions.length]}
			castShadow={castShadow}
			receiveShadow
		>
			<boxGeometry args={size as [number, number, number]} />
		</instancedMesh>
	);
};

/** Lathe helper: profile as [radius, y] pairs. */
export const Lathe: React.FC<{
	profile: Array<[number, number]>;
	material: THREE.Material;
	position?: V3;
	segments?: number;
	castShadow?: boolean;
}> = ({profile, material, position = [0, 0, 0], segments = 32, castShadow}) => {
	const geom = useMemo(
		() => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments),
		[profile, segments],
	);
	return (
		<mesh
			geometry={geom}
			material={material}
			position={position as [number, number, number]}
			castShadow={castShadow}
			receiveShadow
		/>
	);
};
