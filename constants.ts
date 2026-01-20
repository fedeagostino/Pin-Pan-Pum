
import { PuckType, SpecialShotStatus, SynergyType, Team, FormationType } from './types';

export const BOARD_WIDTH = 960;
export const BOARD_HEIGHT = 960; 
export const PUCK_RADIUS = 25; 
export const PAWN_PUCK_RADIUS = 15;
export const KING_PUCK_RADIUS = 35;
export const GOAL_WIDTH = 300; 
export const GOAL_DEPTH = 50; 
export const MIN_DRAG_DISTANCE = 10;
export const MAX_DRAG_FOR_POWER = 160; 
export const CANCEL_SHOT_THRESHOLD = PUCK_RADIUS * 1.5;
export const SCORE_TO_WIN = 3;
export const PAWN_DURABILITY = 5;

// Physics Simulation Quality
export const SUB_STEPS = 4; // Number of physics updates per frame for stability

// Portal (Pulsar) Config
export const MAX_PULSAR_POWER = 1000;
export const PULSAR_POWER_PER_LINE = 120; 
export const PULSAR_ORB_CHARGE_AMOUNT = 250; 
export const PULSAR_ORB_RADIUS = 13.2; // Reduced by 40% (22 * 0.6)
export const PULSAR_ORB_SPEED = 7.2;   // Reduced by 40% (12 * 0.6)
export const PULSAR_ORB_LINE_LENGTH = 140; 
export const PULSAR_ORB_SYNC_THRESHOLD = 80; 

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
        TITLE: 'STRANGER ARENA',
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
        EXTRA_TURN: 'KEEP SHOOTING!',
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
        PORTAL_OPEN: 'PORTAL OPEN!',
        PORTAL_DISCHARGE: 'PORTAL DISCHARGE!',
        TABS: {
            GOAL: 'Objective',
            CONTROLS: 'Controls',
            RULES: 'Rules',
            PUCKS: 'Pucks',
            SYNERGIES: 'Synergies'
        },
        RULES_CONTENT: [
            { title: 'THE FLOW RULE', desc: 'If your shot successfully CROSSES imaginary lines, you KEEP your turn. You can shoot again and again as long as you keep charging!' },
            { title: 'LOSING THE TURN', desc: 'You lose your turn if your shot fails to cross the required number of lines or if the piece cannot be charged further.' },
            { title: 'THE GOLDEN GOAL', desc: 'You can ONLY score with a CHARGED puck (yellow glow). Once charged, it stays charged until a goal is scored.' },
            { title: 'THE PORTAL', desc: 'Crossing lines also charges the Portal bar. Activate it for x2 Shot Power on your King.' },
            { title: 'KING POWER', desc: 'The King (Eleven/Vecna) is worth 2 points and has access to devastating special shots.' }
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
        TITLE: 'STRANGER ARENA',
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
        EXTRA_TURN: '¡SIGUE TIRANDO!',
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
        PORTAL_OPEN: '¡PORTAL ABIERTO!',
        PORTAL_DISCHARGE: '¡DESCARGA PORTAL!',
        TABS: {
            GOAL: 'Objetivo',
            CONTROLS: 'Controles',
            RULES: 'Reglas',
            PUCKS: 'Fichas',
            SYNERGIES: 'Sinergias'
        },
        RULES_CONTENT: [
            { title: 'LA REGLA DEL FLUJO', desc: 'Si tu ficha se CARGA al cruzar líneas imaginarias, ¡SIGUES TIRANDO sin perder el turno! Puedes disparar infinitamente mientras sigas cargando piezas.' },
            { title: 'PERDER EL TURNO', desc: 'El turno se pierde si la pieza lanzada NO cruza una línea imaginaria o si ya no puede ser cargada en ese tiro.' },
            { title: 'LA REGLA DE ORO', desc: 'SOLO puedes marcar gol con una ficha CARGADA (brillo amarillo). ¡Una vez cargada, la ficha NO se descarga hasta que haya un gol!' },
            { title: 'EL PORTAL', desc: 'Cruzar líneas carga la barra de Portal. Actívala para potenciar a tu Rey con x2 de Fuerza de Disparo.' },
            { title: 'EL PODER DEL REY', desc: 'El Rey vale 2 PUNTOS y puede ejecutar Tiros Reales y Definitivos si sus súbditos están cargados.' }
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
            CONTROL: { name: 'Mente Colmena', desc: 'Mente colmena: rebotes sin pérdida de energía.' },
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

// Physics Engine Values
export const MIN_VELOCITY_TO_STOP = 0.05;
export const MAX_VELOCITY_FOR_TURN_END = 0.15;
export const LAUNCH_POWER_MULTIPLIER = 0.032; 
export const WALL_BOUNCE_ELASTICITY = 0.8;

export const PUCK_TYPE_PROPERTIES: Record<PuckType, any> = {
  STANDARD: { mass: 1, friction: 0.985, linesToCrossForBonus: 1 },
  HEAVY: { mass: 2.2, friction: 0.988, linesToCrossForBonus: 2 },
  FAST: { mass: 0.7, friction: 0.986, linesToCrossForBonus: 1 },
  GHOST: { mass: 0.6, friction: 0.989, linesToCrossForBonus: 1 },
  ANCHOR: { mass: 3.5, friction: 0.982, linesToCrossForBonus: 2 },
  KING: { mass: 5.0, friction: 0.980, linesToCrossForBonus: 1, powerFactor: 2.2 },
  SWERVE: { mass: 0.8, friction: 0.986, swerveFactor: 0.03, linesToCrossForBonus: 1 },
  BOUNCER: { mass: 1, friction: 0.985, elasticity: 1.1, linesToCrossForBonus: 1 },
  DAMPENER: { mass: 1.9, friction: 0.986, elasticity: 0.3, linesToCrossForBonus: 2 },
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
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 280 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 100 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.22, y: yBase + 160 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.78, y: yBase + 160 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 340 * direction } }, 
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 45 * direction } },
            ];
        case 'OFFENSIVE':
            return [
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 460 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 300 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.2, y: yBase + 380 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.8, y: yBase + 380 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 420 * direction } }, 
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 180 * direction } },
            ];
        case 'BALANCED':
        default:
            return [
                { type: 'PAWN' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 420 * direction } },
                { type: 'KING' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 210 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.15, y: yBase + 260 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.85, y: yBase + 260 * direction } },
                { type: 'FAST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 330 * direction } }, 
                { type: 'GHOST' as PuckType, position: { x: BOARD_WIDTH * 0.5, y: yBase + 75 * direction } },
            ];
    }
};

export const INITIAL_PUCK_CONFIG = [
  { team: 'RED' as Team, formation: 'BALANCED' as FormationType },
  { team: 'BLUE' as Team, formation: 'BALANCED' as FormationType }
];

export const GHOST_PHASE_DURATION = 180;
export const FLOATING_TEXT_CONFIG = { LIFE: 90 };
