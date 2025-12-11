import { PuckType, SpecialShotStatus, Team } from './types';

export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 1200;
export const GUARDIAN_PUCK_RADIUS = 25;
export const PAWN_PUCK_RADIUS = 15;
export const KING_PUCK_RADIUS = 35;
export const GOAL_WIDTH = 250;
export const GOAL_DEPTH = 30;
export const MIN_DRAG_DISTANCE = 10; // Minimum drag distance to register a shot
export const MAX_DRAG_FOR_POWER = 125; // Max drag distance for full power (Halved from 250)
export const CANCEL_SHOT_THRESHOLD = GUARDIAN_PUCK_RADIUS * 1.5;
export const SCORE_TO_WIN = 3;
export const PAWN_DURABILITY = 5;
export const GUARDIAN_DURABILITY = 8;

// New Goal Point System
export const PUCK_GOAL_POINTS: Record<PuckType, number> = {
    KING: 3,
    GUARDIAN: 2,
    PAWN: 1,
};


// Preview Simulation Constants
export const PREVIEW_SHOT_POWER = 4;
export const PREVIEW_SIMULATION_FRAMES = 120;

export const TEAM_COLORS: Record<Team, string> = {
  BLUE: '#00f6ff', // Neon Blue
  RED: '#ff073a',   // Neon Red
};

export const UI_COLORS = {
  BACKGROUND_DARK: '#010409',
  BACKGROUND_MEDIUM: '#0d1117',
  BACKGROUND_LIGHT: '#161b22',
  BORDER: '#30363d',
  TEXT_LIGHT: '#e6edf3',
  TEXT_MEDIUM: '#8b949e',
  ACCENT_GREEN: '#39d353',
  ACCENT_YELLOW: '#f1e05a',
  ACCENT_PURPLE: '#8957e5',
  GOLD: '#ffd700',
  RAINBOW_GRADIENT: 'url(#rainbow-gradient)',
};

// Physics constants
export const MIN_VELOCITY_TO_STOP = 0.1;
export const MAX_VELOCITY_FOR_TURN_END = 0.4; // If fastest puck is slower than this, end turn.
export const LAUNCH_POWER_MULTIPLIER = 0.09; // Adjusted to account for mass

// Pulsar Power constants
export const PULSAR_POWER_PER_LINE = 25;
export const MAX_PULSAR_POWER = 1000;
export const PERFECT_CROSSING_THRESHOLD = 0.15; // 15% from line center
export const PERFECT_CROSSING_BONUS = 15;
export const SYNERGY_CROSSING_BONUS = 0; // Synergies removed
export const PULSAR_ORB_HIT_SCORE = 150;
export const PULSAR_BAR_HEIGHT = 80;
export const SYNERGY_GOAL_PULSAR_BONUS = 0; // Synergies removed
export const TURNS_PER_ORB_SPAWN = 2; // total turns (1 per player)
export const ORBS_FOR_OVERCHARGE = 3;
export const OVERCHARGE_REPULSOR_RADIUS = 75;
export const OVERCHARGE_REPULSOR_FORCE = 0.1;

// New ability constants
export const GHOST_PHASE_DURATION = 180; // 3 seconds at 60fps
export const EMP_BURST_RADIUS = 120;
export const EMP_BURST_FORCE = 0.8;
export const SPECIAL_PUCKS_FOR_ROYAL_SHOT: PuckType[] = ['GUARDIAN'];
export const ROYAL_SHOT_POWER_MULTIPLIER = 2.0;
// BUG FIX #1: The Royal Shot was unable to destroy any pucks because this limit was 0.
// Setting it to 1 allows it to destroy one puck per collision, making the ability functional.
export const ROYAL_SHOT_DESTROY_LIMIT = 1;
export const ULTIMATE_SHOT_POWER_MULTIPLIER = 3.0;
export const ULTIMATE_SHOT_DESTROY_LIMIT = 2;


// Combo System
export const COMBO_BONUSES: Record<number, number> = {
    2: 1.25, // x2 combo gets 25% bonus power
    3: 1.5,  // x3 combo gets 50% bonus power
    4: 2.0,  // x4+ combo gets 100% bonus power
};

// New floating text config
export const FLOATING_TEXT_CONFIG = {
    LIFE: 90, // 1.5 seconds at 60fps
    DECAY: 0.015,
    RISE_SPEED: -0.8,
};

// Particle effects configuration (OPTIMIZED COUNTS)
export const PARTICLE_CONFIG = {
    SLIDING: { life: 5, decay: 0.3, radius: 2, speed: 0.2 },
    COLLISION: { life: 10, decay: 0.08, minRadius: 1, maxRadius: 4 },
    WALL_IMPACT: { life: 9, decay: 0.1, radius: 2.5 },
    SYNERGY_TRAIL: { life: 8, decay: 0.25, radius: 3.5, speed: 0.4 },
    GOAL_STANDARD: { count: 25, life: 20, decay: 0.03, minRadius: 1, maxRadius: 4, minSpeed: 1, maxSpeed: 5 },
    GOAL_HEAVY: { count: 40, life: 25, decay: 0.024, minRadius: 2, maxRadius: 6, minSpeed: 2, maxSpeed: 7 },
    GOAL_KING: { count: 60, life: 35, decay: 0.018, minRadius: 2, maxRadius: 8, minSpeed: 3, maxSpeed: 10 },
    GOAL_SHOCKWAVE: { life: 20, decay: 0.05 },
    GOAL_SHARD: { count: 12, life: 30, decay: 0.03, minSpeed: 15, maxSpeed: 30 },
    LINE_SHOCKWAVE: { life: 13, decay: 0.08, speed: 8 },
    PULSAR_LAUNCH: { count: 20, life: 25, decay: 0.06, minRadius: 1, maxRadius: 4, speed: 4 },
    EMP_BURST: { life: 15, decay: 0.08, speed: 12 },
    PAWN_SHATTER: { count: 15, life: 12, decay: 0.1, minRadius: 1, maxRadius: 3, minSpeed: 1, maxSpeed: 4 },
    PULSAR_CHARGE: { life: 30, decay: 0.03, radius: 2, speed: 5 },
    PULSAR_ORB_HIT: { count: 25, life: 20, decay: 0.06, minRadius: 1, maxRadius: 3, minSpeed: 2, maxSpeed: 6 },
    OVERCHARGE_AURA: { life: 10, decay: 0.2, speed: 4 },
    MAX_POWER_REACHED: { count: 15, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 3 },
    MAX_POWER_IDLE: { life: 13, decay: 0.16, radius: 2, speed: 0.2 },
    SHOT_BURST: { count: 12, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 2 },
    KING_TRAIL: { life: 15, decay: 0.08, radius: 4, speed: 0.1 },
    ROYAL_POWER_READY: { life: 25, decay: 0.04, radius: 2, speed: 0.5 },
    ULTIMATE_POWER_READY: { life: 30, decay: 0.036, radius: 2.5, speed: 0.6 },
    ROYAL_SHOT_LAUNCH: { count: 50, life: 40, decay: 0.03, minRadius: 2, maxRadius: 6, speed: 8 },
    ROYAL_RAGE_TRAIL: { life: 40, decay: 0.03, radius: 5, speed: 0.2 },
    ULTIMATE_SHOT_LAUNCH: { count: 70, life: 45, decay: 0.024, minRadius: 2, maxRadius: 7, speed: 10 },
    ULTIMATE_RAGE_TRAIL: { life: 45, decay: 0.024, radius: 7, speed: 0.3 },
    TURN_CHANGE_BURST: { count: 30, life: 35, decay: 0.036, minRadius: 2, maxRadius: 5, minSpeed: 4, maxSpeed: 10 },
    TURN_DRIFT: { life: 60, decay: 0.012, radius: 2, speed: 0.35 },
    POWER_BEAM: { life: 20, decay: 0.05, speed: 12 },
    ROYAL_AURA: { life: 15, decay: 0.08, speed: 1 },
    ULTIMATE_AURA: { life: 15, decay: 0.07, speed: 1.5 },
    SYNERGY_CHARGE: { life: 10, radius: 2.5 },
    SYNERGY_AURA: { life: 10, decay: 0.2, speed: 0.3 },
    SYNERGY_CONFIRM: { life: 13, decay: 0.08 },
    PULSAR_AURA: { life: 8, decay: 0.2, speed: 1.5, radius: 1.5 },
    GRAVITY_WELL: { life: 30, decay: 0.04, radius: 2.5, count: 6 },
    TELEPORT_IN: { count: 25, life: 15, decay: 0.08, minSpeed: 4, maxSpeed: 8 },
    TELEPORT_OUT: { count: 25, life: 15, decay: 0.08, minSpeed: 4, maxSpeed: 8 },
    REPULSOR_AURA: { life: 10, decay: 0.1, speed: 6 },
    AIM_FLOW: { life: 13, decay: 0.12, radius: 2.5, speed: 8 },
};

// Colors for combo shockwaves
export const SHOCKWAVE_COLORS: Record<number, string> = {
    1: '#34d399', // green-400
    2: '#a3e635', // lime-400
    3: '#facc15', // yellow-400
    4: '#f97316', // orange-500
};

export type PuckTypeProperties = {
    mass: number;
    friction: number;
    linesToCrossForBonus: number;
    elasticity?: number;
    powerFactor?: number; // How much to multiply shot power by
};

// REBALANCED Puck Properties
export const PUCK_TYPE_PROPERTIES: Record<PuckType, PuckTypeProperties> = {
  GUARDIAN: { mass: 1.8, friction: 0.987, linesToCrossForBonus: 2 },
  KING: { mass: 4.5, friction: 0.980, linesToCrossForBonus: 1, powerFactor: 2 },
  PAWN: { mass: 0.5, friction: 0.980, elasticity: 0.9, linesToCrossForBonus: 2 },
};

export const PUCK_TYPE_INFO: Record<PuckType, { name: string, description: string }> = {
    GUARDIAN: { name: 'Guardián', description: `Ficha defensiva con durabilidad mejorada. Al cruzar una línea, emite un pulso EMP. Debe cruzar ${PUCK_TYPE_PROPERTIES.GUARDIAN.linesToCrossForBonus} líneas para marcar (+${PUCK_GOAL_POINTS.GUARDIAN} puntos).` },
    KING: { name: 'Rey', description: `La ficha más importante. Requiere cruzar solo ${PUCK_TYPE_PROPERTIES.KING.linesToCrossForBonus} línea para cargarse (+${PUCK_GOAL_POINTS.KING} puntos). Al cargar todas las fichas Guardianas, desbloquea un "Tiro Real". Si también se cargan todos los peones, el tiro se convierte en un devastador "Tiro Definitivo".` },
    PAWN: { name: 'Peón', description: `Ficha básica con durabilidad limitada. Para cargarse, debe cruzar 2 líneas específicas en un solo tiro: una entre dos peones y otra entre un peón y una Guardiana o Rey (+${PUCK_GOAL_POINTS.PAWN} punto).` },
};

export const PUCK_SVG_DATA: Record<PuckType, { path: string, designRadius: number, pathLength?: number }> = {
    GUARDIAN: { path: 'M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z', designRadius: 20, pathLength: 95.1 },
    KING: { path: 'M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z', designRadius: 20 },
    PAWN: { path: 'M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z', designRadius: 15, pathLength: 90 },
};


const PAWN_X_POSITIONS = [
  BOARD_WIDTH * 0.15,
  BOARD_WIDTH * 0.3,
  BOARD_WIDTH * 0.5,
  BOARD_WIDTH * 0.7,
  BOARD_WIDTH * 0.85,
];

// Initial Puck Positions for 2 players - REVISED FORMATION
export const INITIAL_PUCK_CONFIG: { team: Team, pucks: { type: PuckType, position: { x: number, y: number } }[] }[] = [
  {
    team: 'RED', // Starts at the bottom
    pucks: [
      // Pawns (1 row)
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.65 } })),
      // Guardians
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.25, y: BOARD_HEIGHT * 0.85 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.75, y: BOARD_HEIGHT * 0.85 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.40, y: BOARD_HEIGHT * 0.75 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.60, y: BOARD_HEIGHT * 0.75 } },
      // King
      { type: 'KING', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.90 } },
    ]
  },
  {
    team: 'BLUE', // Starts at the top
    pucks: [
      // Pawns (1 row)
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.35 } })),
       // Guardians
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.25, y: BOARD_HEIGHT * 0.15 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.75, y: BOARD_HEIGHT * 0.15 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.40, y: BOARD_HEIGHT * 0.25 } },
      { type: 'GUARDIAN', position: { x: BOARD_WIDTH * 0.60, y: BOARD_HEIGHT * 0.25 } },
      // King
      { type: 'KING', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.10 } },
    ]
  }
];