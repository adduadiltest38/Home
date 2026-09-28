# Bedroom Renovation Walkthrough

A Remotion + React Three Fiber project that renders **one continuous 3D
walkthrough** of a renovated bedroom. The room is reconstructed from the four
reference photos in `public/ref/` and dressed as an architectural-visualisation
proposal: walnut wardrobe and loft shutters, a backlit vanity, infinity curtains,
zebra blinds, and a slatted, upholstered bed wall under the existing curved
cove ceiling.

- Composition `BedroomWalkthrough`: 1920×1080, 30 fps, 960 frames (32 s)
- Output: `out/bedroom_walkthrough.mp4`

```
npm i
npx remotion studio          # preview / scrub
npm run render               # → out/bedroom_walkthrough.mp4
```

> **Sandboxed machines.** Remotion downloads Chrome Headless Shell from
> `remotion.media` on the first render. If you can't reach that host, point it
> at a local Chrome or headless shell:
> `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render`
> (`remotion.config.ts` picks up the variable).

## Sequence

| Frames  | Part          | What happens |
|---------|---------------|--------------|
| 0–119   | `BeforeIntro` | The 4 original photos, ~1 s each, Ken Burns 1.00→1.08, "BEFORE" + zone label. The 3D scene cross-dissolves in over frames 105–119. |
| 120–899 | `Walkthrough3D` | One camera move, no cuts (keyframes below). |
| 900–959 | `EndCard`     | Holds the hero framing, "AFTER" label, fade to black. |

Camera keyframes (`src/camera/cameraPath.ts`, global frames):

| Frames   | Shot | Camera |
|----------|------|--------|
| 120–240  | Enter through doorway | Dolly in from the corridor, start turning right past the bed wall |
| 240–360  | Wardrobe + loft cabinets | The turn settles into a pan right along the doors, ending on the vanity |
| 360–450  | Dressing unit | Gentle push toward the mirror glow |
| 450–545  | Curtain wall | Arc round to face the infinity curtains |
| 545–650  | Double door + zebra blinds | Lateral track along the north wall |
| 650–810  | Bed wall reveal | Arc toward the backdrop, then a slow push |
| 810–899  | Hero wide | Pull back to the north-west corner, rise to 1.9 m, FOV 60°→70° |

## Project structure

```
remotion.config.ts            ANGLE GL, JPEG frames, optional browser override
src/
  Root.tsx                    registers the composition
  BedroomWalkthrough.tsx      <Series>: BeforeIntro → Walkthrough3D → EndCard
  config/room.ts              ALL dimensions (m): single source of truth
  config/palette.ts           colours, materials, light intensities, post FX
  camera/cameraPath.ts        keyframes + interpolation (pure, no React)
  camera/AnimatedCamera.tsx   frame-driven PerspectiveCamera
  scene/Scene.tsx             <ThreeCanvas> + everything below
  scene/Room.tsx              floor, walls with openings, loft slab, skirting, corridor
  scene/Ceiling.tsx           false ceiling, crescent + wave cove shapes, LED wash, downlight trims, fan
  scene/Openings.tsx          entry door, 3-panel window, teak double door + side windows
  scene/Wardrobe.tsx          4-door wardrobe + loft sliding shutters
  scene/DressingUnit.tsx      floating vanity, backlit mirror (planar reflection), stool, tray
  scene/Curtains.tsx          two-layer infinity curtains (procedural folds, frame-driven sway)
  scene/ZebraBlinds.tsx       day/night blinds on the two side windows
  scene/BedWall.tsx           backdrop (slats + channel headboard + LED), king bed, bedsides, lamps
  scene/Accessories.tsx       rug, snake plant, pothos
  scene/Lighting.tsx          downlights, cove fill, backdrop RectAreaLight, local IBL
  scene/Electrical.tsx        existing switchboards / sockets
  scene/PostFX.tsx            sanitize → bloom → ACES → vignette → SMAA
  intro/BeforeIntro.tsx       photo intro
  intro/EndCard.tsx           end card
  components/                 materials, primitives (BoxMM, WallSlab, BoxRow…), curves, WindowUnit, fonts
scripts/
  make-textures.mjs           builds public/textures from the photos + procedural maps
  check-camera.mjs            camera QA: angular velocity, speed, wall clearance per frame
  render-stills.mjs           renders QA stills with one bundle
  contact-sheet.mjs           tiles QA stills into one image
public/
  ref/IMG_1..4.png            reference photos (downsized to 1500 px wide)
  textures/                   floor_granite, teak_door, walnut_grain, fabric_normal
  fonts/                      Jost (SIL Open Font License)
```

## Editing the room (`src/config/room.ts`)

Every size in the scene comes from `room.ts`. The values there are estimates
from the photos; replace them with site measurements and re-render.

**Coordinate system:** metres, Y up, origin at the centre of the floor.

| Axis | − | + |
|------|---|---|
| X | west: window wall (IMG_2) | east: bed wall (IMG_4) |
| Z | north: double-door wall (IMG_3) | south: entrance wall (IMG_1) |

The main groups:

- `ROOM`: width (X), depth (Z), ceiling height, wall thickness. The wall faces
  (`WALL.*`) follow from these.
- `ENTRANCE`: passage width, door height, how far the door sits behind the
  south wall (the projecting section), and the corridor behind it.
- `LOFT`: slab underside height, thickness, depth. The wardrobe height and the
  loft shutters follow from it.
- `WINDOW` and `DOUBLE_DOOR`: opening sizes, sill heights and centre positions.
  The wall holes, frames, grills and blinds are all built from these.
- `CEILING` and `DOWNLIGHTS`: shape depth, perimeter band, fan, and the plan
  positions of the downlights. The cove shapes themselves are outlined in plan
  coordinates in `scene/Ceiling.tsx` (`CEILING_SHAPES`).
- `ELECTRICAL`: wall, position along the wall and height of every existing
  board or socket.
- Furniture: `WARDROBE`, `DRESSING`, `BACKDROP`, `BED`, `CURTAINS`, `RUG`.
  Derived values (for example the dressing width, which is whatever is left
  between the wardrobe and the window wall) are computed next to them.

After changing dimensions:

1. `npm run check:camera` flags any keyframe that now sits too close to a wall.
   Keyframes that use literal coordinates live in `src/camera/cameraPath.ts`.
2. `npm run stills -- 300 500 620 760 880` renders QA stills to `out/stills/`,
   and `node scripts/contact-sheet.mjs` tiles them into one image.
3. `npm run render`.

Colours, material settings and light intensities are in `src/config/palette.ts`.

## Textures

`npm run textures` regenerates everything in `public/textures/`:

- `floor_granite.jpg`: an evenly lit floor patch cropped from IMG_4. The script
  stretches it to undo perspective, divides out the lighting gradient and
  mirror-tiles it 2×2 so it tiles seamlessly.
- `teak_door.jpg`: the arched door panel cropped from IMG_3, flattened, colour
  corrected and mirror-tiled.
- `walnut_grain.jpg`: procedural, tileable, vertical grain (base #5A3A22).
- `fabric_normal.jpg`: a procedural, tileable plain-weave normal map.

## Rendering rules this project follows

- All animation comes from `useCurrentFrame()`: the camera, the fan rotation and
  the curtain sway. Nothing uses a clock or `useFrame` for animation. The one
  `useFrame` in the project runs the post-processing composer with a fixed delta.
- Every asset loads through `staticFile()`. There are no network fetches and no
  drei `Environment` presets: the reflections come from an `<Environment>` built
  out of local `Lightformer`s.
- Texture loading suspends inside `<ThreeCanvas>`, so Remotion's `delayRender`
  waits for it. Don't add your own `<Suspense>` boundary around the scene: frames
  would then be captured before the textures arrive.

## QA notes and deliberate deviations

- **Angular velocity.** `npm run check:camera` reports about 490° of yaw over the
  26 s walkthrough: an 18.8°/s average and a peak of about 40°/s. The shot order
  requires this. The wardrobe sits beside the entrance, behind the viewer as they
  walk in, and the camera then has to face every wall once, so no path can stay
  under the requested ~15°/s. The path is a single clockwise orbit with no
  reversals. Look direction is interpolated as yaw/pitch angles, not target
  points, so it can never snap.
- **Post-processing** uses the `postprocessing` library directly (`scene/PostFX.tsx`)
  instead of `@react-three/postprocessing`. That package builds its passes over
  several React commits, so the single render Remotion captures for a frame came
  out black. The custom composer is built synchronously and waits for SMAA's
  lookup textures with `delayRender`. A sanitize pass clamps Inf/NaN values
  before bloom: one overflowing specular highlight on the mirror used to black
  out a whole frame.
- **The entry door opens outward** into the corridor, as in IMG_1, so its swing
  never enters the room.
- **Switchboard.** In the photos the bed-wall switchboard sits just past the loft
  edge (z ≈ 1.2). A bedside + king bed + bedside fills the 2.8 m of wall up to the
  loft exactly, so the right bedside ends right beside the board instead of
  directly under it. The board stays fully visible.
- **The mirror** uses a planar `Reflector`, which is rendered only while the
  mirror is on screen.
- **White balance.** The light sources use a 3000K colour after a mild camera
  white balance (`light3000k`), while visible LED strips keep the raw 3000K
  `#FFB46B`. Without this the whole room renders orange.
- **Omitted on purpose:** the clothesline, the loose wall hooks and the temporary
  bar across the double door.
- **Reference photos** were downsized to 1500 px wide (the originals are 12–16 MB
  and the video is 1080p).
