
export type Vector = {
  x: number;
  y: number;
};

export type Team = 'RED' | 'BLUE';

export type PuckType = 'STANDARD' | 'HEAVY' | 'FAST' | 'GHOST' | 'ANCHOR' | 'KING' | 'SWERVE' | 'BOUNCER' | 'DAMPENER' | 'PAWN';

export type SynergyType = 'POWER' | 'SPEED' | 'CONTROL' | 'GRAVITY_WELL' | 'TELEPORT_STRIKE' | 'REPULSOR_ARMOR';

export type SpecialShotStatus = 'NONE' | 'ROYAL' | 'ULTIMATE';

export type TemporaryEffectType = 'PHASED' | 'EMP_BURST' | 'ROYAL_RAGE' | 'ULTIMATE_RAGE' | 'REPULSOR_ARMOR';

export type TemporaryEffect = {
  type: TemporaryEffectType;
  duration: number; // Ticks to live
  destroyedCount?: number;
};

export type FormationType = 'BALANCED' | 'DEFENSIVE' | 'OFFENSIVE';

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
  activeSynergy?: {
    type: SynergyType;
    initialStats: {
        mass: number;
        friction: number;
        elasticity?: number;
        swerveFactor?: number;
    },
    lineAngle: number;
  };
  synergyEffectTriggered?: boolean;
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
  decay: number; // How fast life and opacity decrease
  renderType?: 'shockwave' | 'ring' | 'emp_burst' | 'orbiting' | 'heartbeat' | 'goal_shard' | 'idle_pulse' | 'power_beam' | 'royal_aura' | 'synergy_charge' | 'synergy_aura' | 'gravity_well' | 'repulsor_aura' | 'aim_streak' | 'line_impact';
  rotation?: number;
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
    synergyType: SynergyType | null;
};

export type ImaginaryLineState = {
  lines: ImaginaryLine[];
  isConfirmed: boolean;
  crossedLineIndices: Set<number>;
  highlightedLines: Record<number, number>; // index -> remaining frames (life)
  shotPuckId: number;
  comboCount: number;
} | null;

export type GameStatus = 'PRE_GAME' | 'PLAYING' | 'GOAL' | 'GAME_OVER';

export type GameState = {
  status: GameStatus;
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
  isPulsarShotActive: boolean;
  goalScoredInfo: {
    scoringTeam: Team;
    pointsScored: number;
    scoringPuckType: PuckType;
  } | null;
  gameMessage: { text: string; type: 'royal' | 'ultimate' | 'synergy' | 'powerup'; synergyType?: SynergyType; } | null;
  bonusTurnForTeam: Team | null;
  screenShake: number;
  turnLossReason: TurnLossReason | null;
  turnCount: number;
  formations: { RED: FormationType; BLUE: FormationType };
  pulsarOrb: {
    position: Vector;
    angle: number;
    radius: number;
  } | null;
};

export type TurnLossReason = 'OWN_GOAL' | 'UNCHARGED_GOAL' | 'PHASED_GOAL' | 'SPECIAL_NO_GOAL' | 'NO_CHARGE' | 'ALL_CHARGED';
