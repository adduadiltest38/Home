import React from 'react';
import {AbsoluteFill, interpolate, Series, useCurrentFrame} from 'remotion';
import {BeforeIntro} from './intro/BeforeIntro';
import {EndCard} from './intro/EndCard';
import {Scene} from './scene/Scene';

export const FPS = 30;
export const INTRO_FRAMES = 120; // 0–119
export const WALK_FRAMES = 780; // 120–899
export const END_FRAMES = 60; // 900–959
export const TOTAL_FRAMES = INTRO_FRAMES + WALK_FRAMES + END_FRAMES;
/** the 3D scene fades in over the last frames of the intro */
export const XFADE_FRAMES = 15;

const WALK_START = INTRO_FRAMES - XFADE_FRAMES;

const Walkthrough3D: React.FC = () => {
	const f = useCurrentFrame();
	const opacity = interpolate(f, [0, XFADE_FRAMES], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{opacity}}>
			{/* camera keyframes are in global frames; before 120 the camera holds its first pose */}
			<Scene globalFrame={WALK_START + f} />
		</AbsoluteFill>
	);
};

/** BeforeIntro → Walkthrough3D (one continuous camera move) → EndCard */
export const BedroomWalkthrough: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#000'}}>
		<Series>
			<Series.Sequence durationInFrames={INTRO_FRAMES} name="BeforeIntro">
				<BeforeIntro />
			</Series.Sequence>
			<Series.Sequence durationInFrames={WALK_FRAMES + XFADE_FRAMES} offset={-XFADE_FRAMES} name="Walkthrough3D">
				<Walkthrough3D />
			</Series.Sequence>
			<Series.Sequence durationInFrames={END_FRAMES} name="EndCard">
				<EndCard startFrame={INTRO_FRAMES + WALK_FRAMES} durationInFrames={END_FRAMES} />
			</Series.Sequence>
		</Series>
	</AbsoluteFill>
);
