export type Vector = {
  x: number;
  y: number;
};

export type Team = 'RED' | 'BLUE';

export type PuckType = 'KING' | 'PAWN' | 'GUARDIAN';

export type SpecialShotStatus = 'NONE' | 'ROYAL' | 'ULTIMATE';

export type TemporaryEffectType = 'PHASED' | 'EMP_BURST' | 'ROYAL_RAGE' | 'ULTIMATE_RAGE' | 'REPULSOR_ARMOR';

export type TemporaryEffect = {
  type: TemporaryEffectType;
  duration: number; // Ticks to live
  destroyedCount?: number;
};

export type Puck = {
  id: number;
  puckType: PuckType;
  team: Team;
  position: Vector;
  initialPosition: Vector;
  velocity: Vector;
  rotation: number;
  mass: number;
  friction: number;
  radius: number;
  isCharged: boolean;
  elasticity?: number;
  swerveFactor?: number;
  durability?: number;
  temporaryEffects: TemporaryEffect[];
};

export type Particle = {
  id: number;
  position: Vector;
  velocity: Vector;
  radius: number;
  color: string;
  opacity: number;
  life: number; // Ticks to live
  lifeSpan: number; // The initial life value, for percentage calculations
  decay: number; // How fast life and opacity decrease. Can be negative for special effects.
  renderType?: 'shockwave' | 'ring' | 'emp_burst' | 'orbiting' | 'heartbeat' | 'goal_shard' | 'idle_pulse' | 'power_beam' | 'royal_aura' | 'synergy_charge' | 'synergy_aura' | 'gravity_well' | 'repulsor_aura' | 'aim_streak';
  isPerfect?: boolean;
  progress?: number; // For orbiting particles
  speed?: number; // For orbiting particles
  puckType?: PuckType; // For idle_pulse to match shape
  rotation?: number; // For idle_pulse to match orientation
};

export type FloatingText = {
  id: number;
  text: string;
  position: Vector;
  color: string;
  opacity: number;
  life: number;
  decay: number;
  velocity: Vector;
};

export type ImaginaryLine = {
    start: Vector;
    end: Vector;
    sourcePuckIds: [number, number];
    passivelyCrossedBy: Set<number>; // Holds GHOST puck IDs this line passes over
};

export type ImaginaryLineState = {
  lines: ImaginaryLine[];
  isConfirmed: boolean;
  crossedLineIndices: Set<number>;
  pawnPawnLinesCrossed: Set<number>;
  pawnSpecialLinesCrossed: Set<number>;
  shotPuckId: number;
  comboCount: number;
  highlightedLineIndex: number | null;
} | null;

export type PuckTrajectory = {
  puckId: number;
  path: Vector[];
};

export type PreviewState = {
  leadPuckId: number;
  trajectories: PuckTrajectory[];
  potentialLines: ImaginaryLine[];
  linesToCrossForBonus: number;
  chargeRequirementText: string;
} | null;

export type TurnLossReason = 'OWN_GOAL' | 'UNCHARGED_GOAL' | 'PHASED_GOAL' | 'SPECIAL_NO_GOAL';

export type GameState = {
  pucks: Puck[];
  particles: Particle[];
  orbitingParticles: Particle[];
  floatingTexts: FloatingText[];
  currentTurn: Team;
  winner: Team | null;
  score: { RED: number; BLUE: number; };
  isSimulating: boolean;
  canShoot: boolean;
  selectedPuckId: number | null;
  infoCardPuckId: number | null;
  shotPreview: {
    start: Vector;
    end: Vector;
    isMaxPower: boolean;
    isCancelZone: boolean;
    specialShotType: SpecialShotStatus | null;
    power: number;
  } | null;
  imaginaryLine: ImaginaryLineState;
  pucksShotThisTurn: number[];
  viewBox: string;
  isCameraInTensionMode: boolean;
  pulsarPower: { RED: number; BLUE: number; };
  specialShotStatus: { RED: SpecialShotStatus; BLUE: SpecialShotStatus; };
  pulsarShotArmed: Team | null;
  goalScoredInfo: {
    scoringTeam: Team;
    pointsScored: number;
    scoringPuckType: PuckType;
  } | null;
  // FIX: Removed 'synergy' as it's a deprecated feature.
  gameMessage: { text: string; type: 'royal' | 'ultimate' | 'powerup'; } | null;
  bonusTurnForTeam: Team | null;
  screenShake: number;
  previewState: PreviewState | null;
  lastShotWasSpecial: SpecialShotStatus;
  orbHitsThisShot: number;
  turnLossReason: TurnLossReason | null;
  turnCount: number;
  orbCollection: { RED: number; BLUE: number; };
  overchargedTeam: Team | null;
};