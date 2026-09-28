// See all configuration options: https://remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Hardware-independent WebGL via ANGLE so three.js renders the same everywhere.
Config.setChromiumOpenGlRenderer('angle');
// Texture decoding + shader compilation of the 3D scene can take a while on CPU.
Config.setDelayRenderTimeoutInMilliseconds(120000);

// Optional: use a locally installed Chrome / headless shell instead of letting
// Remotion download one (e.g. in sandboxes without access to remotion.media).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
