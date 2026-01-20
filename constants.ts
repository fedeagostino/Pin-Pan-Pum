
import { PuckType, SpecialShotStatus, SynergyType, Team, FormationType } from './types';

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

// Pulsar Config
export const MAX_PULSAR_POWER = 1000;
export const PULSAR_POWER_PER_LINE = 150; 

export const PUCK_GOAL_POINTS: Record<PuckType, number> = {
  STANDARD: 1,
  HEAVY: 1,
  FAST: 1,
  GHOST: 1,
  ANCHOR: 1,
  KING: 2,
  SWERVE: 1,
  BOUNCER: 1,
  DAMPENER: 1,
  PAWN: 1,
};

export type Language = 'en' | 'es';

export const TRANSLATIONS = {
    en: {
        TITLE: 'PIN PAN PUM',
        PLAY_FRIEND: 'Play vs Friend',
        PLAY_AI: 'Play vs AI',
        SETTINGS: 'Settings',
        LANGUAGE: 'Language',
        BACK: 'Back',
        VICTORY: 'VICTORY',
        RESTART: 'Restart',
        MENU: 'Menu',
        GOAL: 'GOAL!',
        GOALAZO: 'BIG GOAL!',
        POINTS: 'POINTS',
        TURN_OF: 'Turn of',
        EXTRA_TURN: 'EXTRA TURN!',
        CHARGED: 'CHARGED!',
        UNCHARGED: 'NOT CHARGED!',
        OWN_GOAL: 'OWN GOAL!',
        INTANGIBLE: 'INTANGIBLE!',
        TURN_LOST: 'TURN LOST',
        ROYAL_UNLOCKED: 'ROYAL SHOT UNLOCKED!',
        ULTIMATE_UNLOCKED: 'ULTIMATE SHOT!',
        OVERCHARGE: 'OVERCHARGE!',
        SYNERGY_ACT: 'Activated!',
        HELP: 'HELP',
        CHOOSE_FORMATION: 'Choose Your Formation',
        START_MATCH: 'Ready!',
        TABS: {
            GOAL: 'Objective',
            CONTROLS: 'Controls',
            RULES: 'Rules',
            PUCKS: 'Pucks',
            SYNERGIES: 'Synergies'
        },
        RULES_CONTENT: [
            { title: 'THE GOLDEN RULE', desc: 'You can ONLY score with a CHARGED puck (yellow glow). Once charged, a puck STAYS charged until a goal is scored.' },
            { title: 'HOW TO CHARGE', desc: 'Aim your shot through the imaginary lines between your other pucks to charge a piece permanently.' },
            { title: 'EXTRA TURNS', desc: 'Successfully crossing the required lines with your shot grants an immediate extra turn.' },
            { title: 'TURN LOSS', desc: 'Your turn ends if you miss crossing lines, score an own goal, or attempt to score with an uncharged puck.' },
            { title: 'KING POWER', desc: 'The King (Eleven/Vecna) can execute Special Shots. Royal: when specialists are charged. Ultimate: when all are charged.' }
        ],
        PUCK_INFO: {
            KING: { name: 'King / Vecna', desc: 'The ultimate power on the board.' },
            PAWN: { name: 'Pawn / Demobat', desc: 'Expendable swarm units.' },
            STANDARD: { name: 'Steve / The Hair', desc: 'The Babysitter with the perfect hair.' },
            HEAVY: { name: 'Steve / Nail Bat', desc: 'Strong defense and heavy hits.' },
            FAST: { name: 'Steve / The Hero', desc: 'Quick strikes with legendary style.' },
            GHOST: { name: 'Max / Headsets', desc: 'Ethereal entity with a special bond.' },
            ANCHOR: { name: 'Mind Block', desc: 'Immovable and massive.' },
            SWERVE: { name: 'Mind Curve', desc: 'Alters path mid-flight.' },
            BOUNCER: { name: 'Elastic Bounce', desc: 'Gains energy on every bounce.' },
            DAMPENER: { name: 'Absorbent', desc: 'Nullifies collision energy.' }
        },
        SYNERGY_INFO: {
            POWER: { name: 'Void Power', desc: 'Massive shockwave on impact.' },
            SPEED: { name: 'Dimensional Tear', desc: 'Passes through obstacles at first.' },
            CONTROL: { name: 'Hive Mind', desc: 'Perfect bounces without energy loss.' },
            GRAVITY_WELL: { name: 'Gravity Portal', desc: 'Attracts nearby pieces to impact point.' },
            TELEPORT_STRIKE: { name: 'Shadow Step', desc: 'Teleports after the first hit.' },
            REPULSOR_ARMOR: { name: 'Psionic Shield', desc: 'Violently repels intruders.' }
        },
        FORMATIONS: {
            BALANCED: 'Balanced',
            DEFENSIVE: 'Defensive',
            OFFENSIVE: 'Offensive'
        }
    },
    es: {
        TITLE: 'PIN PAN PUM',
        PLAY_FRIEND: 'Jugar vs Amigo',
        PLAY_AI: 'Jugar vs IA',
        SETTINGS: 'Configuración',
        LANGUAGE: 'Idioma',
        BACK: 'Volver',
        VICTORY: 'VICTORIA',
        RESTART: 'Reiniciar',
        MENU: 'Menú',
        GOAL: '¡GOL!',
        GOALAZO: '¡GOLAZO!',
        POINTS: '¡PUNTOS!',
        TURN_OF: 'Turno de',
        EXTRA_TURN: '¡TURNO EXTRA!',
        CHARGED: '¡CARGADO!',
        UNCHARGED: '¡NO CARGADA!',
        OWN_GOAL: '¡AUTOGOL!',
        INTANGIBLE: '¡INTANGIBLE!',
        TURN_LOST: 'TURNO PERDIDO',
        ROYAL_UNLOCKED: '¡TIRO REAL DESBLOQUEADO!',
        ULTIMATE_UNLOCKED: '¡TIRO DEFINITIVO!',
        OVERCHARGE: '¡SOBRECARGA!',
        SYNERGY_ACT: '¡Activada!',
        HELP: 'AYUDA',
        CHOOSE_FORMATION: 'Elige tu formación',
        START_MATCH: '¡Listo!',
        TABS: {
            GOAL: 'Objetivo',
            CONTROLS: 'Controles',
            RULES: 'Reglas',
            PUCKS: 'Fichas',
            SYNERGIES: 'Sinergias'
        },
        RULES_CONTENT: [
            { title: 'LA REGLA DE ORO', desc: 'SOLO puedes marcar gol con una ficha CARGADA (brillo amarillo). ¡Una vez cargada, la ficha NO se descarga hasta que haya un gol!' },
            { title: 'CÓMO CARGAR', desc: 'Apunta tu disparo a través de las líneas imaginarias entre tus otras fichas para activar su carga permanente.' },
            { title: 'TIROS EXTRA', desc: 'Cruzar con éxito las líneas requeridas en tu lanzamiento te otorga un tiro extra inmediato.' },
            { title: 'PÉRDIDA DE TURNO', desc: 'Tu turno termina si no cruzas líneas, marcas un autogol o intentas marcar sin estar cargado.' },
            { title: 'EL PODER DEL REY', desc: 'El Rey puede ejecutar Tiros Reales y Definitivos si sus súbditos están cargados.' }
        ],
        PUCK_INFO: {
            KING: { name: 'Rey / Vecna', desc: 'El poder supremo del tablero.' },
            PAWN: { name: 'Peón / Demobat', desc: 'Unidades de enjambre prescindibles.' },
            STANDARD: { name: 'Steve / Pelazo', desc: 'La niñera con el peinado perfecto.' },
            HEAVY: { name: 'Steve / Bate', desc: 'Defensa sólida y golpes pesados.' },
            FAST: { name: 'Steve / Héroe', desc: 'Ataques rápidos con estilo legendario.' },
            GHOST: { name: 'Max / Cascos', desc: 'Entidad etérea con un vínculo especial.' },
            ANCHOR: { name: 'Bloqueo Mental', desc: 'Inamovible y masiva.' },
            SWERVE: { name: 'Curva Mental', desc: 'Altera su trayectoria en pleno vuelo.' },
            BOUNCER: { name: 'Rebote Elástico', desc: 'Gana energía en cada rebote.' },
            DAMPENER: { name: 'Absorbente', desc: 'Anula la energía de los choques.' }
        },
        SYNERGY_INFO: {
            POWER: { name: 'Poder del Vacío', desc: 'Onda expansiva masiva al impactar.' },
            SPEED: { name: 'Desgarro Dimensional', desc: 'Atraviesa obstáculos en los primeros segundos.' },
            CONTROL: { name: 'Mente Colmena', desc: 'Rebotes perfectos sin pérdida de energía.' },
            GRAVITY_WELL: { name: 'Portal de Gravedad', desc: 'Atrae a las fichas cercanas al punto de impacto.' },
            TELEPORT_STRIKE: { name: 'Paso Sombrío', desc: 'Se teletransporta tras el primer choque.' },
            REPULSOR_ARMOR: { name: 'Escudo Psiónico', desc: 'Repele violentamente a cualquier intruso.' }
        },
        FORMATIONS: {
            BALANCED: 'Equilibrada',
            DEFENSIVE: 'Defensiva',
            OFFENSIVE: 'Offensiva'
        }
    }
};

export const TEAM_COLORS: Record<Team, string> = {
  BLUE: '#00d4ff',
  RED: '#ff0000',
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

// Physics
export const MIN_VELOCITY_TO_STOP = 0.1;
export const MAX_VELOCITY_FOR_TURN_END = 0.4;
export const LAUNCH_POWER_MULTIPLIER = 0.0441; 

export const PREVIEW_SHOT_POWER = 0.063; 
export const PREVIEW_SIMULATION_FRAMES = 120;

export const PUCK_TYPE_PROPERTIES: Record<PuckType, any> = {
  STANDARD: { mass: 1, friction: 0.985, linesToCrossForBonus: 1 },
  HEAVY: { mass: 1.7, friction: 0.9877, linesToCrossForBonus: 2 },
  FAST: { mass: 0.75, friction: 0.987, linesToCrossForBonus: 1 },
  GHOST: { mass: 0.6, friction: 0.989, linesToCrossForBonus: 1 },
  ANCHOR: { mass: 2.5, friction: 0.9831, linesToCrossForBonus: 2 },
  KING: { mass: 4.5, friction: 0.980, linesToCrossForBonus: 1, powerFactor: 2.2 },
  SWERVE: { mass: 0.8, friction: 0.986, swerveFactor: 0.03, linesToCrossForBonus: 1 },
  BOUNCER: { mass: 1, friction: 0.985, elasticity: 1.05, linesToCrossForBonus: 1 },
  DAMPENER: { mass: 1.9, friction: 0.9862, elasticity: 0.4, linesToCrossForBonus: 2 },
  PAWN: { mass: 0.5, friction: 0.980, elasticity: 0.9, linesToCrossForBonus: 1 },
};

export const PUCK_SVG_DATA: Record<PuckType, { path: string, designRadius: number, pathLength?: number }> = {
    STANDARD: { path: '', designRadius: 20 },
    HEAVY: { path: 'M 20 0 L 10 17.32 L -10 17.32 L -20 0 L -10 -17.32 L 10 -17.32 Z', designRadius: 20 },
    FAST: { path: 'M 0 -22 L 6 -12 L 20 -15 L 12 -4 L 18 10 L 0 5 L -18 10 L -12 -4 L -20 -15 L -6 -12 Z', designRadius: 22 },
    GHOST: { path: 'M 0 -20 C 14.4 -24.8, 24.8 0, 10 18 S -20 24.8, -15 -10 S 10 10, 0 -20 Z', designRadius: 20 },
    ANCHOR: { path: 'M 0 -20 L 20 0 L 0 20 L -20 0 Z', designRadius: 20 },
    KING: { path: 'M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z', designRadius: 20 },
    SWERVE: { path: 'M 0 -18 A 9 9 0 0 1 0 0 A 9 9 0 0 0 0 18 A 18 18 0 0 1 0 -18 Z', designRadius: 18 },
    BOUNCER: { path: '', designRadius: 20 },
    DAMPENER: { path: 'M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z', designRadius: 20 },
    PAWN: { path: 'M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z', designRadius: 15, pathLength: 90 },
};

export const SYNERGY_EFFECTS: Record<SynergyType, { color: string }> = {
  POWER: { color: '#ff3e3e' },
  SPEED: { color: '#00f6ff' },
  CONTROL: { color: '#2ecc71' },
  GRAVITY_WELL: { color: '#9b59b6' },
  TELEPORT_STRIKE: { color: '#f1c40f' },
  REPULSOR_ARMOR: { color: '#e67e22' },
};

export const SYNERGY_DESCRIPTIONS: Record<SynergyType, string> = {
  POWER: 'Impacto explosivo',
  SPEED: 'Atraviesa enemigos',
  CONTROL: 'Rebote perfecto',
  GRAVITY_WELL: 'Pozo gravitatorio',
  TELEPORT_STRIKE: 'Golpe teletransportado',
  REPULSOR_ARMOR: 'Escudo repulsor',
};

export const GRAVITY_WELL_RADIUS = 150;
export const REPULSOR_ARMOR_RADIUS = 100;
export const SHOCKWAVE_COLORS = ['#ffffff', '#ff0000', '#00d4ff'];
export const PARTICLE_CONFIG = {
  MAX_PARTICLES: 100,
  DEFAULT_LIFE: 60,
};

export const getPuckConfig = (team: Team, formation: FormationType) => {
    const isTop = team === 'RED';
    const yBase = isTop ? 0 : BOARD_HEIGHT;
    const direction = isTop ? 1 : -1;

    switch (formation) {
        case 'DEFENSIVE':
            return [
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 320 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH / 2, y: yBase + 120 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.25, y: yBase + 220 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 250 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.75, y: yBase + 220 * direction } },
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 60 * direction } },
            ];
        case 'OFFENSIVE':
            return [
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 580 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH / 2, y: yBase + 350 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.3, y: yBase + 450 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 480 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.7, y: yBase + 450 * direction } },
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 180 * direction } },
            ];
        case 'BALANCED':
        default:
            return [
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.50, y: yBase + 520 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH / 2, y: yBase + 280 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.2, y: yBase + 180 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.50, y: yBase + 150 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.8, y: yBase + 180 * direction } },
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 80 * direction } },
            ];
    }
};

export const INITIAL_PUCK_CONFIG = [
  { team: 'RED' as Team, formation: 'BALANCED' as FormationType },
  { team: 'BLUE' as Team, formation: 'BALANCED' as FormationType }
];

// Re-exports/Constants for consistency
export const GHOST_PHASE_DURATION = 180;
export const EMP_BURST_RADIUS = 120;
export const EMP_BURST_FORCE = 0.8;
export const SPECIAL_PUCKS_FOR_ROYAL_SHOT: PuckType[] = ['HEAVY', 'FAST', 'GHOST', 'ANCHOR', 'SWERVE', 'BOUNCER', 'DAMPENER'];
export const ROYAL_SHOT_POWER_MULTIPLIER = 2.0;
export const ULTIMATE_SHOT_POWER_MULTIPLIER = 3.5;
export const SYNERGY_GOAL_PULSAR_BONUS = 250;
export const TURNS_PER_ORB_SPAWN = 2;
export const ORBS_FOR_OVERCHARGE = 3;
// Fix: Removed duplicate MAX_PULSAR_POWER declaration. It is already declared on line 18.
export const PULSAR_BAR_HEIGHT = 80;
export const PULSAR_ORB_HIT_SCORE = 150;
export const FLOATING_TEXT_CONFIG = { LIFE: 90 };
