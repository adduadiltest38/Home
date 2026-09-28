/** Colours, material parameters and light temperatures — tweak the look here. */

export const COLORS = {
	wall: '#EFE6D8',
	ceiling: '#F4EEE4',
	ceilingShape: '#EDE7DD',
	walnut: '#5A3A22',
	teak: '#8A5A2B',
	creamFabric: '#EDE3D1',
	beigeUpholstery: '#D6C4A8',
	taupeBlackout: '#8B7865',
	champagneGold: '#C8A96A',
	led3000k: '#FFB46B',
	/**
	 * Colour used for the actual light sources: 3000K after a mild camera
	 * white balance (~3500K), so the room reads warm rather than orange.
	 * Visible LED strips / lamp shades still use the raw 3000K colour.
	 */
	light3000k: '#FFD2A6',
	/** dark brown window frames (IMG_2) */
	windowFrame: '#3B2419',
	grill: '#EDEBE6',
	granite: '#9A9EA6',
	ivoryRug: '#EEE6D6',
	ceramic: '#E9E2D6',
	plantGreen: '#3E5B35',
	plantGreenLight: '#6E8B4A',
	pot: '#CFC6B8',
	switchPlate: '#F7F6F2',
	fanBody: '#6B4A33',
	fanBlade: '#CDBFA8',
	/** dusk sky seen through the windows */
	dusk: '#5D6F8A',
	corridor: '#CBBDAA',
} as const;

/** MeshPhysicalMaterial params shared by all walnut surfaces (keeps tone consistent). */
export const WALNUT = {
	/** texture already carries the walnut colour, so the tint stays near white */
	tint: '#FFFFFF',
	roughness: 0.45,
	clearcoat: 0.3,
	clearcoatRoughness: 0.35,
} as const;

export const TEAK = {tint: '#FFF6EA', roughness: 0.5, clearcoat: 0.25} as const;

export const FABRIC = {
	cream: {color: COLORS.creamFabric, roughness: 0.9},
	beige: {color: COLORS.beigeUpholstery, roughness: 0.85, normalScale: 0.35},
	taupe: {color: COLORS.taupeBlackout, roughness: 0.9},
} as const;

export const GOLD = {color: COLORS.champagneGold, metalness: 0.9, roughness: 0.3} as const;

/** Light intensities (physically based units, R3F v9 defaults). */
export const LIGHT = {
	ambient: 0.08,
	hemiSky: '#FFE6CC',
	hemiGround: '#4A4038',
	hemi: 0.55,
	downlight: 16,
	downlightAngleDeg: 38,
	downlightPenumbra: 0.85,
	cove: 2.2,
	coveEmissive: 3.2,
	backdrop: 10,
	backdropEmissive: 3.5,
	bedsideLamp: 1.6,
	mirrorHalo: 2,
	mirrorEmissive: 3,
	exposure: 1.1,
} as const;

/** Postprocessing — keep subtle */
export const POST = {
	bloomIntensity: 0.4,
	bloomThreshold: 0.85,
	bloomSmoothing: 0.2,
	vignetteOffset: 0.3,
	vignetteDarkness: 0.45,
} as const;
