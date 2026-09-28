import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {AnimatedCamera} from '../camera/AnimatedCamera';
import {GlobalFrameProvider} from '../components/frame';
import {MaterialsProvider} from '../components/materials';
import {LIGHT} from '../config/palette';
import {Accessories} from './Accessories';
import {BedWall} from './BedWall';
import {Ceiling} from './Ceiling';
import {Curtains} from './Curtains';
import {DressingUnit} from './DressingUnit';
import {Electrical} from './Electrical';
import {Lighting} from './Lighting';
import {Openings} from './Openings';
import {PostFX} from './PostFX';
import {Room} from './Room';
import {Wardrobe} from './Wardrobe';
import {ZebraBlinds} from './ZebraBlinds';

export const SCENE_W = 1920;
export const SCENE_H = 1080;

/** The complete renovated bedroom, rendered from the frame-driven camera. */
export const Scene: React.FC<{globalFrame: number; postprocessing?: boolean}> = ({
	globalFrame,
	postprocessing = true,
}) => (
	<ThreeCanvas
		width={SCENE_W}
		height={SCENE_H}
		shadows="soft"
		dpr={1}
		gl={{
			antialias: !postprocessing,
			toneMapping: THREE.ACESFilmicToneMapping,
			toneMappingExposure: LIGHT.exposure,
			outputColorSpace: THREE.SRGBColorSpace,
			powerPreference: 'high-performance',
		}}
		style={{backgroundColor: '#000'}}
	>
		<GlobalFrameProvider frame={globalFrame}>
			<AnimatedCamera />
			{/* no own <Suspense>: ThreeCanvas' boundary turns texture loading into delayRender */}
			<MaterialsProvider>
				<Room />
				<Ceiling />
				<Openings />
				<Wardrobe />
				<DressingUnit />
				<Curtains />
				<ZebraBlinds />
				<BedWall />
				<Accessories />
				<Electrical />
			</MaterialsProvider>
			<Lighting />
			{postprocessing && <PostFX />}
		</GlobalFrameProvider>
	</ThreeCanvas>
);
