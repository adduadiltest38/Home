import {continueRender, delayRender, staticFile} from 'remotion';

export const FONT_FAMILY = 'Jost';

let loaded = false;

/** Load the bundled Jost font (OFL) once; blocks rendering until it is ready. */
export function ensureFonts() {
	if (loaded || typeof document === 'undefined') return;
	loaded = true;
	const handle = delayRender('Loading Jost font');
	const faces = [
		new FontFace(FONT_FAMILY, `url(${staticFile('fonts/jost-latin-300-normal.woff2')}) format('woff2')`, {weight: '300'}),
		new FontFace(FONT_FAMILY, `url(${staticFile('fonts/jost-latin-500-normal.woff2')}) format('woff2')`, {weight: '500'}),
	];
	Promise.all(faces.map((f) => f.load()))
		.then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
			continueRender(handle);
		})
		.catch((err) => {
			console.error(err);
			continueRender(handle);
		});
}
