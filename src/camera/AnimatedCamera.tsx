import React, {useLayoutEffect, useRef} from 'react';
import {PerspectiveCamera} from '@react-three/drei';
import * as THREE from 'three';
import {useGlobalFrame} from '../components/frame';
import {cameraAt} from './cameraPath';

/**
 * Frame-driven camera: position, look-at and FOV come purely from the global
 * composition frame (no useFrame, no clocks) so every render is deterministic.
 */
export const AnimatedCamera: React.FC<{frameOverride?: number}> = ({frameOverride}) => {
	const globalFrame = useGlobalFrame();
	const ref = useRef<THREE.PerspectiveCamera>(null);
	const state = cameraAt(frameOverride ?? globalFrame);

	useLayoutEffect(() => {
		const cam = ref.current;
		if (!cam) return;
		cam.position.copy(state.pos);
		cam.fov = state.fov;
		cam.lookAt(state.target);
		cam.updateProjectionMatrix();
		cam.updateMatrixWorld();
	});

	return <PerspectiveCamera ref={ref} makeDefault near={0.05} far={40} fov={state.fov} position={state.pos.toArray()} />;
};
