import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {WALK_END} from '../camera/cameraPath';
import {ensureFonts, FONT_FAMILY} from '../components/fonts';
import {Scene} from '../scene/Scene';

ensureFonts();

/** 2 s: hold on the hero wide, subtle "AFTER" label, fade to black. */
export const EndCard: React.FC<{startFrame: number; durationInFrames: number}> = ({startFrame, durationInFrames}) => {
	const f = useCurrentFrame();
	const label = interpolate(f, [2, 18], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const black = interpolate(f, [durationInFrames - 26, durationInFrames - 1], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.quad),
	});
	return (
		<AbsoluteFill>
			{/* the camera path is clamped at WALK_END, so this is the exact hero framing */}
			<Scene globalFrame={Math.max(startFrame + f, WALK_END)} />
			<AbsoluteFill
				style={{
					background: 'linear-gradient(90deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0) 45%)',
					opacity: label,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 120,
					bottom: 120,
					fontFamily: FONT_FAMILY,
					color: '#F7F0E6',
					opacity: label,
					transform: `translateY(${(1 - label) * 16}px)`,
				}}
			>
				<div style={{fontSize: 30, fontWeight: 500, letterSpacing: 12}}>AFTER</div>
				<div style={{width: 64, height: 2, background: '#C8A96A', margin: '18px 0 16px'}} />
				<div style={{fontSize: 40, fontWeight: 300, letterSpacing: 1}}>Bedroom renovation proposal</div>
			</div>
			<AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
		</AbsoluteFill>
	);
};
