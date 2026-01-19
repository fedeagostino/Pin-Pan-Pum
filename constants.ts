
import { PuckType, SpecialShotStatus, SynergyType, Team } from './types';

export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 1200;
export const PUCK_RADIUS = 25; // For standard-sized special pucks
export const PAWN_PUCK_RADIUS = 15;
export const KING_PUCK_RADIUS = 35;
export const GOAL_WIDTH = 250;
export const GOAL_DEPTH = 30;
export const MIN_DRAG_DISTANCE = 10; // Minimum drag distance to register a shot
export const MAX_DRAG_FOR_POWER = 125; // Max drag distance for full power (Halved from 250)
export const CANCEL_SHOT_THRESHOLD = PUCK_RADIUS * 1.5;
export const SCORE_TO_WIN = 3;
export const PAWN_DURABILITY = 5;

// New Goal Point System
export const PUCK_GOAL_POINTS: Record<PuckType, number> = {
    KING: 3,
    HEAVY: 2,
    ANCHOR: 2,
    DAMPENER: 2,
    STANDARD: 1,
    FAST: 1,
    GHOST: 1,
    SWERVE: 1,
    BOUNCER: 1,
    PAWN: 1,
};


// Preview Simulation Constants
export const PREVIEW_SHOT_POWER = 4;
export const PREVIEW_SIMULATION_FRAMES = 200;

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
export const SYNERGY_CROSSING_BONUS = 10;
export const PULSAR_ORB_HIT_SCORE = 150;
export const PULSAR_BAR_HEIGHT = 80;
export const SYNERGY_GOAL_PULSAR_BONUS = 250;
export const TURNS_PER_ORB_SPAWN = 2; // total turns (1 per player)
export const ORBS_FOR_OVERCHARGE = 3;
export const OVERCHARGE_REPULSOR_RADIUS = 75;
export const OVERCHARGE_REPULSOR_FORCE = 0.1;

// New ability constants
export const GHOST_PHASE_DURATION = 180; // 3 seconds at 60fps
export const EMP_BURST_RADIUS = 120;
export const EMP_BURST_FORCE = 0.8;
export const SPECIAL_PUCKS_FOR_ROYAL_SHOT: PuckType[] = ['HEAVY', 'FAST', 'GHOST', 'ANCHOR', 'SWERVE', 'BOUNCER', 'DAMPENER'];
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
    GHOST_TRAIL: { life: 7, decay: 0.2, radius: 2.5, speed: 0.1 },
    PULSAR_CHARGE: { life: 30, decay: 0.03, radius: 2, speed: 5 },
    PULSAR_ORB_HIT: { count: 25, life: 20, decay: 0.06, minRadius: 1, maxRadius: 3, minSpeed: 2, maxSpeed: 6 },
    OVERCHARGE_AURA: { life: 10, decay: 0.2, speed: 4 },
    MAX_POWER_REACHED: { count: 15, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 3 },
    MAX_POWER_IDLE: { life: 13, decay: 0.16, radius: 2, speed: 0.2 },
    SHOT_BURST: { count: 12, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 2 },
    KING_TRAIL: { life: 15, decay: 0.08, radius: 4, speed: 0.1 },
    HEAVY_TRAIL: { life: 13, decay: 0.1, radius: 3.5, speed: 0.05 },
    FAST_TRAIL: { life: 8, decay: 0.24, radius: 1.5, speed: 0.5 },
    SWERVE_TRAIL: { life: 13, decay: 0.1, radius: 2, speed: 0.8 },
    BOUNCER_TRAIL: { life: 13, decay: 0.1 },
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
    CHARGED_SPARKS: { life: 20, decay: 0.05, radius: 1.5, speed: 1.2 },
};

// Colors for combo shockwaves
export const SHOCKWAVE_COLORS: Record<number, string> = {
    1: '#34d399', // green-400
    2: '#a3e635', // lime-400
    3: '#facc15', // yellow-400
    4: '#f97316', // orange-500
};


// Synergy System
export const SYNERGY_HOLD_DURATION = 1200; // 1.2 seconds
export const SYNERGY_GHOST_PHASE_DURATION = 120; // 2 seconds at 60fps
export const GRAVITY_WELL_RADIUS = 200;
export const GRAVITY_WELL_FORCE = 1.0;
export const TELEPORT_STRIKE_DISTANCE = 80;
export const REPULSOR_ARMOR_RADIUS = 150;
export const REPULSOR_ARMOR_FORCE = 0.6;
export const REPULSOR_ARMOR_DURATION = 300; // 5 seconds at 60fps

export const SYNERGY_COMBOS: Record<string, SynergyType> = {
    'HEAVY-ANCHOR': 'POWER',
    'FAST-SWERVE': 'SPEED',
    'BOUNCER-DAMPENER': 'CONTROL',
    'HEAVY-DAMPENER': 'GRAVITY_WELL',
    'FAST-GHOST': 'TELEPORT_STRIKE',
    'ANCHOR-BOUNCER': 'REPULSOR_ARMOR',
};

export type PuckTypeProperties = {
    mass: number;
    friction: number;
    linesToCrossForBonus: number;
    elasticity?: number;
    swerveFactor?: number;
    powerFactor?: number; // How much to multiply shot power by
};

export const SYNERGY_EFFECTS: Record<SynergyType, { color: string; ability?: 'EMP_ON_COLLISION' | 'GHOST_ON_LAUNCH' | 'GRAVITY_ON_COLLISION' | 'TELEPORT_ON_COLLISION' | 'REPULSOR_AURA'; statModifiers?: Partial<PuckTypeProperties> }> = {
    POWER: {
        color: '#f97316', // orange-500
        ability: 'EMP_ON_COLLISION',
    },
    SPEED: {
        color: '#ec4899', // pink-500
        ability: 'GHOST_ON_LAUNCH',
    },
    CONTROL: {
        color: '#a855f7', // purple-500
        statModifiers: { elasticity: 1.0 },
    },
    GRAVITY_WELL: {
        color: '#6366f1', // indigo-500
        ability: 'GRAVITY_ON_COLLISION',
    },
    TELEPORT_STRIKE: {
        color: '#22d3ee', // cyan-400
        ability: 'TELEPORT_ON_COLLISION',
    },
    REPULSOR_ARMOR: {
        color: '#fbbf24', // amber-400
        ability: 'REPULSOR_AURA',
    }
};

export const SYNERGY_DESCRIPTIONS: Record<SynergyType, { name: string, description: string }> = {
    POWER: {
        name: 'Sinergia de Potencia',
        description: 'Al activarse, la ficha disparada emite una onda de choque EMP en cada colisión, empujando a los oponentes.',
    },
    SPEED: {
        name: 'Sinergia de Velocidad',
        description: 'La ficha se vuelve intangible durante los primeros segundos del disparo, permitiendo atravesar defensas.',
    },
    CONTROL: {
        name: 'Sinergia de Control',
        description: 'Otorga rebotes perfectos contra las paredes, sin perder energía en el impacto.',
    },
    GRAVITY_WELL: {
        name: 'Sinergia de Gravedad (Pozo de Gravedad)',
        description: 'Al colisionar, crea un pozo de gravedad que atrae a las fichas enemigas cercanas.',
    },
    TELEPORT_STRIKE: {
        name: 'Sinergia de Teletransporte (Golpe Espectral)',
        description: 'Tras la primera colisión, se teletransporta instantáneamente detrás del objetivo.',
    },
    REPULSOR_ARMOR: {
        name: 'Sinergia de Repulsión (Armadura Repulsora)',
        description: 'Emite un campo de fuerza continuo que repele a las fichas enemigas cercanas.',
    }
};

// REBALANCED Puck Properties: King is more powerful, heavy pucks are more mobile, fast pucks are slightly slower.
export const PUCK_TYPE_PROPERTIES: Record<PuckType, PuckTypeProperties> = {
  STANDARD: { mass: 1, friction: 0.985, linesToCrossForBonus: 2 },
  HEAVY: { mass: 1.7, friction: 0.9877, linesToCrossForBonus: 3 },
  FAST: { mass: 0.75, friction: 0.987, linesToCrossForBonus: 2 },
  GHOST: { mass: 0.6, friction: 0.989, linesToCrossForBonus: 2 },
  ANCHOR: { mass: 2.5, friction: 0.9831, linesToCrossForBonus: 3 },
  KING: { mass: 4.5, friction: 0.980, linesToCrossForBonus: 1, powerFactor: 2 },
  SWERVE: { mass: 0.8, friction: 0.986, swerveFactor: 0.03, linesToCrossForBonus: 2 },
  BOUNCER: { mass: 1, friction: 0.985, elasticity: 1.05, linesToCrossForBonus: 2 },
  DAMPENER: { mass: 1.9, friction: 0.9862, elasticity: 0.4, linesToCrossForBonus: 3 },
  PAWN: { mass: 0.5, friction: 0.980, elasticity: 0.9, linesToCrossForBonus: 2 },
};

export const PUCK_TYPE_INFO: Record<PuckType, { name: string, description: string }> = {
    STANDARD: { name: 'Estándar', description: `Debe cruzar ${PUCK_TYPE_PROPERTIES.STANDARD.linesToCrossForBonus} líneas para cargarse y poder marcar gol (+${PUCK_GOAL_POINTS.STANDARD} punto).` },
    HEAVY: { name: 'Pesado', description: `Lento pero potente. Al cruzar una línea, emite un pulso EMP. Debe cruzar ${PUCK_TYPE_PROPERTIES.HEAVY.linesToCrossForBonus} líneas para marcar (+${PUCK_GOAL_POINTS.HEAVY} puntos).` },
    FAST: { name: 'Rápido', description: `Ligero y veloz. Debe cruzar ${PUCK_TYPE_PROPERTIES.FAST.linesToCrossForBonus} líneas para cargarse y poder marcar gol (+${PUCK_GOAL_POINTS.FAST} punto).` },
    GHOST: { name: 'Fantasma', description: `Puede volverse intangible. Debe cruzar ${PUCK_TYPE_PROPERTIES.GHOST.linesToCrossForBonus} líneas para cargarse y poder marcar gol (+${PUCK_GOAL_POINTS.GHOST} punto).` },
    ANCHOR: { name: 'Ancla', description: `Extremadamente pesado, emite un pulso EMP al cruzar una línea. Debe cruzar ${PUCK_TYPE_PROPERTIES.ANCHOR.linesToCrossForBonus} líneas para marcar (+${PUCK_GOAL_POINTS.ANCHOR} puntos).` },
    KING: { name: 'Rey', description: `La ficha más importante. Requiere cruzar solo ${PUCK_TYPE_PROPERTIES.KING.linesToCrossForBonus} línea para cargarse (+${PUCK_GOAL_POINTS.KING} puntos). Al cargar todas las fichas especiales de su equipo, desbloquea un "Tiro Real". Si también se cargan todos los peones, el tiro se convierte en un devastador "Tiro Definitivo".` },
    SWERVE: { name: 'Curvo', description: `Aplica un efecto curvo a su trayectoria. Debe cruzar ${PUCK_TYPE_PROPERTIES.SWERVE.linesToCrossForBonus} líneas para cargarse y poder marcar gol (+${PUCK_GOAL_POINTS.SWERVE} punto).` },
    BOUNCER: { name: 'Rebotador', description: `Muy elástico. Debe cruzar ${PUCK_TYPE_PROPERTIES.BOUNCER.linesToCrossForBonus} líneas para cargarse y poder marcar gol (+${PUCK_GOAL_POINTS.BOUNCER} punto).` },
    DAMPENER: { name: 'Amortiguador', description: `Pesado y poco elástico, absorbe la energía de las colisiones. Debe cruzar ${PUCK_TYPE_PROPERTIES.DAMPENER.linesToCrossForBonus} líneas para marcar (+${PUCK_GOAL_POINTS.DAMPENER} puntos).` },
    PAWN: { name: 'Peón', description: `Ficha básica con durabilidad limitada. Para cargarse, debe cruzar 2 líneas específicas en un solo tiro: una entre dos peones y otra entre un peón y una ficha especial (+${PUCK_GOAL_POINTS.PAWN} punto).` },
};

export const PUCK_SVG_DATA: Record<PuckType, { path: string, designRadius: number, pathLength?: number }> = {
    STANDARD: { path: '', designRadius: 20 },
    HEAVY: { path: 'M 20 0 L 10 17.32 L -10 17.32 L -20 0 L -10 -17.32 L 10 -17.32 Z', designRadius: 20 },
    FAST: { path: 'M 0 -20 L 17.32 10 L -17.32 10 Z', designRadius: 20 },
    GHOST: { path: 'M 0 -20 C 14.4 -24.8, 24.8 0, 10 18 S -20 24.8, -15 -10 S 10 10, 0 -20 Z', designRadius: 20 },
    ANCHOR: { path: 'M 0 -20 L 20 0 L 0 20 L -20 0 Z', designRadius: 20 },
    KING: { path: 'M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z', designRadius: 20 },
    SWERVE: { path: 'M 0 -18 A 9 9 0 0 1 0 0 A 9 9 0 0 0 0 18 A 18 18 0 0 1 0 -18 Z', designRadius: 18 },
    BOUNCER: { path: '', designRadius: 20 },
    DAMPENER: { path: 'M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z', designRadius: 20 },
    PAWN: { path: 'M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z', designRadius: 15, pathLength: 90 },
};


const PAWN_X_POSITIONS = [
  BOARD_WIDTH * 0.15,
  BOARD_WIDTH * 0.3,
  BOARD_WIDTH * 0.5,
  BOARD_WIDTH * 0.7,
  BOARD_WIDTH * 0.85,
];

// Initial Puck Positions for 2 players
// BLUE team starts at the TOP, RED team starts at the BOTTOM.
export const INITIAL_PUCK_CONFIG: { team: Team, pucks: { type: PuckType, position: { x: number, y: number } }[] }[] = [
  {
    team: 'RED', // Starts at the bottom
    pucks: [
      // Pawns (1 row)
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.65 } })),
      // Special Pucks
      { type: 'KING', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.80 } },
      { type: 'FAST', position: { x: BOARD_WIDTH * 0.20, y: BOARD_HEIGHT * 0.75 } },
      { type: 'GHOST', position: { x: BOARD_WIDTH * 0.80, y: BOARD_HEIGHT * 0.75 } },
      { type: 'HEAVY', position: { x: BOARD_WIDTH * 0.35, y: BOARD_HEIGHT * 0.85 } },
      { type: 'ANCHOR', position: { x: BOARD_WIDTH * 0.65, y: BOARD_HEIGHT * 0.85 } },
      { type: 'BOUNCER', position: { x: BOARD_WIDTH * 0.15, y: BOARD_HEIGHT * 0.90 } },
      { type: 'DAMPENER', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.92 } },
      { type: 'SWERVE', position: { x: BOARD_WIDTH * 0.85, y: BOARD_HEIGHT * 0.90 } },
    ]
  },
  {
    team: 'BLUE', // Starts at the top
    pucks: [
      // Pawns (1 row)
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.35 } })),
      // Special Pucks
      { type: 'KING', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.20 } },
      { type: 'FAST', position: { x: BOARD_WIDTH * 0.20, y: BOARD_HEIGHT * 0.25 } },
      { type: 'GHOST', position: { x: BOARD_WIDTH * 0.80, y: BOARD_HEIGHT * 0.25 } },
      { type: 'HEAVY', position: { x: BOARD_WIDTH * 0.35, y: BOARD_HEIGHT * 0.15 } },
      { type: 'ANCHOR', position: { x: BOARD_WIDTH * 0.65, y: BOARD_HEIGHT * 0.15 } },
      { type: 'BOUNCER', position: { x: BOARD_WIDTH * 0.15, y: BOARD_HEIGHT * 0.10 } },
      { type: 'DAMPENER', position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT * 0.08 } },
      { type: 'SWERVE', position: { x: BOARD_WIDTH * 0.85, y: BOARD_HEIGHT * 0.10 } },
    ]
  }
];
