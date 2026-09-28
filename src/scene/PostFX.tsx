import React, {useLayoutEffect, useMemo, useState} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {
	BlendFunction,
	BloomEffect,
	Effect,
	EffectComposer,
	EffectPass,
	RenderPass,
	SMAAEffect,
	SMAAPreset,
	ToneMappingEffect,
	ToneMappingMode,
	VignetteEffect,
} from 'postprocessing';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';
import {POST} from '../config/palette';

/**
 * Guards the HDR buffer before bloom: a single Inf/NaN pixel (e.g. a GGX
 * highlight overflowing half-float) would otherwise be smeared across the whole
 * frame by the mip-chain blur and turn it black.
 */
class SanitizeEffect extends Effect {
	constructor() {
		super(
			'Sanitize',
			/* glsl */ `
			void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
				vec3 c = inputColor.rgb;
				if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
				outputColor = vec4(clamp(c, 0.0, 48.0), inputColor.a);
			}`,
			{blendFunction: BlendFunction.SET},
		);
	}
}

/**
 * Sanitize → Bloom → ACES tone mapping → vignette → SMAA, built directly on the
 * `postprocessing` library.
 *
 * Why not @react-three/postprocessing's <EffectComposer>? It assembles its
 * passes over several asynchronous React commits, so the one render Remotion
 * captures per frame can happen before any pass exists (black frame). Here the
 * composer is built synchronously, renders from a priority-1 useFrame with a
 * fixed delta (deterministic), and the frame is held with delayRender until
 * SMAA's lookup textures have decoded.
 */
export const PostFX: React.FC = () => {
	const {gl, scene, camera, size, advance} = useThree();
	const [handle] = useState(() => delayRender('Decoding SMAA lookup textures'));

	const composer = useMemo(() => {
		const c = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 0});
		c.addPass(new RenderPass(scene, camera));
		c.addPass(new EffectPass(camera, new SanitizeEffect()));
		const bloom = new BloomEffect({
			intensity: POST.bloomIntensity,
			luminanceThreshold: POST.bloomThreshold,
			luminanceSmoothing: POST.bloomSmoothing,
			mipmapBlur: true,
		});
		const tone = new ToneMappingEffect({mode: ToneMappingMode.ACES_FILMIC});
		const vignette = new VignetteEffect({offset: POST.vignetteOffset, darkness: POST.vignetteDarkness});
		c.addPass(new EffectPass(camera, bloom, tone, vignette));
		const smaa = new SMAAEffect({preset: SMAAPreset.HIGH});
		// SMAAEffect dispatches 'load' once its embedded lookup images decode
		(smaa as unknown as THREE.EventDispatcher<{load: object}>).addEventListener('load', () => {
			advance(performance.now());
			continueRender(handle);
		});
		c.addPass(new EffectPass(camera, smaa));
		return c;
		// the camera is re-assigned every frame below; build once per renderer/scene
	}, [gl, scene]); // eslint-disable-line react-hooks/exhaustive-deps

	useLayoutEffect(() => {
		composer.setSize(size.width, size.height);
	}, [composer, size.width, size.height]);

	useLayoutEffect(() => {
		// tone mapping happens in the effect chain, not in the renderer
		const prev = gl.toneMapping;
		gl.toneMapping = THREE.NoToneMapping;
		return () => {
			gl.toneMapping = prev;
			composer.dispose();
		};
	}, [gl, composer]);

	useFrame((state) => {
		for (const pass of composer.passes) pass.mainCamera = state.camera;
		composer.render(1 / 30);
	}, 1);

	return null;
};
