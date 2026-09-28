import React from 'react';
import {Composition} from 'remotion';
import {BedroomWalkthrough, FPS, TOTAL_FRAMES} from './BedroomWalkthrough';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="BedroomWalkthrough"
		component={BedroomWalkthrough}
		durationInFrames={TOTAL_FRAMES}
		fps={FPS}
		width={1920}
		height={1080}
	/>
);
