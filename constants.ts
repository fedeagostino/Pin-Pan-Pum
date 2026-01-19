
import { PuckType, SpecialShotStatus, SynergyType, Team } from './types';

export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 1200;
export const PUCK_RADIUS = 25; 
export const PAWN_PUCK_RADIUS = 15;
export const KING_PUCK_RADIUS = 35;
export const GOAL_WIDTH = 250;
export const GOAL_DEPTH = 30;
export const MIN_DRAG_DISTANCE = 10;
export const MAX_DRAG_FOR_POWER = 125;
export const CANCEL_SHOT_THRESHOLD = PUCK_RADIUS * 1.5;
export const SCORE_TO_WIN = 3;
export const PAWN_DURABILITY = 5;

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

export const PREVIEW_SHOT_POWER = 4;
export const PREVIEW_SIMULATION_FRAMES = 200;

export const TEAM_COLORS: Record<Team, string> = {
  BLUE: '#00d4ff', // Teal gélido
  RED: '#ff0000',   // Rojo Stranger
};

export const UI_COLORS = {
  BACKGROUND_DARK: '#000000',
  BACKGROUND_MEDIUM: '#0a0a0a',
  BACKGROUND_LIGHT: '#121212',
  BORDER: '#2a2a2a',
  TEXT_LIGHT: '#ffffff',
  TEXT_MEDIUM: '#a0a0a0',
  ACCENT_GREEN: '#2ecc71',
  ACCENT_YELLOW: '#f1c40f',
  ACCENT_PURPLE: '#9b59b6',
  GOLD: '#ffcc00',
  RAINBOW_GRADIENT: 'linear-gradient(90deg, #ff0000, #990000, #ff0000)',
};

// Physics constants
export const MIN_VELOCITY_TO_STOP = 0.1;
export const MAX_VELOCITY_FOR_TURN_END = 0.4;
export const LAUNCH_POWER_MULTIPLIER = 0.09;

// Pulsar Power constants
export const PULSAR_POWER_PER_LINE = 25;
export const MAX_PULSAR_POWER = 1000;
export const PERFECT_CROSSING_THRESHOLD = 0.15;
export const PERFECT_CROSSING_BONUS = 15;
export const SYNERGY_CROSSING_BONUS = 10;
export const PULSAR_ORB_HIT_SCORE = 150;
export const PULSAR_BAR_HEIGHT = 80;
export const SYNERGY_GOAL_PULSAR_BONUS = 250;
export const TURNS_PER_ORB_SPAWN = 2;
export const ORBS_FOR_OVERCHARGE = 3;
export const OVERCHARGE_REPULSOR_RADIUS = 75;
export const OVERCHARGE_REPULSOR_FORCE = 0.1;

export const GHOST_PHASE_DURATION = 180;
export const EMP_BURST_RADIUS = 120;
export const EMP_BURST_FORCE = 0.8;
export const SPECIAL_PUCKS_FOR_ROYAL_SHOT: PuckType[] = ['HEAVY', 'FAST', 'GHOST', 'ANCHOR', 'SWERVE', 'BOUNCER', 'DAMPENER'];
export const ROYAL_SHOT_POWER_MULTIPLIER = 2.0;
export const ROYAL_SHOT_DESTROY_LIMIT = 1;
export const ULTIMATE_SHOT_POWER_MULTIPLIER = 3.5;
export const ULTIMATE_SHOT_DESTROY_LIMIT = 2;

export const COMBO_BONUSES: Record<number, number> = {
    2: 1.25,
    3: 1.5,
    4: 2.0,
};

export const FLOATING_TEXT_CONFIG = {
    LIFE: 90,
    DECAY: 0.015,
    RISE_SPEED: -0.6,
};

export const PARTICLE_CONFIG = {
    SLIDING: { life: 8, decay: 0.1, radius: 1.5, speed: 0.1 },
    COLLISION: { life: 15, decay: 0.05, minRadius: 1, maxRadius: 3 },
    WALL_IMPACT: { life: 12, decay: 0.08, radius: 2 },
    SYNERGY_TRAIL: { life: 12, decay: 0.1, radius: 2.5, speed: 0.2 },
    GOAL_STANDARD: { count: 30, life: 40, decay: 0.02, minRadius: 1, maxRadius: 4, minSpeed: 1, maxSpeed: 4 },
    GOAL_HEAVY: { count: 50, life: 50, decay: 0.015, minRadius: 2, maxRadius: 6, minSpeed: 2, maxSpeed: 6 },
    GOAL_KING: { count: 80, life: 70, decay: 0.01, minRadius: 2, maxRadius: 10, minSpeed: 3, maxSpeed: 10 },
    GOAL_SHOCKWAVE: { life: 30, decay: 0.04 },
    GOAL_SHARD: { count: 20, life: 50, decay: 0.02, minSpeed: 5, maxSpeed: 15 },
    LINE_SHOCKWAVE: { life: 20, decay: 0.05, speed: 6 },
    PULSAR_LAUNCH: { count: 30, life: 40, decay: 0.04, minRadius: 1, maxRadius: 4, speed: 5 },
    EMP_BURST: { life: 20, decay: 0.06, speed: 10 },
    PAWN_SHATTER: { count: 25, life: 30, decay: 0.05, minRadius: 1, maxRadius: 4, minSpeed: 2, maxSpeed: 5 },
    GHOST_TRAIL: { life: 15, decay: 0.1, radius: 3, speed: 0.05 },
    PULSAR_CHARGE: { life: 40, decay: 0.02, radius: 3, speed: 4 },
    PULSAR_ORB_HIT: { count: 35, life: 30, decay: 0.05, minRadius: 1, maxRadius: 5, minSpeed: 3, maxSpeed: 8 },
    OVERCHARGE_AURA: { life: 20, decay: 0.1, speed: 2 },
    MAX_POWER_REACHED: { count: 20, life: 20, decay: 0.05, minRadius: 1, maxRadius: 4, speed: 4 },
    MAX_POWER_IDLE: { life: 20, decay: 0.1, radius: 3, speed: 0.3 },
    SHOT_BURST: { count: 15, life: 20, decay: 0.06, minRadius: 1, maxRadius: 4, speed: 3 },
    KING_TRAIL: { life: 25, decay: 0.05, radius: 5, speed: 0.2 },
    HEAVY_TRAIL: { life: 20, decay: 0.06, radius: 4, speed: 0.1 },
    FAST_TRAIL: { life: 12, decay: 0.15, radius: 2, speed: 0.6 },
    SWERVE_TRAIL: { life: 20, decay: 0.08, radius: 3, speed: 1.0 },
    BOUNCER_TRAIL: { life: 20, decay: 0.08 },
    ROYAL_POWER_READY: { life: 40, decay: 0.02, radius: 3, speed: 0.4 },
    ULTIMATE_POWER_READY: { life: 50, decay: 0.015, radius: 4, speed: 0.5 },
    ROYAL_SHOT_LAUNCH: { count: 60, life: 60, decay: 0.02, minRadius: 2, maxRadius: 8, speed: 10 },
    ROYAL_RAGE_TRAIL: { life: 60, decay: 0.02, radius: 6, speed: 0.3 },
    ULTIMATE_SHOT_LAUNCH: { count: 90, life: 80, decay: 0.015, minRadius: 3, maxRadius: 12, speed: 12 },
    ULTIMATE_RAGE_TRAIL: { life: 70, decay: 0.015, radius: 10, speed: 0.4 },
    TURN_CHANGE_BURST: { count: 50, life: 50, decay: 0.02, minRadius: 2, maxRadius: 6, minSpeed: 5, maxSpeed: 12 },
    TURN_DRIFT: { life: 120, decay: 0.005, radius: 2, speed: 0.4 }, // Cenizas flotantes
    POWER_BEAM: { life: 30, decay: 0.04, speed: 15 },
    ROYAL_AURA: { life: 25, decay: 0.05, speed: 1 },
    ULTIMATE_AURA: { life: 25, decay: 0.04, speed: 1.5 },
    SYNERGY_CHARGE: { life: 15, radius: 4 },
    SYNERGY_AURA: { life: 15, decay: 0.15, speed: 0.4 },
    SYNERGY_CONFIRM: { life: 20, decay: 0.06 },
    PULSAR_AURA: { life: 12, decay: 0.15, speed: 2, radius: 2 },
    GRAVITY_WELL: { life: 40, decay: 0.03, radius: 3, count: 10 },
    TELEPORT_IN: { count: 40, life: 20, decay: 0.05, minSpeed: 6, maxSpeed: 12 },
    TELEPORT_OUT: { count: 40, life: 20, decay: 0.05, minSpeed: 6, maxSpeed: 12 },
    REPULSOR_AURA: { life: 15, decay: 0.08, speed: 8 },
    AIM_FLOW: { life: 20, decay: 0.1, radius: 3, speed: 10 },
    CHARGED_SPARKS: { life: 30, decay: 0.03, radius: 2, speed: 1.5 },
};

export const SHOCKWAVE_COLORS: Record<number, string> = {
    1: '#ff0000',
    2: '#cc0000',
    3: '#990000',
    4: '#660000',
};

export const SYNERGY_HOLD_DURATION = 1200;
export const SYNERGY_GHOST_PHASE_DURATION = 120;
export const GRAVITY_WELL_RADIUS = 200;
export const GRAVITY_WELL_FORCE = 1.0;
export const TELEPORT_STRIKE_DISTANCE = 80;
export const REPULSOR_ARMOR_RADIUS = 150;
export const REPULSOR_ARMOR_FORCE = 0.6;
export const REPULSOR_ARMOR_DURATION = 300;

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
    powerFactor?: number;
};

export const SYNERGY_EFFECTS: Record<SynergyType, { color: string; ability?: 'EMP_ON_COLLISION' | 'GHOST_ON_LAUNCH' | 'GRAVITY_ON_COLLISION' | 'TELEPORT_ON_COLLISION' | 'REPULSOR_AURA'; statModifiers?: Partial<PuckTypeProperties> }> = {
    POWER: { color: '#ff0000', ability: 'EMP_ON_COLLISION' },
    SPEED: { color: '#00d4ff', ability: 'GHOST_ON_LAUNCH' },
    CONTROL: { color: '#ffffff', statModifiers: { elasticity: 1.0 } },
    GRAVITY_WELL: { color: '#ff0000', ability: 'GRAVITY_ON_COLLISION' },
    TELEPORT_STRIKE: { color: '#00d4ff', ability: 'TELEPORT_ON_COLLISION' },
    REPULSOR_ARMOR: { color: '#ff0000', ability: 'REPULSOR_AURA' }
};

export const SYNERGY_DESCRIPTIONS: Record<SynergyType, { name: string, description: string }> = {
    POWER: { name: 'Poder Demogorgon', description: 'Onda expansiva masiva al impactar.' },
    SPEED: { name: 'Vacío Veloz', description: 'Atraviesa obstáculos en los primeros segundos.' },
    CONTROL: { name: 'Precisión Mental', description: 'Rebotes perfectos sin pérdida de energía.' },
    GRAVITY_WELL: { name: 'Portal de Gravedad', description: 'Atrae a las fichas cercanas al punto de impacto.' },
    TELEPORT_STRIKE: { name: 'Salto Entre Dimensiones', description: 'Se teletransporta tras el primer choque.' },
    REPULSOR_ARMOR: { name: 'Escudo Psiónico', description: 'Repele violentamente a cualquier intruso.' }
};

export const PUCK_TYPE_PROPERTIES: Record<PuckType, PuckTypeProperties> = {
  STANDARD: { mass: 1, friction: 0.985, linesToCrossForBonus: 2 },
  HEAVY: { mass: 1.7, friction: 0.9877, linesToCrossForBonus: 3 },
  FAST: { mass: 0.75, friction: 0.987, linesToCrossForBonus: 2 },
  GHOST: { mass: 0.6, friction: 0.989, linesToCrossForBonus: 2 },
  ANCHOR: { mass: 2.5, friction: 0.9831, linesToCrossForBonus: 3 },
  KING: { mass: 4.5, friction: 0.980, linesToCrossForBonus: 1, powerFactor: 2.2 },
  SWERVE: { mass: 0.8, friction: 0.986, swerveFactor: 0.03, linesToCrossForBonus: 2 },
  BOUNCER: { mass: 1, friction: 0.985, elasticity: 1.05, linesToCrossForBonus: 2 },
  DAMPENER: { mass: 1.9, friction: 0.9862, elasticity: 0.4, linesToCrossForBonus: 3 },
  PAWN: { mass: 0.5, friction: 0.980, elasticity: 0.9, linesToCrossForBonus: 2 },
};

export const PUCK_TYPE_INFO: Record<PuckType, { name: string, description: string }> = {
    STANDARD: { name: 'Sujeto 01', description: 'Ficha básica experimental.' },
    HEAVY: { name: 'Tanque Hawkins', description: 'Pesada y difícil de mover.' },
    FAST: { name: 'Destello Azul', description: 'Ligera y veloz como un rayo.' },
    GHOST: { name: 'Entidad Etérea', description: 'Puede volverse intangible.' },
    ANCHOR: { name: 'Bloqueo Mental', description: 'Inamovible y masiva.' },
    KING: { name: 'El Rey / Once', description: 'La ficha más poderosa del tablero.' },
    SWERVE: { name: 'Curva Mental', description: 'Altera su trayectoria en pleno vuelo.' },
    BOUNCER: { name: 'Rebote Elástico', description: 'Gana energía en cada rebote.' },
    DAMPENER: { name: 'Absorbente', description: 'Anula la energía de los choques.' },
    PAWN: { name: 'Peón / Secuaz', description: 'Unidades prescindibles.' },
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

export const INITIAL_PUCK_CONFIG: { team: Team, pucks: { type: PuckType, position: { x: number, y: number } }[] }[] = [
  {
    team: 'RED',
    pucks: [
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.65 } })),
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
    team: 'BLUE',
    pucks: [
      ...PAWN_X_POSITIONS.map(x => ({ type: 'PAWN' as PuckType, position: { x, y: BOARD_HEIGHT * 0.35 } })),
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
