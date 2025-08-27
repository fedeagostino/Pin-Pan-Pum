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

// Physics constants
export const MIN_VELOCITY_TO_STOP = 0.1;
export const MAX_VELOCITY_FOR_TURN_END = 0.4; // If fastest puck is slower than this, end turn.
export const LAUNCH_POWER_MULTIPLIER = 12; // Power of the shot impulse
export const MAX_VELOCITY = 40; // Prevents physics tunneling

// New Goal Point System
export const PUCK_GOAL_POINTS: Record<PuckType, number> = {
    KING: 3,
    HEAVY: 2,
    ANCHOR: 2,
    DAMPENER: 2,
    GUARD: 2,
    BASTION: 2,
    JUGGERNAUT: 2,
    PULVERIZER: 2,
    ORBITER: 2,
    STANDARD: 1,
    FAST: 1,
    GHOST: 1,
    SWERVE: 1,
    BOUNCER: 1,
    INFILTRATOR: 1,
    WIZARD: 1,
    PAWN: 1,
    REAPER: 1,
    PHANTOM: 1,
    MENDER: 1,
    DISRUPTOR: 1,
    SEER: 1,
    TRAPPER: 1,
};


// Preview Simulation Constants
export const PREVIEW_SHOT_POWER = 4;
export const PREVIEW_SIMULATION_FRAMES = 45;

export const TEAM_COLORS: Record<Team, string> = {
  BLUE: '#00f6ff',
  RED: '#ff073a',
};

export const UI_COLORS = {
  BACKGROUND_PAPER: '#010409',
  BG_DARK: '#0d1117',
  BG_MEDIUM: '#161b22',
  BG_LIGHT: '#21262d',
  TEXT_DARK: '#f0f6fc',
  TEXT_LIGHT: '#0d1117',
  ACCENT_GREEN: '#39d353',
  ACCENT_YELLOW: '#f1e05a',
  ACCENT_PURPLE: '#c879ff',
  GOLD: '#f1e05a',
};

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
export const SPECIAL_PUCKS_FOR_ROYAL_SHOT: PuckType[] = ['HEAVY', 'FAST', 'GHOST', 'ANCHOR', 'SWERVE', 'BOUNCER', 'DAMPENER', 'GUARD', 'INFILTRATOR', 'WIZARD', 'BASTION', 'REAPER', 'PHANTOM', 'MENDER', 'DISRUPTOR', 'JUGGERNAUT', 'SEER', 'PULVERIZER', 'ORBITER', 'TRAPPER'];
export const ROYAL_SHOT_POWER_MULTIPLIER = 2.0;
export const ROYAL_SHOT_DESTROY_LIMIT = 1;
export const ULTIMATE_SHOT_POWER_MULTIPLIER = 3.0;
export const ULTIMATE_SHOT_DESTROY_LIMIT = 2;

// New Puck Ability Constants
export const JUGGERNAUT_MASS_FACTOR = 0.1; // Mass increases by 10% of velocity magnitude
export const ORBITER_AURA_RADIUS = 150;
export const ORBITER_AURA_FORCE = 0.03;
export const SEER_AURA_RADIUS = 160;
export const TRAPPER_AURA_RADIUS = 60;
export const TRAPPER_DAMPENING_FACTOR = 0.92; // Multiplies velocity each frame
export const MENDER_AURA_RADIUS = 120;
export const REAPER_BOOST_FACTOR = 1.15; // 15% velocity boost on first hit
export const DISRUPTOR_NEUTRALIZED_DURATION = 300; // 5 seconds at 60fps
export const PULVERIZER_BURST_RADIUS = 100;
export const PULVERIZER_BURST_FORCE = 1.0;
export const PHANTOM_TELEPORT_TRIGGER_DISTANCE = 250;
export const PHANTOM_TELEPORT_DISTANCE = 150;


// Combo System
export const COMBO_BONUSES: Record<number, number> = {
    2: 1.25, // x2 combo gets 25% bonus power
    3: 1.5,  // x3 combo gets 50% bonus power
    4: 2.0,  // x4+ combo gets 100% bonus power
};

// New floating text config
export const FLOATING_TEXT_CONFIG = {
    LIFE: 50, // 1 second at 60fps
    DECAY: 0.018,
    RISE_SPEED: -0.8,
};

// Particle effects configuration (FURTHER OPTIMIZED COUNTS)
export const PARTICLE_CONFIG = {
    SLIDING: { life: 4, decay: 0.3, radius: 2, speed: 0.2 },
    COLLISION: { life: 8, decay: 0.12, minRadius: 1, maxRadius: 3 },
    WALL_IMPACT: { life: 9, decay: 0.1, radius: 2.5 },
    SYNERGY_TRAIL: { life: 6, decay: 0.25, radius: 3.5, speed: 0.4 },
    GOAL_STANDARD: { count: 1, life: 15, decay: 0.04, minRadius: 1, maxRadius: 4, minSpeed: 1, maxSpeed: 5 },
    GOAL_HEAVY: { count: 1, life: 20, decay: 0.03, minRadius: 2, maxRadius: 6, minSpeed: 2, maxSpeed: 7 },
    GOAL_KING: { count: 2, life: 25, decay: 0.02, minRadius: 2, maxRadius: 8, minSpeed: 3, maxSpeed: 10 },
    GOAL_SHOCKWAVE: { life: 20, decay: 0.05 },
    GOAL_SHARD: { count: 0, life: 30, decay: 0.03, minSpeed: 15, maxSpeed: 30 },
    LINE_SHOCKWAVE: { life: 13, decay: 0.08, speed: 8 },
    PULSAR_LAUNCH: { count: 1, life: 25, decay: 0.06, minRadius: 1, maxRadius: 4, speed: 4 },
    EMP_BURST: { life: 15, decay: 0.08, speed: 12 },
    PAWN_SHATTER: { count: 1, life: 10, decay: 0.12, minRadius: 1, maxRadius: 3, minSpeed: 1, maxSpeed: 4 },
    GHOST_TRAIL: { life: 7, decay: 0.2, radius: 2.5, speed: 0.1 },
    PULSAR_CHARGE: { life: 30, decay: 0.03, radius: 2, speed: 5 },
    PULSAR_ORB_HIT: { count: 2, life: 20, decay: 0.06, minRadius: 1, maxRadius: 3, minSpeed: 2, maxSpeed: 6 },
    OVERCHARGE_AURA: { life: 10, decay: 0.2, speed: 4 },
    MAX_POWER_REACHED: { count: 1, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 3 },
    MAX_POWER_IDLE: { life: 13, decay: 0.16, radius: 2, speed: 0.2 },
    SHOT_BURST: { count: 0, life: 15, decay: 0.08, minRadius: 1, maxRadius: 3, speed: 2 },
    KING_TRAIL: { life: 10, decay: 0.08, radius: 4, speed: 0.1 },
    HEAVY_TRAIL: { life: 9, decay: 0.1, radius: 3.5, speed: 0.05 },
    FAST_TRAIL: { life: 8, decay: 0.24, radius: 1.5, speed: 0.5 },
    SWERVE_TRAIL: { life: 13, decay: 0.1, radius: 2, speed: 0.8 },
    BOUNCER_TRAIL: { life: 13, decay: 0.1 },
    ROYAL_POWER_READY: { life: 25, decay: 0.04, radius: 2, speed: 0.5 },
    ULTIMATE_POWER_READY: { life: 30, decay: 0.036, radius: 2.5, speed: 0.6 },
    ROYAL_SHOT_LAUNCH: { count: 1, life: 30, decay: 0.04, minRadius: 2, maxRadius: 6, speed: 8 },
    ROYAL_RAGE_TRAIL: { life: 40, decay: 0.03, radius: 5, speed: 0.2 },
    ULTIMATE_SHOT_LAUNCH: { count: 2, life: 35, decay: 0.03, minRadius: 2, maxRadius: 7, speed: 10 },
    ULTIMATE_RAGE_TRAIL: { life: 45, decay: 0.024, radius: 7, speed: 0.3 },
    TURN_CHANGE_BURST: { count: 1, life: 25, decay: 0.04, minRadius: 2, maxRadius: 5, minSpeed: 4, maxSpeed: 10 },
    TURN_DRIFT: { life: 60, decay: 0.012, radius: 2, speed: 0.35 },
    POWER_BEAM: { life: 20, decay: 0.05, speed: 12 },
    ROYAL_AURA: { life: 15, decay: 0.08, speed: 1 },
    ULTIMATE_AURA: { life: 15, decay: 0.07, speed: 1.5 },
    SYNERGY_CHARGE: { life: 10, radius: 2.5 },
    SYNERGY_AURA: { life: 10, decay: 0.2, speed: 0.3 },
    SYNERGY_CONFIRM: { life: 13, decay: 0.08 },
    PULSAR_AURA: { life: 8, decay: 0.2, speed: 1.5, radius: 1.5 },
    GRAVITY_WELL: { life: 30, decay: 0.04, radius: 2.5, count: 1 },
    TELEPORT_IN: { count: 2, life: 15, decay: 0.08, minSpeed: 4, maxSpeed: 8 },
    TELEPORT_OUT: { count: 2, life: 15, decay: 0.08, minSpeed: 4, maxSpeed: 8 },
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


// Synergy System
export const SYNERGY_HOLD_DURATION = 1200; // 1.2 seconds
export const SYNERGY_GHOST_PHASE_DURATION = 140; // 2.3 seconds at 60fps
export const GRAVITY_WELL_RADIUS = 200;
export const GRAVITY_WELL_FORCE = 1.2;
export const TELEPORT_STRIKE_DISTANCE = 80;
export const REPULSOR_ARMOR_RADIUS = 150;
export const REPULSOR_ARMOR_FORCE = 0.6;
export const REPULSOR_ARMOR_DURATION = 300; // 5 seconds at 60fps
// New Synergy Constants
export const DEMOLITION_CHARGE_RADIUS = 180;
export const DEMOLITION_CHARGE_FORCE = 1.5;
export const BLACK_HOLE_RADIUS = 220;
export const BLACK_HOLE_FORCE = 1.8;
export const BLACK_HOLE_DAMPENING = 0.95;
export const BLACK_HOLE_DURATION = 360; // 6 seconds
export const PHANTOM_ASSAULT_PHASE_DURATION = 90; // 1.5 seconds
export const PHANTOM_ASSAULT_BOOST_FACTOR = 1.3; // 30% speed boost
export const PURGE_PULSE_RADIUS = 160;


export const SYNERGY_COMBOS: Record<string, SynergyType> = {
    'HEAVY-ANCHOR': 'POWER',
    'GUARD-ANCHOR': 'POWER',
    'FAST-SWERVE': 'SPEED',
    'INFILTRATOR-SWERVE': 'SPEED',
    'BOUNCER-DAMPENER': 'CONTROL',
    'HEAVY-DAMPENER': 'GRAVITY_WELL',
    'FAST-GHOST': 'TELEPORT_STRIKE',
    'WIZARD-GHOST': 'TELEPORT_STRIKE',
    'ANCHOR-BOUNCER': 'REPULSOR_ARMOR',
    // New Synergies
    'JUGGERNAUT-PULVERIZER': 'DEMOLITION_CHARGE',
    'ORBITER-TRAPPER': 'BLACK_HOLE',
    'PHANTOM-REAPER': 'PHANTOM_ASSAULT',
    'DISRUPTOR-SEER': 'PURGE_PULSE',
};

export type PuckTypeProperties = {
    mass: number;
    friction: number;
    linesToCrossForBonus: number;
    elasticity?: number;
    swerveFactor?: number;
    powerFactor?: number; // How much to multiply shot power by
};

export const SYNERGY_EFFECTS: Record<SynergyType, { color: string; ability?: 'EMP_ON_COLLISION' | 'GHOST_ON_LAUNCH' | 'GRAVITY_ON_COLLISION' | 'TELEPORT_ON_COLLISION' | 'REPULSOR_AURA' | 'DEMOLITION_ON_COLLISION' | 'BLACK_HOLE_ON_COLLISION' | 'PHASE_ON_LAUNCH_SPEED_ON_COLLISION' | 'PURGE_ON_COLLISION'; statModifiers?: Partial<PuckTypeProperties> }> = {
    POWER: { color: '#f97316', ability: 'EMP_ON_COLLISION' },
    SPEED: { color: '#ec4899', ability: 'GHOST_ON_LAUNCH' },
    CONTROL: { color: '#a855f7', statModifiers: { elasticity: 1.0 } },
    GRAVITY_WELL: { color: '#6366f1', ability: 'GRAVITY_ON_COLLISION' },
    TELEPORT_STRIKE: { color: '#22d3ee', ability: 'TELEPORT_ON_COLLISION' },
    REPULSOR_ARMOR: { color: '#fbbf24', ability: 'REPULSOR_AURA' },
    // New Synergies
    DEMOLITION_CHARGE: { color: '#ef4444', ability: 'DEMOLITION_ON_COLLISION' }, // red-500
    BLACK_HOLE: { color: '#4f46e5', ability: 'BLACK_HOLE_ON_COLLISION' }, // indigo-600
    PHANTOM_ASSAULT: { color: '#d946ef', ability: 'PHASE_ON_LAUNCH_SPEED_ON_COLLISION' }, // fuchsia-500
    PURGE_PULSE: { color: '#14b8a6', ability: 'PURGE_ON_COLLISION' }, // teal-500
};

export const SYNERGY_DESCRIPTIONS: Record<SynergyType, { name: string, description: string }> = {
    POWER: { name: 'Sinergia de Potencia', description: 'Al colisionar por primera vez, la ficha emite una potente onda de choque EMP que empuja a los oponentes.' },
    SPEED: { name: 'Sinergia de Velocidad', description: 'La ficha se vuelve intangible durante los primeros segundos del disparo, permitiendo atravesar defensas.' },
    CONTROL: { name: 'Sinergia de Control', description: 'Otorga rebotes perfectos contra las paredes, sin perder energía en el impacto.' },
    GRAVITY_WELL: { name: 'Sinergia de Gravedad', description: 'Al colisionar, crea un pozo de gravedad que atrae a las fichas enemigas cercanas.' },
    TELEPORT_STRIKE: { name: 'Golpe Espectral', description: 'Tras la primera colisión, se teletransporta instantáneamente detrás del objetivo.' },
    REPULSOR_ARMOR: { name: 'Armadura Repulsora', description: 'Emite un campo de fuerza continuo que repele a las fichas enemigas cercanas.' },
    // New Synergies
    DEMOLITION_CHARGE: { name: 'Carga de Demolición', description: 'En la primera colisión, desata una explosión masiva que repele con gran fuerza a todos los enemigos en un área amplia.' },
    BLACK_HOLE: { name: 'Agujero Negro', description: 'Al impactar, crea un vórtice persistente que atrae y ralentiza drásticamente a los enemigos cercanos durante unos segundos.' },
    PHANTOM_ASSAULT: { name: 'Asalto Espectral', description: 'La ficha se vuelve intangible al ser lanzada y, tras su primera colisión, recibe un gran impulso de velocidad.' },
    PURGE_PULSE: { name: 'Pulso de Purga', description: 'En cada colisión, emite un pulso que elimina TODOS los efectos (sinergias, intangibilidad, etc.) de los enemigos cercanos.' },
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
  GUARD: { mass: 2.2, friction: 0.984, linesToCrossForBonus: 3, elasticity: 0.6 },
  INFILTRATOR: { mass: 0.4, friction: 0.99, linesToCrossForBonus: 2, powerFactor: 1.2 },
  WIZARD: { mass: 1.1, friction: 0.985, linesToCrossForBonus: 2 },
  // 10 NEW PUCKS
  BASTION: { mass: 2.8, friction: 0.978, elasticity: 0.2, linesToCrossForBonus: 4 },
  REAPER: { mass: 0.9, friction: 0.988, linesToCrossForBonus: 2 },
  PHANTOM: { mass: 0.7, friction: 0.99, linesToCrossForBonus: 2 },
  MENDER: { mass: 1.2, friction: 0.985, linesToCrossForBonus: 2 },
  DISRUPTOR: { mass: 1.0, friction: 0.986, linesToCrossForBonus: 3 },
  JUGGERNAUT: { mass: 1.5, friction: 0.984, linesToCrossForBonus: 3 },
  SEER: { mass: 0.9, friction: 0.987, linesToCrossForBonus: 2 },
  PULVERIZER: { mass: 1.4, friction: 0.985, linesToCrossForBonus: 3 },
  ORBITER: { mass: 1.8, friction: 0.982, linesToCrossForBonus: 3 },
  TRAPPER: { mass: 1.3, friction: 0.980, linesToCrossForBonus: 3 },
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
    GUARD: { name: 'Guardia', description: `Una unidad defensiva robusta con masa elevada y baja elasticidad, ideal para bloquear disparos (+${PUCK_GOAL_POINTS.GUARD} puntos).` },
    INFILTRATOR: { name: 'Infiltrador', description: `Extremadamente ligero y de baja fricción, obtiene un bonus de potencia al ser lanzado, perfecto para ataques rápidos y precisos (+${PUCK_GOAL_POINTS.INFILTRATOR} punto).` },
    WIZARD: { name: 'Hechicero', description: `Una ficha equilibrada con potencial para habilidades especiales (próximamente) (+${PUCK_GOAL_POINTS.WIZARD} punto).` },
    // 10 NEW PUCKS
    BASTION: { name: 'Bastión', description: `Una fortaleza móvil. Extremadamente pesada y con una elasticidad casi nula, diseñada para detener en seco los ataques enemigos (+${PUCK_GOAL_POINTS.BASTION} puntos).` },
    REAPER: { name: 'Segador', description: `Gana un impulso de velocidad tras su primera colisión con un enemigo en cada disparo, permitiéndole continuar su avance mortal (+${PUCK_GOAL_POINTS.REAPER} punto).` },
    PHANTOM: { name: 'Espectro', description: `Al ser disparado, se teletransporta una corta distancia hacia adelante a mitad de su trayectoria, atravesando líneas defensivas inesperadamente (+${PUCK_GOAL_POINTS.PHANTOM} punto).` },
    MENDER: { name: 'Reparador', description: `Una ficha de apoyo. Al cruzar una línea, emite un pulso que repara 1 punto de durabilidad a todos los peones aliados cercanos (+${PUCK_GOAL_POINTS.MENDER} punto).` },
    DISRUPTOR: { name: 'Disruptor', description: `En una colisión, neutraliza temporalmente las propiedades especiales de una ficha enemiga, convirtiéndola en una ficha Estándar por unos segundos (+${PUCK_GOAL_POINTS.DISRUPTOR} punto).` },
    JUGGERNAUT: { name: 'Juggernaut', description: `Su masa efectiva aumenta con su velocidad. Cuanto más rápido se mueve, más fuerte y devastador es su impacto (+${PUCK_GOAL_POINTS.JUGGERNAUT} puntos).` },
    SEER: { name: 'Vidente', description: `Emite un aura pasiva que anula la habilidad de fase de las fichas Fantasma enemigas cercanas, forzándolas a ser visibles y tangibles (+${PUCK_GOAL_POINTS.SEER} punto).` },
    PULVERIZER: { name: 'Pulverizador', description: `Tras su primera colisión con un enemigo en cada disparo, libera una onda de choque que repele a otras fichas enemigas cercanas (+${PUCK_GOAL_POINTS.PULVERIZER} puntos).` },
    ORBITER: { name: 'Orbitador', description: `Posee un débil campo gravitacional que atrae ligeramente a las fichas enemigas cercanas, alterando sus trayectorias y agrupándolas (+${PUCK_GOAL_POINTS.ORBITER} puntos).` },
    TRAPPER: { name: 'Trampero', description: `Cuando está inmóvil, genera un campo pegajoso a su alrededor que reduce drásticamente la velocidad de las fichas enemigas que lo atraviesan (+${PUCK_GOAL_POINTS.TRAPPER} punto).` },
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
    GUARD: { path: 'M 0 -20 L 20 -10 L 20 10 L 0 20 L -20 10 L -20 -10 Z', designRadius: 20 },
    INFILTRATOR: { path: 'M 0 -20 L 5 -5 L 20 -5 L 10 5 L 15 20 L 0 10 L -15 20 L -10 5 L -20 -5 L -5 -5 Z', designRadius: 20 },
    WIZARD: { path: 'M 0 -20 L 20 20 M -20 20 L 20 -20 M -15 -15 L 15 15 M -15 15 L 15 -15', designRadius: 20 },
    // 10 NEW PUCKS
    BASTION: { path: 'M 0 -20 C 18 -20, 18 -4, 18 0 L 18 12 C 18 18, 10 20, 0 20 S -18 18, -18 12 L -18 0 C -18 -4, -18 -20, 0 -20 Z', designRadius: 20 },
    REAPER: { path: 'M 0 -20 C 15 -20, 20 -15, 20 0 C 20 15, 10 20, -5 20 C -10 10, -10 0, 0 -20 Z M 5 -15 C 0 -10, -5 -5, -5 5', designRadius: 20 },
    PHANTOM: { path: 'M 0 -20 C 20 -15, 15 10, 0 20 C -15 10, -20 -15, 0 -20 Z M 0 -15 C 10 -12, 8 5, 0 15 C -8 5, -10 -12, 0 -15 Z', designRadius: 20 },
    MENDER: { path: 'M 0 -18 L 0 18 M -18 0 L 18 0 M -13 -13 L 13 13 M -13 13 L 13 -13', designRadius: 20 },
    DISRUPTOR: { path: 'M 0 -20 A 20 20 0 1 1 0 20 A 20 20 0 1 1 0 -20 M 15 5 L -5 -15', designRadius: 20 },
    JUGGERNAUT: { path: 'M 0 -20 L 15 -20 L 20 0 L 15 20 L -15 20 L -20 0 L -15 -20 Z M -10 -15 L -5 -5 L 5 -5 L 10 -15 Z', designRadius: 20 },
    SEER: { path: 'M -20 0 C -10 -15, 10 -15, 20 0 C 10 15, -10 15, -20 0 Z M 0 0 A 8 8 0 1 1 0 -0.1 Z', designRadius: 20 },
    PULVERIZER: { path: 'M 0 -15 L 5 -5 L 15 0 L 5 5 L 0 15 L -5 5 L -15 0 L -5 -5 Z', designRadius: 15 },
    ORBITER: { path: 'M 0 0 A 12 12 0 1 1 0 -0.1 Z M 0 -20 A 4 4 0 1 1 0 -19.9 Z M 0 20 A 4 4 0 1 1 0 19.9 Z', designRadius: 20 },
    TRAPPER: { path: 'M 0 0 L 0 -20 M 0 0 L 0 20 M 0 0 L 20 0 M 0 0 L -20 0 M 0 0 L 14.1 -14.1 M 0 0 L -14.1 14.1 M 0 0 L -14.1 -14.1 M 0 0 L 14.1 14.1 M -10 -10 A 14.1 14.1 0 1 1 -10.1 -10', designRadius: 20 },
};

export const SELECTABLE_PUCKS: PuckType[] = [
    'HEAVY',
    'FAST',
    'GHOST',
    'ANCHOR',
    'SWERVE',
    'BOUNCER',
    'DAMPENER',
    'GUARD',
    'INFILTRATOR',
    'WIZARD',
    'BASTION',
    'REAPER',
    'PHANTOM',
    'MENDER',
    'DISRUPTOR',
    'JUGGERNAUT',
    'SEER',
    'PULVERIZER',
    'ORBITER',
    'TRAPPER',
];