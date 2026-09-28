import React, {createContext, useContext, useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {COLORS, FABRIC, GOLD, TEAK, WALNUT} from '../config/palette';

/** Real-world size (m) one texture tile covers. */
const TILE = {
	walnut: [0.5, 1.0],
	teak: [0.35, 0.9],
	granite: [1.2, 1.2],
	fabric: [0.25, 0.25],
} as const;

type Mats = {
	/** walnut sized for a surface of w × h metres (grain vertical along h) */
	walnut: (w: number, h: number, horizontalGrain?: boolean) => THREE.MeshPhysicalMaterial;
	teak: (w: number, h: number) => THREE.MeshPhysicalMaterial;
	granite: (w: number, h: number) => THREE.MeshStandardMaterial;
	wall: THREE.MeshStandardMaterial;
	ceiling: THREE.MeshStandardMaterial;
	ceilingShape: THREE.MeshStandardMaterial;
	gold: THREE.MeshStandardMaterial;
	cream: THREE.MeshStandardMaterial;
	beige: THREE.MeshStandardMaterial;
	taupe: THREE.MeshStandardMaterial;
	ivoryRug: THREE.MeshStandardMaterial;
	ceramic: THREE.MeshPhysicalMaterial;
	windowFrame: THREE.MeshStandardMaterial;
	grill: THREE.MeshStandardMaterial;
	switchPlate: THREE.MeshStandardMaterial;
	glass: THREE.MeshPhysicalMaterial;
	led: THREE.MeshBasicMaterial;
	black: THREE.MeshStandardMaterial;
	walnutFan: THREE.MeshStandardMaterial;
	fanBlade: THREE.MeshStandardMaterial;
	fanBowl: THREE.MeshStandardMaterial;
};

const Ctx = createContext<Mats | null>(null);

export const useMats = (): Mats => {
	const m = useContext(Ctx);
	if (!m) throw new Error('useMats must be used inside <MaterialsProvider>');
	return m;
};

function sized(
	base: THREE.Texture,
	cache: Map<string, THREE.Texture>,
	tile: readonly [number, number],
	w: number,
	h: number,
	rotate = false,
) {
	const rx = +(w / tile[0]).toFixed(2);
	const ry = +(h / tile[1]).toFixed(2);
	const key = `${rx}:${ry}:${rotate}`;
	let t = cache.get(key);
	if (!t) {
		t = base.clone();
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		if (rotate) {
			t.rotation = Math.PI / 2;
			t.center.set(0.5, 0.5);
			t.repeat.set(ry, rx);
		} else {
			t.repeat.set(rx, ry);
		}
		t.needsUpdate = true;
		cache.set(key, t);
	}
	return t;
}

export const MaterialsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
	const [walnutTex, teakTex, graniteTex, fabricN] = useTexture([
		staticFile('textures/walnut_grain.jpg'),
		staticFile('textures/teak_door.jpg'),
		staticFile('textures/floor_granite.jpg'),
		staticFile('textures/fabric_normal.jpg'),
	]);

	const mats = useMemo<Mats>(() => {
		for (const t of [walnutTex, teakTex, graniteTex]) {
			t.colorSpace = THREE.SRGBColorSpace;
			t.anisotropy = 8;
		}
		fabricN.wrapS = fabricN.wrapT = THREE.RepeatWrapping;
		fabricN.repeat.set(6, 6);

		const texCache = new Map<string, THREE.Texture>();
		const matCache = new Map<string, THREE.Material>();
		const memo = <M extends THREE.Material>(key: string, make: () => M): M => {
			let m = matCache.get(key) as M | undefined;
			if (!m) {
				m = make();
				matCache.set(key, m);
			}
			return m;
		};

		const fabric = (color: string, roughness: number, normalScale = 0.25) =>
			new THREE.MeshStandardMaterial({
				color,
				roughness,
				normalMap: fabricN,
				normalScale: new THREE.Vector2(normalScale, normalScale),
			});

		return {
			walnut: (w, h, horizontalGrain = false) =>
				memo(`walnut:${w.toFixed(2)}:${h.toFixed(2)}:${horizontalGrain}`, () => {
					const map = horizontalGrain
						? sized(walnutTex, texCache, TILE.walnut, h, w, true)
						: sized(walnutTex, texCache, TILE.walnut, w, h);
					return new THREE.MeshPhysicalMaterial({
						map,
						color: WALNUT.tint,
						roughness: WALNUT.roughness,
						clearcoat: WALNUT.clearcoat,
						clearcoatRoughness: WALNUT.clearcoatRoughness,
					});
				}),
			teak: (w, h) =>
				memo(`teak:${w.toFixed(2)}:${h.toFixed(2)}`, () =>
					new THREE.MeshPhysicalMaterial({
						map: sized(teakTex, texCache, TILE.teak, w, h),
						color: TEAK.tint,
						roughness: TEAK.roughness,
						clearcoat: TEAK.clearcoat,
						clearcoatRoughness: 0.4,
					}),
				),
			granite: (w, h) =>
				memo(`granite:${w.toFixed(2)}:${h.toFixed(2)}`, () =>
					new THREE.MeshStandardMaterial({
						map: sized(graniteTex, texCache, TILE.granite, w, h),
						roughness: 0.32,
						metalness: 0,
						envMapIntensity: 0.6,
					}),
				),
			wall: new THREE.MeshStandardMaterial({color: COLORS.wall, roughness: 0.92}),
			ceiling: new THREE.MeshStandardMaterial({color: COLORS.ceiling, roughness: 0.95}),
			ceilingShape: new THREE.MeshStandardMaterial({color: COLORS.ceilingShape, roughness: 0.95}),
			gold: new THREE.MeshStandardMaterial({...GOLD, envMapIntensity: 1.4}),
			cream: fabric(FABRIC.cream.color, FABRIC.cream.roughness, 0.2),
			beige: fabric(FABRIC.beige.color, FABRIC.beige.roughness, FABRIC.beige.normalScale),
			taupe: fabric(FABRIC.taupe.color, FABRIC.taupe.roughness, 0.3),
			ivoryRug: fabric(COLORS.ivoryRug, 1, 0.6),
			ceramic: new THREE.MeshPhysicalMaterial({
				color: COLORS.ceramic,
				roughness: 0.35,
				clearcoat: 0.6,
				clearcoatRoughness: 0.2,
			}),
			windowFrame: new THREE.MeshStandardMaterial({color: COLORS.windowFrame, roughness: 0.5}),
			grill: new THREE.MeshStandardMaterial({color: COLORS.grill, roughness: 0.45}),
			switchPlate: new THREE.MeshStandardMaterial({color: COLORS.switchPlate, roughness: 0.3}),
			glass: new THREE.MeshPhysicalMaterial({
				color: '#9fb3c4',
				roughness: 0.15,
				metalness: 0,
				transparent: true,
				opacity: 0.18,
				depthWrite: false,
			}),
			led: new THREE.MeshBasicMaterial({color: new THREE.Color(COLORS.led3000k).multiplyScalar(3)}),
			black: new THREE.MeshStandardMaterial({color: '#151311', roughness: 0.6}),
			walnutFan: new THREE.MeshStandardMaterial({color: COLORS.fanBody, roughness: 0.4, metalness: 0.3}),
			fanBlade: new THREE.MeshStandardMaterial({color: COLORS.fanBlade, roughness: 0.55}),
			fanBowl: new THREE.MeshStandardMaterial({
				color: '#F3E9D8',
				roughness: 0.3,
				emissive: COLORS.led3000k,
				emissiveIntensity: 0.25,
			}),
		};
	}, [walnutTex, teakTex, graniteTex, fabricN]);

	return <Ctx.Provider value={mats}>{children}</Ctx.Provider>;
};
