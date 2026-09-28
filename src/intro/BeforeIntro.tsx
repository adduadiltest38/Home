import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ensureFonts, FONT_FAMILY} from '../components/fonts';

ensureFonts();

export const PHOTOS = [
	{src: 'ref/IMG_1.png', zone: 'Entrance wall · Loft'},
	{src: 'ref/IMG_2.png', zone: 'Window wall'},
	{src: 'ref/IMG_3.png', zone: 'Double-door wall'},
	{src: 'ref/IMG_4.png', zone: 'Bed wall'},
] as const;

export const PHOTO_FRAMES = 30;
/** overlap between consecutive photos (cross-dissolve) */
const XFADE = 6;

const Photo: React.FC<{src: string; zone: string; index: number}> = ({src, zone, index}) => {
	const f = useCurrentFrame();
	const dur = PHOTO_FRAMES + XFADE;
	// slow Ken Burns zoom 1.00 → 1.08 over the photo's life
	const scale = interpolate(f, [0, dur], [1, 1.08], {extrapolateRight: 'clamp'});
	const drift = interpolate(f, [0, dur], [0, index % 2 === 0 ? -14 : 14], {extrapolateRight: 'clamp'});
	const fadeIn = index === 0 ? 1 : interpolate(f, [0, XFADE], [0, 1], {extrapolateRight: 'clamp'});
	const label = interpolate(f, [4, 14], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const url = staticFile(src);
	return (
		<AbsoluteFill style={{opacity: fadeIn, backgroundColor: '#0d0c0b'}}>
			{/* blurred, darkened fill so the portrait photo sits on a 16:9 frame */}
			<AbsoluteFill style={{transform: `scale(${1.15 * scale})`, filter: 'blur(38px) brightness(0.45)'}}>
				<Img src={url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						height: 1080 * 0.9,
						aspectRatio: '3 / 4',
						overflow: 'hidden',
						borderRadius: 6,
						boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
					}}
				>
					<Img
						src={url}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							transform: `scale(${scale}) translateX(${drift}px)`,
						}}
					/>
				</div>
			</AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: 120,
					bottom: 120,
					fontFamily: FONT_FAMILY,
					color: '#F4ECE0',
					opacity: label,
					transform: `translateY(${(1 - label) * 16}px)`,
				}}
			>
				<div style={{fontSize: 30, fontWeight: 500, letterSpacing: 12}}>BEFORE</div>
				<div style={{width: 64, height: 2, background: '#C8A96A', margin: '18px 0 16px'}} />
				<div style={{fontSize: 40, fontWeight: 300, letterSpacing: 1}}>{zone}</div>
				<div style={{fontSize: 22, fontWeight: 300, opacity: 0.6, marginTop: 8, letterSpacing: 2}}>
					{`0${index + 1} / 04`}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** 4 s: the four original photos with a slow Ken Burns zoom and zone labels. */
export const BeforeIntro: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#0d0c0b'}}>
		{PHOTOS.map((p, i) => (
			<Sequence
				key={p.src}
				from={i * PHOTO_FRAMES - (i === 0 ? 0 : XFADE)}
				durationInFrames={PHOTO_FRAMES + (i === 0 ? 0 : XFADE) + (i === PHOTOS.length - 1 ? 30 : XFADE)}
			>
				<Photo src={p.src} zone={p.zone} index={i} />
			</Sequence>
		))}
	</AbsoluteFill>
);
