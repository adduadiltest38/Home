/**
 * ROOM MODEL — single source of truth for every dimension (metres).
 *
 * Values are estimated from the four reference photos in public/ref/.
 * Replace them with site measurements and re-render; every component reads
 * from here, so furniture and the camera path follow automatically.
 *
 * Coordinate system (right-handed, Y up), origin = centre of the floor:
 *
 *                    NORTH  z = -D/2   (IMG_3 double-door wall)
 *               ┌───────────────────────────┐
 *               │                           │
 *   WEST        │                           │  EAST
 *   x = -W/2    │          (0,0,0)          │  x = +W/2
 *   (IMG_2      │                           │  (IMG_4 bed wall)
 *   window)     │                           │
 *               │ ▓▓▓▓▓▓▓ loft ▓▓▓▓▓▓▓▓┌───┐ │
 *               └──────────────────────┘door└─┘
 *                    SOUTH  z = +D/2   (IMG_1 entrance wall)
 */

export const ROOM = {
	/** X extent: entrance wall ↔ double-door wall length */
	width: 3.6,
	/** Z extent: window wall ↔ bed wall length */
	depth: 3.4,
	/** Finished floor to structural ceiling */
	height: 3.0,
	wallThickness: 0.23,
} as const;

export const HALF_W = ROOM.width / 2;
export const HALF_D = ROOM.depth / 2;

/** Wall face positions (interior faces) */
export const WALL = {
	west: -HALF_W,
	east: HALF_W,
	north: -HALF_D,
	south: HALF_D,
} as const;

/** Entrance (IMG_1): door passage at the east end of the south wall. */
export const ENTRANCE = {
	/** Clear width of the passage / door opening */
	width: 0.9,
	/** Door leaf height (passage ceiling is the loft underside) */
	doorHeight: 2.1,
	/** The door sits this far behind the main south wall face */
	recess: 0.3,
	/** Door leaf thickness */
	leafThickness: 0.04,
	/** Door swings out into the corridor and rests against its wall (degrees, 0 = closed) */
	leafOpenDeg: 176,
	/** Corridor behind the door (only seen during the dolly-in) */
	corridorLength: 2.6,
	/** corridor extends this far west / east of the passage */
	corridorWest: 0.5,
	corridorEast: 1.0,
} as const;
/** x-range of the entrance passage */
export const ENTRY_X0 = WALL.east - ENTRANCE.width;
export const ENTRY_X1 = WALL.east;
/** z of the door plane (passage end) */
export const ENTRY_DOOR_Z = WALL.south + ENTRANCE.recess;

/** Loft slab along the entrance wall (IMG_1, left of IMG_2, right of IMG_4). */
export const LOFT = {
	/** underside height */
	bottom: 2.1,
	thickness: 0.08,
	/** projection from the south wall face */
	depth: 0.6,
} as const;
export const LOFT_TOP = LOFT.bottom + LOFT.thickness;
export const LOFT_FRONT_Z = WALL.south - LOFT.depth;

/** Window wall (IMG_2): 3-panel window, dark brown frame, white grill. */
export const WINDOW = {
	width: 1.3,
	height: 1.2,
	sill: 0.9,
	/** centre along the west wall (z) */
	centerZ: 0,
	panels: 3,
	frameWidth: 0.07,
	frameDepth: 0.1,
} as const;

/** Double-door wall (IMG_3): window | double door | window in one recessed frame. */
export const DOUBLE_DOOR = {
	/** centre of the whole assembly along the north wall (x) */
	centerX: -0.15,
	doorWidth: 1.1,
	doorHeight: 2.1,
	sideWindowWidth: 0.5,
	sideWindowSill: 0.75,
	frameWidth: 0.07,
	frameDepth: 0.12,
	/** the wooden frame sits this far back inside a plastered niche */
	nicheDepth: 0.1,
	/** plaster margin of the niche around the wooden frame */
	nicheMargin: 0.06,
	leafThickness: 0.05,
} as const;
export const DD_TOTAL_W =
	DOUBLE_DOOR.doorWidth + 2 * DOUBLE_DOOR.sideWindowWidth + 4 * DOUBLE_DOOR.frameWidth;

/** Granite skirting, all walls */
export const SKIRTING = {height: 0.1, thickness: 0.015} as const;

/** False ceiling */
export const CEILING = {
	/** raised plaster shapes hang this far below the ceiling plane */
	shapeDepth: 0.1,
	/** flat perimeter band (houses the downlights) */
	bandWidth: 0.3,
	bandDrop: 0.05,
	/** width of the LED glow wash on the ceiling around each shape */
	coveGlowWidth: 0.28,
	fan: {
		dropFromCeiling: 0.38,
		bladeLength: 0.58,
		bladeWidth: 0.12,
		/** revolutions per second (frame-driven) */
		rps: 0.35,
		x: 0,
		z: -0.15,
	},
} as const;

/**
 * Recessed downlights: plan position (x, z) and whether it casts shadows
 * (key lights only, for performance). Positions as seen in the photos.
 */
export const DOWNLIGHTS: ReadonlyArray<readonly [number, number, boolean?]> = [
	// in front of the loft / wardrobe (IMG_1)
	[-0.45, LOFT_FRONT_Z - 0.28],
	[0.45, LOFT_FRONT_Z - 0.28],
	// bed wall scallops (IMG_4) — key lights
	[WALL.east - 0.32, -0.9, true],
	[WALL.east - 0.32, 0.4, true],
	// window wall (IMG_2)
	[WALL.west + 0.32, -1.05],
	[WALL.west + 0.32, 0.75],
	// double-door wall corners (IMG_3)
	[-1.2, WALL.north + 0.32],
	[1.15, WALL.north + 0.32],
];

/** Electrical points (existing, keep exact). y = centre height. */
export const ELECTRICAL = {
	/** IMG_4 / IMG_1: bed-wall switchboard just past the loft edge */
	bedWallBoard: {wall: 'east', along: 1.2, y: 1.15, w: 0.16, h: 0.1},
	bedWallSocket: {wall: 'east', along: 1.2, y: 0.28, w: 0.08, h: 0.08},
	/** IMG_4: AC point high on the bed wall */
	bedWallAc: {wall: 'east', along: -0.35, y: 2.55, w: 0.08, h: 0.08},
	/** IMG_2 / IMG_3: window-wall board with fan regulator */
	windowWallBoard: {wall: 'west', along: -1.05, y: 1.2, w: 0.14, h: 0.14},
	/** IMG_2: point above the window */
	windowWallAc: {wall: 'west', along: 0.02, y: 2.5, w: 0.08, h: 0.08},
	/** IMG_3: socket above the left side window */
	northWallAc: {wall: 'north', along: -1.02, y: 2.55, w: 0.08, h: 0.08},
} as const;

// ───────────────────────────────────────────────────────── furniture

/** 4-door wardrobe under the loft on the entrance wall */
export const WARDROBE = {
	doors: 4,
	width: 1.8,
	depth: LOFT.depth,
	/** x of the wardrobe's east edge (sits right next to the entry passage) */
	eastX: ENTRY_X0,
	reveal: 0.003,
	doorThickness: 0.022,
	pullLength: 1.3,
	pullWidth: 0.014,
} as const;
export const WARDROBE_X0 = WARDROBE.eastX - WARDROBE.width;
export const WARDROBE_X1 = WARDROBE.eastX;

/** Loft sliding doors: panels aligned to wardrobe door joints */
export const LOFT_CABINET = {
	panelWidth: WARDROBE.width / WARDROBE.doors,
	thickness: 0.02,
} as const;

/** Dressing unit at the west end of the wardrobe */
export const DRESSING = {
	/** whatever is left between the wardrobe and the window wall (≈0.9) */
	width: WARDROBE_X0 - WALL.west,
	depth: 0.45,
	counterTop: 0.75,
	counterThickness: 0.2,
	mirrorW: 0.6,
	mirrorH: 1.2,
	mirrorBottom: 0.85,
	haloMargin: 0.035,
	stoolRadius: 0.2,
	stoolHeight: 0.45,
} as const;
export const DRESSING_X1 = WARDROBE_X0;
export const DRESSING_X0 = DRESSING_X1 - DRESSING.width;
export const DRESSING_CX = (DRESSING_X0 + DRESSING_X1) / 2;

/**
 * Bed wall ensemble (IMG_4). The usable bed wall runs from the north corner to
 * the loft edge (2.8 m): bedside + king bed + bedside fills it exactly.
 */
export const BACKDROP = {
	height: 2.4,
	depth: 0.06,
	/** z-range along the east wall; ends at the loft edge so the switchboard stays clear */
	z0: WALL.north,
	z1: LOFT_FRONT_Z,
	slatWidth: 0.03,
	slatPitch: 0.04,
	slatDepth: 0.03,
	panelWidth: 2.0,
	headboardBottom: 0.32,
	headboardHeight: 1.25,
	channelWidth: 0.2,
} as const;

export const BED = {
	width: 1.8, // along z
	length: 2.0, // along x
	platformHeight: 0.28,
	mattressHeight: 0.24,
	/** centre of the bed along the east wall (z) */
	centerZ: (BACKDROP.z0 + BACKDROP.z1) / 2,
	/** ≈0.5 m; 2 × 0.48 + 1.8 + gaps = the 2.8 m usable wall */
	bedsideW: 0.48,
	bedsideD: 0.4,
	bedsideH: 0.2,
	bedsideTop: 0.5,
} as const;
/** x of the bed head (front face of the backdrop) */
export const BED_HEAD_X = WALL.east - BACKDROP.depth;

export const CURTAINS = {
	/** track runs corner to corner between the north wall and the loft front */
	z0: WALL.north + 0.02,
	z1: LOFT_FRONT_Z - 0.02,
	trackDrop: 0.07,
	sheerOffset: 0.2,
	blackoutOffset: 0.11,
	foldAmplitude: 0.04,
	foldPitch: 0.13,
	blackoutStack: 0.45,
	sheerOpacity: 0.55,
} as const;

export const RUG = {
	lengthX: 1.9,
	widthZ: 2.3,
	thickness: 0.012,
} as const;

/** Camera */
export const EYE_HEIGHT = 1.6;
