import { useState, useEffect, useCallback, useRef } from 'react';
import { Puck, Team, Vector, GameState, ImaginaryLineState, PuckType, Particle, ImaginaryLine, SynergyType, TemporaryEffect, PreviewState, PuckTrajectory, SpecialShotStatus, TurnLossReason, TeamConfig } from '../types';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PUCK_RADIUS,
  PAWN_PUCK_RADIUS,
  KING_PUCK_RADIUS,
  GOAL_WIDTH,
  GOAL_DEPTH,
  MIN_VELOCITY_TO_STOP,
  MAX_VELOCITY_FOR_TURN_END,
  LAUNCH_POWER_MULTIPLIER,
  PUCK_TYPE_PROPERTIES,
  MIN_DRAG_DISTANCE,
  TEAM_COLORS,
  PARTICLE_CONFIG,
  PULSAR_POWER_PER_LINE,
  MAX_PULSAR_POWER,
  SYNERGY_COMBOS,
  SYNERGY_EFFECTS,
  COMBO_BONUSES,
  SHOCKWAVE_COLORS,
  PERFECT_CROSSING_THRESHOLD,
  PERFECT_CROSSING_BONUS,
  SYNERGY_CROSSING_BONUS,
  GHOST_PHASE_DURATION,
  EMP_BURST_RADIUS,
  EMP_BURST_FORCE,
  SCORE_TO_WIN,
  PUCK_GOAL_POINTS,
  PAWN_DURABILITY,
  FLOATING_TEXT_CONFIG,
  PREVIEW_SHOT_POWER,
  PREVIEW_SIMULATION_FRAMES,
  PULSAR_ORB_HIT_SCORE,
  PULSAR_BAR_HEIGHT,
  MAX_DRAG_FOR_POWER,
  CANCEL_SHOT_THRESHOLD,
  UI_COLORS,
  SPECIAL_PUCKS_FOR_ROYAL_SHOT,
  ROYAL_SHOT_POWER_MULTIPLIER,
  SYNERGY_HOLD_DURATION,
  ROYAL_SHOT_DESTROY_LIMIT,
  ULTIMATE_SHOT_POWER_MULTIPLIER,
  ULTIMATE_SHOT_DESTROY_LIMIT,
  SYNERGY_GHOST_PHASE_DURATION,
  SYNERGY_DESCRIPTIONS,
  SYNERGY_GOAL_PULSAR_BONUS,
  GRAVITY_WELL_RADIUS,
  GRAVITY_WELL_FORCE,
  TELEPORT_STRIKE_DISTANCE,
  REPULSOR_ARMOR_RADIUS,
  REPULSOR_ARMOR_FORCE,
  REPULSOR_ARMOR_DURATION,
  TURNS_PER_ORB_SPAWN,
  ORBS_FOR_OVERCHARGE,
  OVERCHARGE_REPULSOR_RADIUS,
  OVERCHARGE_REPULSOR_FORCE,
  JUGGERNAUT_MASS_FACTOR,
  ORBITER_AURA_RADIUS,
  ORBITER_AURA_FORCE,
  SEER_AURA_RADIUS,
  TRAPPER_AURA_RADIUS,
  TRAPPER_DAMPENING_FACTOR,
  MENDER_AURA_RADIUS,
  REAPER_BOOST_FACTOR,
  DISRUPTOR_NEUTRALIZED_DURATION,
  PULVERIZER_BURST_RADIUS,
  PULVERIZER_BURST_FORCE,
  PHANTOM_TELEPORT_TRIGGER_DISTANCE,
  PHANTOM_TELEPORT_DISTANCE,
} from '../constants';
import { STRATEGIC_PLANS } from '../formations';

// RED scores in the TOP goal, BLUE scores in the BOTTOM goal.
const GOAL_Y_BLUE_SCORES = 0; // This is the TOP goal, visually blue
const GOAL_Y_RED_SCORES = BOARD_HEIGHT; // This is the BOTTOM goal, visually red
const GOAL_X_MIN = (BOARD_WIDTH - GOAL_WIDTH) / 2;
const GOAL_X_MAX = (BOARD_WIDTH + GOAL_WIDTH) / 2;

const VIEWBOX_STRING = `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`;

// Spatial Grid constants for physics optimization
const GRID_CELL_SIZE = KING_PUCK_RADIUS * 2.5; // A bit larger than the king diameter

// --- Geometry Helper Functions ---
const getVectorMagnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);
const getVectorMagnitudeSq = (v: Vector) => v.x * v.x + v.y * v.y;
const subtractVectors = (v1: Vector, v2: Vector) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

// Returns intersection point of seg 1 [a,b] and seg 2 [c,d]
const getLineIntersection = (a: Vector, b: Vector, c: Vector, d: Vector): Vector | null => {
    const s1_x = b.x - a.x;
    const s1_y = b.y - a.y;
    const s2_x = d.x - c.x;
    const s2_y = d.y - c.y;

    const s = (-s1_y * (a.x - c.x) + s1_x * (a.y - c.y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = ( s2_x * (a.y - c.y) - s2_y * (a.x - c.x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return { x: a.x + (t * s1_x), y: a.y + (t * s1_y) };
    }
    return null; // No collision
};

// Checks if a circular puck intersects a line segment.
const isPuckOnLineSegment = (puck: Puck, lineStart: Vector, lineEnd: Vector): boolean => {
    const { position: C, radius: r } = puck;
    const A = lineStart;
    const B = lineEnd;
    const AB = subtractVectors(B, A);
    const AC = subtractVectors(C, A);
    const lenSqAB = getVectorMagnitudeSq(AB);
    if (lenSqAB === 0) return getVectorMagnitudeSq(AC) < r * r;
    const t = Math.max(0, Math.min(1, (AC.x * AB.x + AC.y * AB.y) / lenSqAB));
    const closestPoint = { x: A.x + t * AB.x, y: A.y + t * AB.y };
    const distVec = subtractVectors(C, closestPoint);
    return getVectorMagnitudeSq(distVec) < r * r;
};

// --- NEW PERFORMANCE HELPER: Fast Voxel Traversal for Line Grid ---
const getCellsForSegment = (start: Vector, end: Vector): string[] => {
    const cells = new Set<string>();
    const x1 = start.x;
    const y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;

    let currentX = Math.floor(x1 / GRID_CELL_SIZE);
    let currentY = Math.floor(y1 / GRID_CELL_SIZE);
    const endX = Math.floor(x2 / GRID_CELL_SIZE);
    const endY = Math.floor(y2 / GRID_CELL_SIZE);
    
    cells.add(`${currentX},${currentY}`);

    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (dx === 0 && dy === 0) {
        return Array.from(cells);
    }

    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);

    const tDeltaX = dx === 0 ? Infinity : Math.abs(GRID_CELL_SIZE / dx);
    const tDeltaY = dy === 0 ? Infinity : Math.abs(GRID_CELL_SIZE / dy);

    let tMaxX = dx > 0 ? (GRID_CELL_SIZE * (currentX + 1) - x1) / dx : (GRID_CELL_SIZE * currentX - x1) / dx;
    if (dx === 0) tMaxX = Infinity;
    
    let tMaxY = dy > 0 ? (GRID_CELL_SIZE * (currentY + 1) - y1) / dy : (GRID_CELL_SIZE * currentY - y1) / dy;
    if (dy === 0) tMaxY = Infinity;

    while(currentX !== endX || currentY !== endY) {
        if(tMaxX < tMaxY) {
            tMaxX += tDeltaX;
            currentX += stepX;
        } else {
            tMaxY += tDeltaY;
            currentY += stepY;
        }
        cells.add(`${currentX},${currentY}`);
    }

    return Array.from(cells);
};
// --- End Geometry Helpers ---

// --- Combination Helper ---
const generateCombinations = <T>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    function combinationUtil(start: number, chosen: T[]) {
        if (chosen.length === size) {
            result.push([...chosen]);
            return;
        }
        for (let i = start; i < array.length; i++) {
            chosen.push(array[i]);
            combinationUtil(i + 1, chosen);
            chosen.pop();
        }
    }
    combinationUtil(0, []);
    return result;
};
// --- End Combination Helper ---

// Helper for creating a single puck
const createPuck = (id: number, team: Team, type: PuckType, position: Vector): Puck => {
    const properties = PUCK_TYPE_PROPERTIES[type];
    const newPuck: Puck = {
        id,
        team,
        puckType: type,
        position: { ...position },
        initialPosition: { ...position },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        mass: properties.mass,
        friction: properties.friction,
        radius: type === 'KING' ? KING_PUCK_RADIUS : (type === 'PAWN' ? PAWN_PUCK_RADIUS : PUCK_RADIUS),
        isCharged: false,
        elasticity: properties.elasticity,
        swerveFactor: properties.swerveFactor,
        temporaryEffects: [],
    };
    if (type === 'PAWN') {
        newPuck.durability = PAWN_DURABILITY;
    }
    return newPuck;
};

const createPucksFromConfig = (teamConfigs: TeamConfig[]): Puck[] => {
    let idCounter = 0;
    const pucks: Puck[] = [];

    teamConfigs.forEach(({ team, pucks: selectedPucks, strategicPlanName }) => {
        let strategicPlan = STRATEGIC_PLANS[team].find(p => p.name === strategicPlanName);
        if (!strategicPlan) {
            console.error(`Strategic plan ${strategicPlanName} not found for team ${team}, using fallback.`);
            strategicPlan = STRATEGIC_PLANS[team][0];
        }

        const { specialFormation, pawnFormation } = strategicPlan;

        pawnFormation.puckLayout.forEach(layout => {
            pucks.push(createPuck(idCounter++, team, 'PAWN', layout.position));
        });

        // Add the King in a fixed position
        const kingY = team === 'RED' ? BOARD_HEIGHT * 0.90 : BOARD_HEIGHT * 0.10;
        pucks.push(createPuck(idCounter++, team, 'KING', { x: BOARD_WIDTH / 2, y: kingY }));
        
        // Add the 7 selected special pucks based on the formation layout
        const layoutPositions = specialFormation.puckLayout;
        for (let i = 0; i < Math.min(selectedPucks.length, layoutPositions.length); i++) {
            const puckType = selectedPucks[i];
            const position = layoutPositions[i].position;
            pucks.push(createPuck(idCounter++, team, puckType, position));
        }
    });

    return pucks;
};


const createInitialGameState = (teamConfigs?: TeamConfig[]): GameState => {
  const initialOrb: Particle = {
    id: -1, // Special ID for a unique particle
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 16,
    color: TEAM_COLORS.BLUE,
    opacity: 1,
    life: Infinity,
    lifeSpan: Infinity,
    decay: 0,
    renderType: 'orbiting',
    progress: 0,
    speed: 0.001,
  };

  return {
    pucks: teamConfigs ? createPucksFromConfig(teamConfigs) : [],
    particles: [],
    orbitingParticles: [initialOrb],
    floatingTexts: [],
    currentTurn: 'BLUE',
    winner: null,
    isSimulating: false,
    canShoot: true,
    selectedPuckId: null,
    infoCardPuckId: null,
    shotPreview: null,
    imaginaryLine: null,
    pucksShotThisTurn: [],
    viewBox: VIEWBOX_STRING,
    isCameraInTensionMode: false,
    pulsarPower: { RED: 0, BLUE: 0 },
    specialShotStatus: { RED: 'NONE', BLUE: 'NONE' },
    pulsarShotArmed: null,
    score: { RED: 0, BLUE: 0 },
    goalScoredInfo: null,
    gameMessage: null,
    bonusTurnForTeam: null,
    screenShake: 0,
    previewState: null,
    lastShotWasSpecial: 'NONE',
    orbHitsThisShot: 0,
    turnLossReason: null,
    turnCount: 0,
    orbCollection: { RED: 0, BLUE: 0 },
    overchargedTeam: null,
  };
};

// Helper function to calculate valid, unobstructed lines for a given puck
const calculatePotentialLines = (puckId: number, allPucks: Puck[]): ImaginaryLine[] => {
    const puck = allPucks.find(p => p.id === puckId);
    if (!puck) return [];

    const allPotentialLines: ImaginaryLine[] = [];
    const teamPucks = allPucks.filter(p => p.team === puck.team && p.id !== puck.id);
    const ghostPucks = allPucks.filter(p => p.team === puck.team && p.puckType === 'GHOST');
    const selectedPuckType = puck.puckType;
    
    const isSpecialForSynergy = (p: Puck) => p.puckType !== 'PAWN';
    const isSpecialForPawnCharging = (p: Puck) => p.puckType !== 'PAWN';


    const lineSources: Puck[][] = [];
    if (selectedPuckType === 'PAWN') {
        const pawns = teamPucks.filter(p => p.puckType === 'PAWN');
        const specials = teamPucks.filter(isSpecialForPawnCharging);
        // Pawn-Pawn lines
        if (pawns.length >= 2) lineSources.push(...generateCombinations(pawns, 2));
        // Pawn-Special lines
        if (pawns.length > 0 && specials.length > 0) {
            for (const pawn of pawns) {
                for (const special of specials) {
                    lineSources.push([pawn, special]);
                }
            }
        }
    } else if (selectedPuckType === 'KING') {
        const pawns = teamPucks.filter(p => p.puckType === 'PAWN');
        if (pawns.length >= 2) lineSources.push(...generateCombinations(pawns, 2));
        const specials = teamPucks.filter(isSpecialForSynergy);
        if (specials.length >= 2) lineSources.push(...generateCombinations(specials, 2));
    } else { // Special puck
        const specials = teamPucks.filter(isSpecialForSynergy);
        if (specials.length >= 2) lineSources.push(...generateCombinations(specials, 2));
    }
    
    lineSources.forEach(pair => {
        const line = { start: pair[0].position, end: pair[1].position };
        const sourceIds = new Set([pair[0].id, pair[1].id]);
        const isObstructed = allPucks.some(p => 
            !sourceIds.has(p.id) &&
            isPuckOnLineSegment(p, line.start, line.end)
        );
        if (!isObstructed) {
            const puckTypes = [pair[0].puckType, pair[1].puckType].sort();
            const synergyKey = `${puckTypes[0]}-${puckTypes[1]}`;
            const synergyType = SYNERGY_COMBOS[synergyKey] || null;
            
            // Check for passive Ghost phasing
            const passivelyCrossedBy = new Set<number>();
            ghostPucks.forEach(gp => {
                if (!sourceIds.has(gp.id) && isPuckOnLineSegment(gp, line.start, line.end)) {
                    passivelyCrossedBy.add(gp.id);
                }
            });

            allPotentialLines.push({ ...line, sourcePuckIds: [pair[0].id, pair[1].id], synergyType, passivelyCrossedBy });
        }
    });
    return allPotentialLines;
};

// --- PREVIEW SIMULATION ---
const runPreviewSimulation = (initialPucks: Puck[], shotPuckId: number, shotVector: Vector): { trajectories: PuckTrajectory[] } => {
    // Deep copy pucks to avoid mutating real state
    let simPucks = JSON.parse(JSON.stringify(initialPucks)) as Puck[];
    const trajectories: Map<number, Vector[]> = new Map();

    // Apply initial shot
    const puckIndex = simPucks.findIndex(p => p.id === shotPuckId);
    if (puckIndex === -1) return { trajectories: [] };

    simPucks[puckIndex].velocity = {
        x: (shotVector.x * PREVIEW_SHOT_POWER) / simPucks[puckIndex].mass,
        y: (shotVector.y * PREVIEW_SHOT_POWER) / simPucks[puckIndex].mass,
    };
    
    const pucksInMotion = new Set<number>([shotPuckId]);

    // Simplified game loop
    for (let frame = 0; frame < PREVIEW_SIMULATION_FRAMES; frame++) {
        let hasMotion = false;
        
        simPucks.forEach(puck => {
            if (getVectorMagnitudeSq(puck.velocity) > 0) {
                puck.position.x += puck.velocity.x;
                puck.position.y += puck.velocity.y;
                puck.velocity.x *= puck.friction;
                puck.velocity.y *= puck.friction;
                
                if (getVectorMagnitudeSq(puck.velocity) < MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP) {
                    puck.velocity = { x: 0, y: 0 };
                } else {
                    hasMotion = true;
                    if (pucksInMotion.has(puck.id)) {
                       const path = trajectories.get(puck.id) || [];
                       path.push({ ...puck.position });
                       trajectories.set(puck.id, path);
                    }
                }
            }
        });

        if (!hasMotion) break; // End simulation early if everything stopped

        // Simplified collision handling
        for (let i = 0; i < simPucks.length; i++) {
            const puck = simPucks[i];
            
            // Wall collisions
            if (puck.position.x - puck.radius < 0) {
                puck.position.x = puck.radius;
                puck.velocity.x *= -1;
            } else if (puck.position.x + puck.radius > BOARD_WIDTH) {
                puck.position.x = BOARD_WIDTH - puck.radius;
                puck.velocity.x *= -1;
            }
            if (puck.position.y - puck.radius < 0 && (puck.position.x < GOAL_X_MIN || puck.position.x > GOAL_X_MAX)) {
                puck.position.y = puck.radius;
                puck.velocity.y *= -1;
            } else if (puck.position.y + puck.radius > BOARD_HEIGHT && (puck.position.x < GOAL_X_MIN || puck.position.x > GOAL_X_MAX)) {
                puck.position.y = BOARD_HEIGHT - puck.radius;
                puck.velocity.y *= -1;
            }

            // Puck-puck collisions
            for (let j = i + 1; j < simPucks.length; j++) {
                const otherPuck = simPucks[j];
                const distVec = subtractVectors(otherPuck.position, puck.position);
                const distance = getVectorMagnitude(distVec);
                const collisionDistance = puck.radius + otherPuck.radius;

                if (distance < collisionDistance) {
                    pucksInMotion.add(puck.id);
                    pucksInMotion.add(otherPuck.id);

                    const overlap = (collisionDistance - distance) / 2;
                    const overlapVec = { x: (distVec.x / distance) * overlap, y: (distVec.y / distance) * overlap };
                    puck.position.x -= overlapVec.x; puck.position.y -= overlapVec.y;
                    otherPuck.position.x += overlapVec.x; otherPuck.position.y += overlapVec.y;
                    const normal = { x: distVec.x / distance, y: distVec.y / distance };
                    const tangent = { x: -normal.y, y: normal.x };
                    const dpTan1 = puck.velocity.x * tangent.x + puck.velocity.y * tangent.y;
                    const dpTan2 = otherPuck.velocity.x * tangent.x + otherPuck.velocity.y * tangent.y;
                    const dpNorm1 = puck.velocity.x * normal.x + puck.velocity.y * normal.y;
                    const dpNorm2 = otherPuck.velocity.x * normal.x + otherPuck.velocity.y * normal.y;
                    const m1 = puck.mass; const m2 = otherPuck.mass;
                    const restitution = ((puck.elasticity ?? 1) + (otherPuck.elasticity ?? 1)) / 2;
                    const newDpNorm1 = (dpNorm1 * (m1 - restitution * m2) + (1 + restitution) * m2 * dpNorm2) / (m1 + m2);
                    const newDpNorm2 = (dpNorm2 * (m2 - restitution * m1) + (1 + restitution) * m1 * dpNorm1) / (m1 + m2);
                    puck.velocity.x = tangent.x * dpTan1 + normal.x * newDpNorm1;
                    puck.velocity.y = tangent.y * dpTan1 + normal.y * newDpNorm1;
                    otherPuck.velocity.x = tangent.x * dpTan2 + normal.x * newDpNorm2;
                    otherPuck.velocity.y = tangent.y * dpTan2 + normal.y * newDpNorm2;
                }
            }
        }
    }

    const finalTrajectories: PuckTrajectory[] = [];
    trajectories.forEach((path, puckId) => {
        if (path.length > 1) { // Only include pucks that actually moved
            finalTrajectories.push({ puckId, path });
        }
    });

    return { trajectories: finalTrajectories };
};

type UseGameEngineProps = {
    playSound: (soundName: string, options?: { volume?: number; throttleMs?: number }) => void;
};

const checkWinner = (score: { RED: number; BLUE: number }): Team | null => {
  const blueScore = score.BLUE;
  const redScore = score.RED;
  const winThreshold = SCORE_TO_WIN - 1;

  if (blueScore >= winThreshold && redScore >= winThreshold) {
    if (blueScore >= redScore + 2) {
      return 'BLUE';
    }
    if (redScore >= blueScore + 2) {
      return 'RED';
    }
  } else {
    if (blueScore >= SCORE_TO_WIN) {
      return 'BLUE';
    }
    if (redScore >= SCORE_TO_WIN) {
      return 'RED';
    }
  }
  
  return null;
};

const checkSpecialShotStatus = (team: Team, allPucks: Puck[]): SpecialShotStatus => {
    const teamPucks = allPucks.filter(p => p.team === team);
    const specialPucks = teamPucks.filter(p => SPECIAL_PUCKS_FOR_ROYAL_SHOT.includes(p.puckType));
    const pawns = teamPucks.filter(p => p.puckType === 'PAWN');

    if (specialPucks.length === 0 || !specialPucks.every(p => p.isCharged)) {
        return 'NONE';
    }

    const allPawnsCharged = pawns.length > 0 && pawns.every(p => p.isCharged);

    if (allPawnsCharged) {
        return 'ULTIMATE';
    }

    return 'ROYAL';
};


export const useGameEngine = ({ playSound }: UseGameEngineProps) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [aiTeam, setAiTeam] = useState<Team | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const ambientAnimationFrameId = useRef<number | null>(null);
  const particleIdCounter = useRef(0);
  const particlePool = useRef<Particle[]>([]);
  const floatingTextIdCounter = useRef(0);
  const roundEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{ mouseDownPuckId: number | null, isDragging: boolean, startPos: Vector | null }>({ mouseDownPuckId: null, isDragging: false, startPos: null });
  const inactivityStateRef = useRef<{ timeout: ReturnType<typeof setTimeout> | null; interval: ReturnType<typeof setInterval> | null }>({ timeout: null, interval: null });
  const synergyHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHighlightedLineIndexRef = useRef<number | null>(null);
  const gameMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineGridRef = useRef<Map<string, number[]> | null>(null);

  const startGame = useCallback((teamConfigs: TeamConfig[], aiTeamToControl?: Team) => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (ambientAnimationFrameId.current) cancelAnimationFrame(ambientAnimationFrameId.current);
    setGameState(createInitialGameState(teamConfigs));
    setAiTeam(aiTeamToControl || null);
  }, []);

  const cancelActiveSynergy = useCallback((pucks: Puck[], puckId: number | null): Puck[] => {
    if (puckId === null) return pucks;

    const puckIndex = pucks.findIndex(p => p.id === puckId);
    if (puckIndex === -1) return pucks;

    const puckToRevert = pucks[puckIndex];
    if (puckToRevert.activeSynergy) {
        const newPucks = [...pucks];
        const revertedPuck = { ...puckToRevert };
        const initialStats = revertedPuck.activeSynergy.initialStats;
        revertedPuck.mass = initialStats.mass;
        revertedPuck.friction = initialStats.friction;
        revertedPuck.elasticity = initialStats.elasticity;
        revertedPuck.swerveFactor = initialStats.swerveFactor;
        delete revertedPuck.activeSynergy;
        delete revertedPuck.synergyEffectTriggered;
        
        newPucks[puckIndex] = revertedPuck;
        return newPucks;
    }

    return pucks;
  }, []);
  
  const setGameMessageWithTimeout = useCallback((text: string, type: 'royal' | 'ultimate' | 'synergy' | 'powerup', duration: number = 3000, synergyType?: SynergyType) => {
      if (gameMessageTimeoutRef.current) {
          clearTimeout(gameMessageTimeoutRef.current);
      }
      setGameState(prev => ({...prev, gameMessage: { text, type, synergyType, id: Date.now() }}));
      gameMessageTimeoutRef.current = setTimeout(() => {
          setGameState(prev => ({...prev, gameMessage: null}));
      }, duration);
  }, []);

  const clearSynergyHoldTimer = useCallback(() => {
    if (synergyHoldTimerRef.current) {
        clearTimeout(synergyHoldTimerRef.current);
        synergyHoldTimerRef.current = null;
    }
    lastHighlightedLineIndexRef.current = null;
  }, []);

  const clearInfoCardTimer = useCallback(() => {
    if (infoCardTimerRef.current) {
        clearTimeout(infoCardTimerRef.current);
        infoCardTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
        clearSynergyHoldTimer();
        clearInfoCardTimer();
        if (gameMessageTimeoutRef.current) clearTimeout(gameMessageTimeoutRef.current);
    };
  }, [clearSynergyHoldTimer, clearInfoCardTimer]);

  const resetGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setGameState(createInitialGameState());
  }, []);
  
  const clearTurnLossReason = useCallback(() => {
    setGameState(prev => ({ ...prev, turnLossReason: null }));
  }, []);

  const clearBonusTurn = useCallback(() => {
    setGameState(prev => {
      if (prev.bonusTurnForTeam) {
        return { ...prev, bonusTurnForTeam: null };
      }
      return prev;
    });
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (prev.isSimulating && animationFrameId.current === null) {
      } else if (!prev.isSimulating) {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        return prev;
      }

      let newPucks = [...prev.pucks.map(p => ({ ...p, position: { ...p.position }, velocity: { ...p.velocity }, temporaryEffects: [...p.temporaryEffects] }))];
      let newParticles = [...prev.particles];
      let newFloatingTexts = [...prev.floatingTexts];
      let newImaginaryLine = prev.imaginaryLine ? { ...prev.imaginaryLine, crossedLineIndices: new Set(prev.imaginaryLine.crossedLineIndices), pawnPawnLinesCrossed: new Set(prev.imaginaryLine.pawnPawnLinesCrossed), pawnSpecialLinesCrossed: new Set(prev.imaginaryLine.pawnSpecialLinesCrossed) } : null;
      let newCanShoot = prev.canShoot;
      let newIsCameraInTensionMode = prev.isCameraInTensionMode;
      let newPulsarPower = { ...prev.pulsarPower };
      let newSpecialShotStatus = { ...prev.specialShotStatus };
      let newOrbitingParticles = [...prev.orbitingParticles.map(p => ({...p}))];
      let newOrbHitsThisShot = prev.orbHitsThisShot;
      let newOrbCollection = { ...prev.orbCollection };
      let newOverchargedTeam = prev.overchargedTeam;
      let newScreenShake = prev.screenShake > 0 ? prev.screenShake - 1 : 0;
      let newGameMessage = prev.gameMessage;
      let newSelectedPuckId = prev.selectedPuckId;
      let newInfoCardPuckId = prev.infoCardPuckId;
      
      let roundWinner: Team | null = null;
      let scoringPuck: Puck | null = null;
      let turnLossReason: TurnLossReason | null = null;
      const puckIdsToDestroy = new Set<number>();

      const spawnParticle = (particlesArray: Particle[], props: Omit<Particle, 'id' | 'lifeSpan'> & { life: number }) => {
          const p = particlePool.current.pop();
          const finalProps = { ...props, lifeSpan: props.life };
          if (p) {
              Object.assign(p, finalProps, { id: particleIdCounter.current++ });
              particlesArray.push(p);
          } else {
              particlesArray.push({
                  ...finalProps,
                  id: particleIdCounter.current++,
              } as Particle);
          }
      };

      newOrbitingParticles.forEach(orb => {
        if (orb.progress !== undefined && orb.speed !== undefined) {
          orb.progress = (orb.progress + orb.speed) % 1;
          const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
          const p = orb.progress * totalPerimeter;

          if (p < BOARD_WIDTH) {
              orb.position = { x: p, y: 0 };
          } else if (p < BOARD_WIDTH + BOARD_HEIGHT) {
              orb.position = { x: BOARD_WIDTH, y: p - BOARD_WIDTH };
          } else if (p < 2 * BOARD_WIDTH + BOARD_HEIGHT) {
              orb.position = { x: BOARD_WIDTH - (p - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT };
          } else {
              orb.position = { x: 0, y: BOARD_HEIGHT - (p - (2 * BOARD_WIDTH + BOARD_HEIGHT)) };
          }
        }
      });
      
      if (prev.currentTurn === prev.overchargedTeam) {
        const overchargedPucks = newPucks.filter(p => p.team === prev.overchargedTeam);
        overchargedPucks.forEach(puck => {
            newPucks.forEach(otherPuck => {
                if (otherPuck.team !== puck.team) {
                    const distVec = subtractVectors(otherPuck.position, puck.position);
                    const distSq = getVectorMagnitudeSq(distVec);
                    if (distSq > 0 && distSq < OVERCHARGE_REPULSOR_RADIUS * OVERCHARGE_REPULSOR_RADIUS) {
                        const distance = Math.sqrt(distSq);
                        const force = (1 - (distance / OVERCHARGE_REPULSOR_RADIUS)) * OVERCHARGE_REPULSOR_FORCE;
                        const pushVec = { x: (distVec.x / distance) * force, y: (distVec.y / distance) * force };
                        otherPuck.velocity.x += pushVec.x / otherPuck.mass;
                        otherPuck.velocity.y += pushVec.y / otherPuck.mass;
                    }
                }
            });
            if (Math.random() < 0.1) {
                const config = PARTICLE_CONFIG.OVERCHARGE_AURA;
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: 0, y: 0 },
                    radius: puck.radius,
                    color: TEAM_COLORS[puck.team],
                    opacity: 0.8,
                    life: config.life, decay: config.decay,
                    renderType: 'repulsor_aura',
                });
            }
        });
      }

      // --- Process & Apply Temporary Effects ---
      newPucks.forEach(puck => {
          puck.temporaryEffects = puck.temporaryEffects.filter(effect => {
              if (effect.type === 'EMP_BURST') {
                  newPucks.forEach(otherPuck => {
                      if (otherPuck.team !== puck.team) {
                          const distVec = subtractVectors(otherPuck.position, puck.position);
                          const distSq = getVectorMagnitudeSq(distVec);
                          if (distSq > 0 && distSq < EMP_BURST_RADIUS * EMP_BURST_RADIUS) {
                              const distance = Math.sqrt(distSq);
                              const pushVec = { x: (distVec.x / distance) * EMP_BURST_FORCE, y: (distVec.y / distance) * EMP_BURST_FORCE };
                              otherPuck.velocity.x += pushVec.x / otherPuck.mass;
                              otherPuck.velocity.y += pushVec.y / otherPuck.mass;
                          }
                      }
                  });
                  const config = PARTICLE_CONFIG.EMP_BURST;
                  spawnParticle(newParticles, {
                      position: { ...puck.position },
                      velocity: { x: 0, y: 0 },
                      radius: 1,
                      color: TEAM_COLORS[puck.team] === TEAM_COLORS.BLUE ? '#60a5fa' : '#f87171',
                      opacity: 1,
                      life: config.life,
                      decay: config.decay,
                      renderType: 'emp_burst',
                  });
                  return false; // one-time effect
              }

              if (effect.type === 'REPULSOR_ARMOR') {
                newPucks.forEach(otherPuck => {
                    if (otherPuck.id !== puck.id && otherPuck.team !== puck.team) {
                        const distVec = subtractVectors(otherPuck.position, puck.position);
                        const distSq = getVectorMagnitudeSq(distVec);
                        if (distSq > 0 && distSq < REPULSOR_ARMOR_RADIUS * REPULSOR_ARMOR_RADIUS) {
                            const distance = Math.sqrt(distSq);
                            const force = (1 - (distance / REPULSOR_ARMOR_RADIUS)) * REPULSOR_ARMOR_FORCE;
                            const pushVec = { x: (distVec.x / distance) * force, y: (distVec.y / distance) * force };
                            otherPuck.velocity.x += pushVec.x / otherPuck.mass;
                            otherPuck.velocity.y += pushVec.y / otherPuck.mass;
                        }
                    }
                });
                if (Math.random() < 0.08) {
                    const config = PARTICLE_CONFIG.REPULSOR_AURA;
                    spawnParticle(newParticles, {
                        position: { ...puck.position },
                        velocity: { x: 0, y: 0 },
                        radius: puck.radius,
                        color: SYNERGY_EFFECTS.REPULSOR_ARMOR.color,
                        opacity: 0.8,
                        life: config.life, decay: config.decay,
                        renderType: 'repulsor_aura',
                    });
                }
              }

              effect.duration--;
              
              if (effect.duration <= 0 && effect.type === 'NEUTRALIZED' && effect.originalStats) {
                    const { mass, friction, elasticity, swerveFactor, puckType } = effect.originalStats;
                    puck.mass = mass;
                    puck.friction = friction;
                    puck.elasticity = elasticity;
                    puck.swerveFactor = swerveFactor;
                    puck.puckType = puckType;
              }

              return effect.duration > 0;
          });
      });
      
        // --- AURA EFFECTS ---
        const seers = newPucks.filter(p => p.puckType === 'SEER');
        const orbiters = newPucks.filter(p => p.puckType === 'ORBITER');
        const stationaryTrappers = newPucks.filter(p => p.puckType === 'TRAPPER' && getVectorMagnitudeSq(p.velocity) < MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP);
        
        if (seers.length > 0 || orbiters.length > 0 || stationaryTrappers.length > 0) {
            newPucks.forEach(puck => {
                // SEER AURA
                if (puck.puckType === 'GHOST' && seers.some(seer => seer.team !== puck.team && getVectorMagnitudeSq(subtractVectors(puck.position, seer.position)) < SEER_AURA_RADIUS * SEER_AURA_RADIUS)) {
                    puck.temporaryEffects = puck.temporaryEffects.filter(e => e.type !== 'PHASED');
                }
                
                // ORBITER AURA
                orbiters.forEach(orbiter => {
                    if (puck.team !== orbiter.team) {
                        const distVec = subtractVectors(orbiter.position, puck.position);
                        const distSq = getVectorMagnitudeSq(distVec);
                        if (distSq > 0 && distSq < ORBITER_AURA_RADIUS * ORBITER_AURA_RADIUS) {
                            const dist = Math.sqrt(distSq);
                            const force = (1 - (dist / ORBITER_AURA_RADIUS)) * ORBITER_AURA_FORCE;
                            const pullVec = { x: (distVec.x / dist) * force, y: (distVec.y / dist) * force };
                            puck.velocity.x += pullVec.x / puck.mass;
                            puck.velocity.y += pullVec.y / puck.mass;
                        }
                    }
                });

                // TRAPPER AURA
                stationaryTrappers.forEach(trapper => {
                    if (puck.team !== trapper.team && getVectorMagnitudeSq(subtractVectors(puck.position, trapper.position)) < TRAPPER_AURA_RADIUS * TRAPPER_AURA_RADIUS) {
                        puck.velocity.x *= TRAPPER_DAMPENING_FACTOR;
                        puck.velocity.y *= TRAPPER_DAMPENING_FACTOR;
                    }
                });
            });
        }


      // --- Update Particles (Recycle with Pooling) ---
      const activeParticles: Particle[] = [];
      for (const p of newParticles) {
          p.life -= 1;
          p.opacity -= p.decay;
          if (p.life > 0 && p.opacity > 0) {
              p.position.x += p.velocity.x;
              p.position.y += p.velocity.y;
              p.velocity.x *= 0.98;
              p.velocity.y *= 0.98;
              activeParticles.push(p);
          } else {
              particlePool.current.push(p); // Return to pool
          }
      }
      newParticles = activeParticles;

      // --- Update Floating Texts ---
      newFloatingTexts = newFloatingTexts.map(ft => ({
          ...ft,
          position: { x: ft.position.x + ft.velocity.x, y: ft.position.y + ft.velocity.y },
          life: ft.life - 1,
          opacity: ft.opacity - ft.decay,
      })).filter(ft => ft.life > 0 && ft.opacity > 0);

      // --- Update Pucks ---
      let fastestPuckSpeedSq = 0;
      newPucks.forEach(puck => {
        let vSq = getVectorMagnitudeSq(puck.velocity);
        if (vSq > 0) {
          const travelDistance = getVectorMagnitude(puck.velocity);
          puck.rotation = (puck.rotation || 0) + travelDistance * 0.5;
          if (puck.distanceTraveledThisShot !== undefined) {
             puck.distanceTraveledThisShot += travelDistance;
          }


          puck.position.x += puck.velocity.x;
          puck.position.y += puck.velocity.y;
          puck.velocity.x *= puck.friction;
          puck.velocity.y *= puck.friction;
          
           if (puck.puckType === 'PHANTOM' && puck.distanceTraveledThisShot && puck.distanceTraveledThisShot > PHANTOM_TELEPORT_TRIGGER_DISTANCE && puck.collisionsThisShot === 0) {
                const velMag = getVectorMagnitude(puck.velocity);
                if (velMag > 0) {
                    const teleportVec = { x: (puck.velocity.x / velMag) * PHANTOM_TELEPORT_DISTANCE, y: (puck.velocity.y / velMag) * PHANTOM_TELEPORT_DISTANCE };
                    
                    const outConfig = PARTICLE_CONFIG.TELEPORT_OUT;
                    for (let k = 0; k < outConfig.count; k++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const speed = outConfig.minSpeed + Math.random() * (outConfig.maxSpeed - outConfig.minSpeed);
                        spawnParticle(newParticles, { position: { ...puck.position }, velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, radius: 2, color: TEAM_COLORS[puck.team], opacity: 1, life: outConfig.life, decay: outConfig.decay });
                    }
                    
                    puck.position.x += teleportVec.x;
                    puck.position.y += teleportVec.y;
                    puck.distanceTraveledThisShot = -1; // Prevent re-triggering

                    const inConfig = PARTICLE_CONFIG.TELEPORT_IN;
                    for (let k = 0; k < inConfig.count; k++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const speed = inConfig.minSpeed + Math.random() * (inConfig.maxSpeed - inConfig.minSpeed);
                        spawnParticle(newParticles, { position: { ...puck.position }, velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, radius: 2, color: TEAM_COLORS[puck.team], opacity: 1, life: inConfig.life, decay: inConfig.decay });
                    }
                }
            }


          vSq = getVectorMagnitudeSq(puck.velocity); // Recalculate after friction

          if (puck.swerveFactor && vSq > (0.1 * 0.1)) {
            const velocityMagnitude = Math.sqrt(vSq);
            const perpVector = { x: -puck.velocity.y / velocityMagnitude, y: puck.velocity.x / velocityMagnitude };
            const swerveForce = { x: perpVector.x * puck.swerveFactor, y: perpVector.y * puck.swerveFactor };
            puck.velocity.x += swerveForce.x;
            puck.velocity.y += swerveForce.y;
          }
          
          if (vSq < MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP) {
            puck.velocity = { x: 0, y: 0 };
          } else {
            if (vSq > fastestPuckSpeedSq) {
              fastestPuckSpeedSq = vSq;
            }
            // OPTIMIZATION: Removed trail particles for performance
            const isRoyalRage = puck.temporaryEffects.some(e => e.type === 'ROYAL_RAGE');
            const isUltimateRage = puck.temporaryEffects.some(e => e.type === 'ULTIMATE_RAGE');

            if (isRoyalRage && Math.random() < 0.015) {
                const config = PARTICLE_CONFIG.ROYAL_AURA;
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: 0, y: 0 },
                    radius: puck.radius,
                    color: UI_COLORS.GOLD,
                    opacity: 0.8,
                    life: config.life, decay: config.decay,
                    renderType: 'royal_aura',
                });
            } else if (isUltimateRage && Math.random() < 0.025) {
                 const config = PARTICLE_CONFIG.ULTIMATE_AURA;
                 spawnParticle(newParticles, {
                     position: { ...puck.position },
                     velocity: { x: 0, y: 0 },
                     radius: puck.radius,
                     color: `hsl(${Date.now() / 10 % 360}, 100%, 70%)`,
                     opacity: 1.0,
                     life: config.life, decay: config.decay,
                     renderType: 'royal_aura',
                 });
            }
          }
        }
      });
      
      const orbIdsToDestroy = new Set<number>();
      newPucks.forEach(puck => {
        if (getVectorMagnitudeSq(puck.velocity) > 0) {
            newOrbitingParticles.forEach(orb => {
                if (orbIdsToDestroy.has(orb.id)) return;

                const distVec = subtractVectors(puck.position, orb.position);
                const distSq = getVectorMagnitudeSq(distVec);
                const collisionThreshold = puck.radius + orb.radius;
        
                if (distSq < collisionThreshold * collisionThreshold) {
                    playSound('ORBITING_HIT');
                    orbIdsToDestroy.add(orb.id);
                    newOrbHitsThisShot++;
    
                    const comboMultiplier = 1 + (newOrbHitsThisShot - 1) * 0.5;
                    let powerGained = Math.round(PULSAR_ORB_HIT_SCORE * comboMultiplier);
                    newPulsarPower[puck.team] = Math.min(MAX_PULSAR_POWER, newPulsarPower[puck.team] + powerGained);
                    
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: `+${powerGained}`,
                        position: { ...orb.position },
                        color: TEAM_COLORS[puck.team],
                        opacity: 1,
                        life: FLOATING_TEXT_CONFIG.LIFE,
                        decay: FLOATING_TEXT_CONFIG.DECAY,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED },
                    });
                    
                    if (newOrbHitsThisShot > 1) {
                         const comboText = `${['', 'DOBLE', 'TRIPLE', 'CUÁDRUPLE'][newOrbHitsThisShot-1] || 'MÚLTIPLE'} IMPACTO!`;
                         newFloatingTexts.push({
                            id: floatingTextIdCounter.current++,
                            text: comboText,
                            position: { x: orb.position.x, y: orb.position.y - 30 },
                            color: UI_COLORS.GOLD,
                            opacity: 1,
                            life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                            decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                            velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 1.2 },
                        });
                    }
        
                    const config = PARTICLE_CONFIG.PULSAR_ORB_HIT;
                    for (let k = 0; k < config.count; k++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
                        spawnParticle(newParticles, {
                            position: { ...orb.position },
                            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                            radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                            color: TEAM_COLORS[puck.team],
                            opacity: 0.9,
                            life: config.life,
                            decay: config.decay,
                        });
                    }
        
                    newOrbCollection[puck.team]++;
                    if (newOrbCollection[puck.team] >= ORBS_FOR_OVERCHARGE) {
                        newOverchargedTeam = puck.team;
                        newOrbCollection[puck.team] = 0; // Reset count
                        playSound('ROYAL_POWER_UNLOCKED');
                        setGameMessageWithTimeout('¡SOBRECARGA!', 'powerup', 3000);
                    }
        
                    const dist = Math.sqrt(distSq);
                    if (dist > 0) {
                        const pushForce = 0.8;
                        const pushVec = { x: (distVec.x / dist) * pushForce, y: (distVec.y / dist) * pushForce };
                        puck.velocity.x += pushVec.x / puck.mass;
                        puck.velocity.y += pushVec.y / puck.mass;
                    }
                }
            });
        }
      });

      if (orbIdsToDestroy.size > 0) {
        newOrbitingParticles = newOrbitingParticles.filter(orb => !orbIdsToDestroy.has(orb.id));
      }

      if (newImaginaryLine && newImaginaryLine.isConfirmed) {
        // --- MOBILE OPTIMIZATION ---
        // Instead of checking every moving puck against every line, we ONLY check the puck
        // that was actually shot. This is the primary mechanic for charging pucks and drastically
        // reduces the number of expensive intersection checks per frame, improving performance on mobile.
        const shotPuckId = newImaginaryLine.shotPuckId;
        const puckPrev = prev.pucks.find(p => p.id === shotPuckId);
        const puckNew = newPucks.find(p => p.id === shotPuckId);

        if (puckPrev && puckNew && getVectorMagnitudeSq(puckPrev.velocity) > (MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP)) {
            const movementSegmentStart = puckPrev.position;
            const movementSegmentEnd = puckNew.position;
            
            const candidateLineIndices = new Set<number>();
            const movementCells = getCellsForSegment(movementSegmentStart, movementSegmentEnd);
            const lineGrid = lineGridRef.current;
            if (lineGrid) {
                movementCells.forEach(key => {
                    if (lineGrid.has(key)) {
                        lineGrid.get(key)!.forEach(index => candidateLineIndices.add(index));
                    }
                });
            }

            candidateLineIndices.forEach(index => {
                if (!newImaginaryLine.crossedLineIndices.has(index)) {
                    const line = newImaginaryLine.lines[index];
                    const intersectionPoint = getLineIntersection(movementSegmentStart, movementSegmentEnd, line.start, line.end);
                    if (intersectionPoint) {
                        newImaginaryLine.crossedLineIndices.add(index);
                        
                        if (puckNew.puckType === 'PAWN' && puckNew.id === newImaginaryLine.shotPuckId) {
                            const sourcePuck1 = newPucks.find(p => p.id === line.sourcePuckIds[0]);
                            const sourcePuck2 = newPucks.find(p => p.id === line.sourcePuckIds[1]);

                            if (sourcePuck1 && sourcePuck2) {
                                const isSpecial = (p: Puck) => p.puckType !== 'PAWN';
                                const s1Type = sourcePuck1.puckType;
                                const s2Type = sourcePuck2.puckType;

                                if (s1Type === 'PAWN' && s2Type === 'PAWN') {
                                    newImaginaryLine.pawnPawnLinesCrossed.add(index);
                                } else if ((s1Type === 'PAWN' && isSpecial(sourcePuck2)) || (s2Type === 'PAWN' && isSpecial(sourcePuck1))) {
                                    newImaginaryLine.pawnSpecialLinesCrossed.add(index);
                                }
                            }
                        }

                        if (puckNew.puckType === 'HEAVY' || puckNew.puckType === 'ANCHOR' || puckNew.puckType === 'GUARD') {
                            puckNew.temporaryEffects.push({ type: 'EMP_BURST', duration: 1 });
                        }
                        if (puckNew.puckType === 'GHOST') {
                           puckNew.temporaryEffects.push({ type: 'PHASED', duration: GHOST_PHASE_DURATION / 3 });
                        }
                        if (puckNew.puckType === 'MENDER') {
                            newPucks.forEach(p => {
                                if (p.team === puckNew.team && p.puckType === 'PAWN' && p.durability && p.durability < PAWN_DURABILITY) {
                                    if (getVectorMagnitudeSq(subtractVectors(p.position, puckNew.position)) < MENDER_AURA_RADIUS * MENDER_AURA_RADIUS) {
                                        p.durability++;
                                    }
                                }
                            });
                        }

                        if (puckNew.id === newImaginaryLine.shotPuckId) {
                            newImaginaryLine.comboCount++;
                            let powerGained = PULSAR_POWER_PER_LINE;
                            let isPerfect = false;

                            const lineLengthSq = getVectorMagnitudeSq(subtractVectors(line.end, line.start));
                            const lineCenter = { x: (line.start.x + line.end.x) / 2, y: (line.start.y + line.end.y) / 2 };
                            const distToCenterSq = getVectorMagnitudeSq(subtractVectors(intersectionPoint, lineCenter));
                            if (distToCenterSq / lineLengthSq < PERFECT_CROSSING_THRESHOLD * PERFECT_CROSSING_THRESHOLD) {
                                powerGained += PERFECT_CROSSING_BONUS;
                                isPerfect = true;
                                playSound('LINE_CROSS_PERFECT');
                            } else {
                                playSound('LINE_CROSS');
                            }
                            if (line.synergyType) {
                                powerGained += SYNERGY_CROSSING_BONUS;
                            }
                            
                            const comboBonus = COMBO_BONUSES[newImaginaryLine.comboCount] || (newImaginaryLine.comboCount > 4 ? 2.0 : 1.0);
                            const finalPowerGained = Math.round(powerGained * comboBonus);
                            newPulsarPower[prev.currentTurn] = Math.min(MAX_PULSAR_POWER, newPulsarPower[prev.currentTurn] + finalPowerGained);
                            
                             const chargeConfig = PARTICLE_CONFIG.PULSAR_CHARGE;
                            const team = prev.currentTurn;
                            const targetY = team === 'BLUE' ? -PULSAR_BAR_HEIGHT : BOARD_HEIGHT + PULSAR_BAR_HEIGHT;
                            const numParticles = Math.min(1, Math.floor(finalPowerGained / 25));
                            for (let k = 0; k < numParticles; k++) {
                                const startPos = { ...intersectionPoint };
                                const endPos = { x: GOAL_X_MIN + Math.random() * GOAL_WIDTH, y: targetY };
                                const travelVec = subtractVectors(endPos, startPos);
                                const dist = getVectorMagnitude(travelVec);
                                const vel = { x: (travelVec.x / dist) * chargeConfig.speed, y: (travelVec.y / dist) * chargeConfig.speed };

                                spawnParticle(newParticles, {
                                    position: { x: startPos.x + (Math.random() - 0.5) * 40, y: startPos.y },
                                    velocity: vel,
                                    radius: chargeConfig.radius + Math.random(),
                                    color: TEAM_COLORS[team],
                                    opacity: 0.8,
                                    life: chargeConfig.life,
                                    decay: chargeConfig.decay,
                                });
                            }

                            let powerText = `+${finalPowerGained}`;
                            let textColor = '#a3e635'; // lime-400
                            if (isPerfect) {
                                powerText += ` ¡Perfecto!`;
                                textColor = '#fde047'; // yellow-300
                            }
                            if (line.synergyType) {
                                textColor = SYNERGY_EFFECTS[line.synergyType].color;
                            }
                    
                            newFloatingTexts.push({
                                id: floatingTextIdCounter.current++,
                                text: powerText,
                                position: { ...intersectionPoint },
                                color: textColor,
                                opacity: 1,
                                life: FLOATING_TEXT_CONFIG.LIFE,
                                decay: FLOATING_TEXT_CONFIG.DECAY,
                                velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED },
                            });
                    
                            if (newImaginaryLine.comboCount > 1) {
                                newFloatingTexts.push({
                                    id: floatingTextIdCounter.current++,
                                    text: `Combo x${newImaginaryLine.comboCount}`,
                                    position: { x: intersectionPoint.x, y: intersectionPoint.y + 20 },
                                    color: SHOCKWAVE_COLORS[newImaginaryLine.comboCount] || SHOCKWAVE_COLORS[4],
                                    opacity: 1,
                                    life: FLOATING_TEXT_CONFIG.LIFE,
                                    decay: FLOATING_TEXT_CONFIG.DECAY,
                                    velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED },
                                });
                            }

                            const config = PARTICLE_CONFIG.LINE_SHOCKWAVE;
                            spawnParticle(newParticles, {
                                  position: { ...intersectionPoint },
                                  velocity: { x: 0, y: 0 },
                                  radius: 1,
                                  color: SHOCKWAVE_COLORS[newImaginaryLine.comboCount] || SHOCKWAVE_COLORS[4],
                                  opacity: 1,
                                  life: config.life,
                                  decay: config.decay,
                                  renderType: 'shockwave',
                                  isPerfect: isPerfect,
                            });
                            let canBeCharged = false;
                            if (puckNew.puckType === 'PAWN') {
                                if (newImaginaryLine.pawnPawnLinesCrossed.size >= 1 && newImaginaryLine.pawnSpecialLinesCrossed.size >= 1) {
                                    canBeCharged = true;
                                }
                            } else {
                                const linesNeeded = PUCK_TYPE_PROPERTIES[puckNew.puckType].linesToCrossForBonus;
                                const crossedLinesCount = newImaginaryLine.crossedLineIndices.size;
                                if (crossedLinesCount >= linesNeeded) {
                                    canBeCharged = true;
                                }
                            }
                            
                            if (canBeCharged) {
                                if (!puckNew.isCharged) {
                                    puckNew.isCharged = true;
                                    playSound('BONUS_TURN');
                                    newFloatingTexts.push({
                                        id: floatingTextIdCounter.current++,
                                        text: '¡CARGADO!',
                                        position: { x: puckNew.position.x, y: puckNew.position.y - puckNew.radius },
                                        color: '#fde047',
                                        opacity: 1,
                                        life: FLOATING_TEXT_CONFIG.LIFE * 1.2,
                                        decay: FLOATING_TEXT_CONFIG.DECAY,
                                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.9 },
                                    });
                                    
                                    newCanShoot = true;

                                    const pucksForCheck = [...newPucks];
                                    const justChargedPuckIndex = pucksForCheck.findIndex(p => p.id === puckNew.id);
                                    if (justChargedPuckIndex !== -1) {
                                        pucksForCheck[justChargedPuckIndex].isCharged = true;
                                    }
                            
                                    const oldStatus = prev.specialShotStatus[puckNew.team];
                                    const newStatus = checkSpecialShotStatus(puckNew.team, pucksForCheck);

                                    if (newStatus !== oldStatus && newStatus !== 'NONE') {
                                        newSpecialShotStatus[puckNew.team] = newStatus;
                                        
                                        if (newStatus === 'ROYAL') playSound('ROYAL_POWER_UNLOCKED');
                                        if (newStatus === 'ULTIMATE') playSound('ULTIMATE_POWER_UNLOCKED');
                                        
                                        const king = pucksForCheck.find(p => p.puckType === 'KING' && p.team === puckNew.team);
                                        if (king) {
                                            const contributingPucks = pucksForCheck.filter(p => p.team === puckNew.team && p.isCharged && (SPECIAL_PUCKS_FOR_ROYAL_SHOT.includes(p.puckType) || (newStatus === 'ULTIMATE' && p.puckType === 'PAWN')));
                                            contributingPucks.forEach(contribPuck => {
                                                const beamConfig = PARTICLE_CONFIG.POWER_BEAM;
                                                const travelVec = subtractVectors(king.position, contribPuck.position);
                                                const dist = getVectorMagnitude(travelVec);
                                                if (dist === 0) return;
                                                const travelTime = dist / beamConfig.speed;

                                                const vel = { x: travelVec.x / travelTime, y: travelVec.y / travelTime };

                                                spawnParticle(newParticles, {
                                                    position: { ...contribPuck.position },
                                                    velocity: vel,
                                                    radius: 3,
                                                    color: UI_COLORS.GOLD,
                                                    opacity: 1,
                                                    life: travelTime,
                                                    decay: 0,
                                                    renderType: 'power_beam',
                                                });
                                            });
                                        }

                                        const messageType = newStatus.toLowerCase() as 'royal' | 'ultimate';
                                        const messageText = newStatus === 'ROYAL' ? '¡TIRO REAL DESBLOQUEADO!' : '¡TIRO DEFINITIVO!';
                                        setGameMessageWithTimeout(messageText, messageType, 3000);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
      }

      const puckMap = new Map(newPucks.map(p => [p.id, p]));
      
      const grid = new Map<string, number[]>();
      newPucks.forEach(puck => {
          const minCol = Math.floor((puck.position.x - puck.radius) / GRID_CELL_SIZE);
          const maxCol = Math.floor((puck.position.x + puck.radius) / GRID_CELL_SIZE);
          const minRow = Math.floor((puck.position.y - puck.radius) / GRID_CELL_SIZE);
          const maxRow = Math.floor((puck.position.y + puck.radius) / GRID_CELL_SIZE);

          for (let row = minRow; row <= maxRow; row++) {
              for (let col = minCol; col <= maxCol; col++) {
                  const key = `${col},${row}`;
                  if (!grid.has(key)) {
                      grid.set(key, []);
                  }
                  grid.get(key)!.push(puck.id);
              }
          }
      });
      
      for (let i = 0; i < newPucks.length; i++) {
        const puck = newPucks[i];
        
        const inGoalZoneX = puck.position.x > GOAL_X_MIN && puck.position.x < GOAL_X_MAX;
        let wallImpact = false;
        let impactVelocity = 0;

        if (puck.position.x - puck.radius < 0) {
            puck.position.x = puck.radius;
            impactVelocity = Math.abs(puck.velocity.x);
            puck.velocity.x *= -(puck.elasticity ?? 1);
            wallImpact = true;
        }
        else if (puck.position.x + puck.radius > BOARD_WIDTH) {
            puck.position.x = BOARD_WIDTH - puck.radius;
            impactVelocity = Math.abs(puck.velocity.x);
            puck.velocity.x *= -(puck.elasticity ?? 1);
            wallImpact = true;
        }

        if (puck.position.y - puck.radius < 0) {
            if (!inGoalZoneX) {
                puck.position.y = puck.radius;
                impactVelocity = Math.abs(puck.velocity.y);
                puck.velocity.y *= -(puck.elasticity ?? 1);
                wallImpact = true;
            }
        } else if (puck.position.y + puck.radius > BOARD_HEIGHT) {
            if (!inGoalZoneX) {
                puck.position.y = BOARD_HEIGHT - puck.radius;
                impactVelocity = Math.abs(puck.velocity.y);
                puck.velocity.y *= -(puck.elasticity ?? 1);
                wallImpact = true;
            }
        }
        
        if (wallImpact) {
            playSound('WALL_IMPACT', { volume: Math.min(1, 0.2 + impactVelocity / 10), throttleMs: 50 });
            const config = PARTICLE_CONFIG.WALL_IMPACT;
            const count = Math.min(5, 1 + Math.floor(impactVelocity * 0.5));
            for (let k = 0; k < count; k++) {
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                    radius: config.radius,
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 0.8,
                    life: config.life,
                    decay: config.decay,
                });
            }
            if (puck.puckType === 'PAWN' && puck.durability !== undefined && impactVelocity > 2.0) {
                puck.durability--;
            }
        }

        const minCol = Math.floor((puck.position.x - puck.radius) / GRID_CELL_SIZE);
        const maxCol = Math.floor((puck.position.x + puck.radius) / GRID_CELL_SIZE);
        const minRow = Math.floor((puck.position.y - puck.radius) / GRID_CELL_SIZE);
        const maxRow = Math.floor((puck.position.y + puck.radius) / GRID_CELL_SIZE);
        const potentialColliderIds = new Set<number>();

        for (let row = minRow - 1; row <= maxRow + 1; row++) {
            for (let col = minCol - 1; col <= maxCol + 1; col++) {
                const key = `${col},${row}`;
                if (grid.has(key)) {
                    grid.get(key)!.forEach(id => potentialColliderIds.add(id));
                }
            }
        }

        potentialColliderIds.forEach(otherPuckId => {
            if (otherPuckId <= puck.id) {
                return;
            }
            const otherPuck = puckMap.get(otherPuckId);
            if (!otherPuck) return;

            if (puckIdsToDestroy.has(puck.id) || puckIdsToDestroy.has(otherPuck.id)) {
              return;
            }
  
            let kingPuck: Puck | undefined;
            let targetPuck: Puck | undefined;
            let rageEffect: TemporaryEffect | undefined;
  
            if (puck.temporaryEffects.some(e => e.type === 'ROYAL_RAGE' || e.type === 'ULTIMATE_RAGE')) {
              kingPuck = puck;
              targetPuck = otherPuck;
              rageEffect = kingPuck.temporaryEffects.find(e => e.type === 'ROYAL_RAGE' || e.type === 'ULTIMATE_RAGE');
            } else if (otherPuck.temporaryEffects.some(e => e.type === 'ROYAL_RAGE' || e.type === 'ULTIMATE_RAGE')) {
              kingPuck = otherPuck;
              targetPuck = puck;
              rageEffect = kingPuck.temporaryEffects.find(e => e.type === 'ROYAL_RAGE' || e.type === 'ULTIMATE_RAGE');
            }
            
            if (kingPuck && targetPuck && rageEffect && kingPuck.team !== targetPuck.team) {
              const destroyLimit = rageEffect.type === 'ROYAL_RAGE' ? ROYAL_SHOT_DESTROY_LIMIT : ULTIMATE_SHOT_DESTROY_LIMIT;
              const distVec = subtractVectors(targetPuck.position, kingPuck.position);
              const distance = getVectorMagnitude(distVec);
              const collisionDistance = kingPuck.radius + targetPuck.radius;
  
              if (distance < collisionDistance && rageEffect.destroyedCount !== undefined && rageEffect.destroyedCount < destroyLimit) {
                rageEffect.destroyedCount++;
                puckIdsToDestroy.add(targetPuck.id);
  
                playSound('PAWN_SHATTER');
                const config = PARTICLE_CONFIG.PAWN_SHATTER;
                const explosionColor = rageEffect.type === 'ROYAL_RAGE' ? UI_COLORS.GOLD : TEAM_COLORS[kingPuck.team];
                for (let k = 0; k < config.count * 2; k++) {
                  const angle = Math.random() * 2 * Math.PI;
                  const speed = (config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed)) * 1.5;
                  spawnParticle(newParticles, {
                    position: { ...targetPuck.position },
                    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                    color: explosionColor,
                    opacity: 0.9,
                    life: config.life,
                    decay: config.decay,
                  });
                }
                spawnParticle(newParticles, {
                    position: { ...targetPuck.position },
                    velocity: {x: 0, y: 0},
                    radius: 1,
                    color: explosionColor,
                    opacity: 1,
                    life: 30,
                    decay: 0.033,
                    renderType: 'ring'
                });
  
                return; // Skip normal collision physics
              }
            }
  
            const isPhased = puck.temporaryEffects.some(e => e.type === 'PHASED') || otherPuck.temporaryEffects.some(e => e.type === 'PHASED');
            if (isPhased) {
                return;
            }
  
            const distVec = subtractVectors(otherPuck.position, puck.position);
            const distance = getVectorMagnitude(distVec);
            const collisionDistance = puck.radius + otherPuck.radius;
  
            if (distance < collisionDistance) {
                if(puck.collisionsThisShot !== undefined) puck.collisionsThisShot++;
                if(otherPuck.collisionsThisShot !== undefined) otherPuck.collisionsThisShot++;

              const impactPoint = {
                  x: puck.position.x + (distVec.x / 2),
                  y: puck.position.y + (distVec.y / 2),
              };
  
              let synergyPuck: Puck | null = null;
              let targetForSynergy: Puck | null = null;
              if (puck.activeSynergy && puck.synergyEffectTriggered === false) {
                  synergyPuck = puck;
                  targetForSynergy = otherPuck;
              } else if (otherPuck.activeSynergy && otherPuck.synergyEffectTriggered === false) {
                  synergyPuck = otherPuck;
                  targetForSynergy = puck;
              }
  
              if (synergyPuck && targetForSynergy) {
                  const synergyType = synergyPuck.activeSynergy!.type;
                  if (synergyType === 'GRAVITY_WELL') {
                      synergyPuck.synergyEffectTriggered = true;
                      const config = PARTICLE_CONFIG.GRAVITY_WELL;
                      const color = SYNERGY_EFFECTS.GRAVITY_WELL.color;
                      for(let k = 0; k < config.count; k++) {
                          spawnParticle(newParticles, {
                              position: { ...impactPoint },
                              velocity: { x: 0, y: 0 },
                              radius: config.radius,
                              color: color,
                              opacity: 0.9,
                              life: config.life, decay: config.decay,
                              renderType: 'gravity_well',
                          });
                      }
                      newPucks.forEach(p => {
                          if (p.id !== synergyPuck!.id && p.team !== synergyPuck!.team) {
                              const pullVec = subtractVectors(impactPoint, p.position);
                              const distSq = getVectorMagnitudeSq(pullVec);
                              if (distSq > 0 && distSq < GRAVITY_WELL_RADIUS * GRAVITY_WELL_RADIUS) {
                                  const dist = Math.sqrt(distSq);
                                  const force = (1 - (dist / GRAVITY_WELL_RADIUS)) * GRAVITY_WELL_FORCE;
                                  const pullForce = { x: (pullVec.x / dist) * force, y: (pullVec.y / dist) * force };
                                  p.velocity.x += pullForce.x / p.mass;
                                  p.velocity.y += pullForce.y / p.mass;
                              }
                          }
                      });
  
                  } else if (synergyType === 'TELEPORT_STRIKE') {
                      synergyPuck.synergyEffectTriggered = true;
                      const color = SYNERGY_EFFECTS.TELEPORT_STRIKE.color;
                      const teleportVec = subtractVectors(targetForSynergy.position, synergyPuck.position);
                      const teleportDist = getVectorMagnitude(teleportVec);
                      if (teleportDist > 0) {
                          const normal = { x: teleportVec.x / teleportDist, y: teleportVec.y / teleportDist };
                          const newPosition = {
                              x: targetForSynergy.position.x + normal.x * (targetForSynergy.radius + synergyPuck.radius + TELEPORT_STRIKE_DISTANCE),
                              y: targetForSynergy.position.y + normal.y * (targetForSynergy.radius + synergyPuck.radius + TELEPORT_STRIKE_DISTANCE),
                          };
  
                          const outConfig = PARTICLE_CONFIG.TELEPORT_OUT;
                          for (let k = 0; k < outConfig.count; k++) {
                              const angle = Math.random() * 2 * Math.PI;
                              const speed = outConfig.minSpeed + Math.random() * (outConfig.maxSpeed - outConfig.minSpeed);
                              spawnParticle(newParticles, { position: { ...synergyPuck.position },
                                  velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                                  radius: 2, color, opacity: 1, life: outConfig.life, decay: outConfig.decay
                              });
                          }
                          const inConfig = PARTICLE_CONFIG.TELEPORT_IN;
                          for (let k = 0; k < inConfig.count; k++) {
                              const angle = Math.random() * 2 * Math.PI;
                              const speed = inConfig.minSpeed + Math.random() * (inConfig.maxSpeed - inConfig.minSpeed);
                              spawnParticle(newParticles, { position: { ...newPosition },
                                  velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                                  radius: 2, color, opacity: 1, life: inConfig.life, decay: inConfig.decay
                              });
                          }
                          synergyPuck.position = newPosition;
                      }
                  }
              }
              
              const puckPowerSynergy = puck.activeSynergy?.type === 'POWER';
              const otherPuckPowerSynergy = otherPuck.activeSynergy?.type === 'POWER';
              if (puckPowerSynergy || otherPuckPowerSynergy) {
                  const synergyPuck = puckPowerSynergy ? puck : otherPuck;
                  newPucks.forEach(targetPuck => {
                      if (targetPuck.id !== synergyPuck.id) {
                           const empDistVec = subtractVectors(targetPuck.position, synergyPuck.position);
                           const distSq = getVectorMagnitudeSq(empDistVec);
                           if (distSq > 0 && distSq < EMP_BURST_RADIUS * EMP_BURST_RADIUS) {
                              const empDistance = Math.sqrt(distSq);
                              const pushForce = EMP_BURST_FORCE * 1.5;
                              const pushVec = { x: (empDistVec.x / empDistance) * pushForce, y: (empDistVec.y / empDistance) * pushForce };
                              targetPuck.velocity.x += pushVec.x / targetPuck.mass;
                              targetPuck.velocity.y += pushVec.y / targetPuck.mass;
                           }
                      }
                  });
                  const config = PARTICLE_CONFIG.EMP_BURST;
                  spawnParticle(newParticles, {
                      position: { ...synergyPuck.position },
                      velocity: { x: 0, y: 0 },
                      radius: 1,
                      color: SYNERGY_EFFECTS.POWER.color,
                      opacity: 1,
                      life: config.life, decay: config.decay,
                      renderType: 'emp_burst',
                  });
              }
                
                // --- NEW PUCK ABILITIES ON COLLISION ---
                if (puck.team !== otherPuck.team) {
                    // REAPER
                    if (puck.puckType === 'REAPER' && puck.collisionsThisShot === 1) puck.velocity = { x: puck.velocity.x * REAPER_BOOST_FACTOR, y: puck.velocity.y * REAPER_BOOST_FACTOR };
                    if (otherPuck.puckType === 'REAPER' && otherPuck.collisionsThisShot === 1) otherPuck.velocity = { x: otherPuck.velocity.x * REAPER_BOOST_FACTOR, y: otherPuck.velocity.y * REAPER_BOOST_FACTOR };

                    // PULVERIZER
                    if (puck.puckType === 'PULVERIZER' && puck.collisionsThisShot === 1) {
                         newPucks.forEach(p => { if (p.id !== puck.id && p.team !== puck.team && getVectorMagnitudeSq(subtractVectors(p.position, puck.position)) < PULVERIZER_BURST_RADIUS * PULVERIZER_BURST_RADIUS) { const d = getVectorMagnitude(subtractVectors(p.position, puck.position)); const f = {x: (p.position.x - puck.position.x)/d * PULVERIZER_BURST_FORCE, y: (p.position.y - puck.position.y)/d * PULVERIZER_BURST_FORCE}; p.velocity = {x: p.velocity.x + f.x/p.mass, y: p.velocity.y + f.y/p.mass}; }});
                    }
                    if (otherPuck.puckType === 'PULVERIZER' && otherPuck.collisionsThisShot === 1) {
                        newPucks.forEach(p => { if (p.id !== otherPuck.id && p.team !== otherPuck.team && getVectorMagnitudeSq(subtractVectors(p.position, otherPuck.position)) < PULVERIZER_BURST_RADIUS * PULVERIZER_BURST_RADIUS) { const d = getVectorMagnitude(subtractVectors(p.position, otherPuck.position)); const f = {x: (p.position.x - otherPuck.position.x)/d * PULVERIZER_BURST_FORCE, y: (p.position.y - otherPuck.position.y)/d * PULVERIZER_BURST_FORCE}; p.velocity = {x: p.velocity.x + f.x/p.mass, y: p.velocity.y + f.y/p.mass}; }});
                    }

                    // DISRUPTOR
                    const applyDisruption = (disruptor: Puck, target: Puck) => {
                        if (target.puckType !== 'PAWN' && target.puckType !== 'KING' && !target.temporaryEffects.some(e => e.type === 'NEUTRALIZED')) {
                            const originalStats = { mass: target.mass, friction: target.friction, elasticity: target.elasticity, swerveFactor: target.swerveFactor, puckType: target.puckType };
                            target.temporaryEffects.push({ type: 'NEUTRALIZED', duration: DISRUPTOR_NEUTRALIZED_DURATION, originalStats });
                            const standardProps = PUCK_TYPE_PROPERTIES.STANDARD;
                            target.mass = standardProps.mass;
                            target.friction = standardProps.friction;
                            target.elasticity = standardProps.elasticity;
                            target.swerveFactor = standardProps.swerveFactor;
                            target.puckType = 'STANDARD';
                        }
                    };
                    if (puck.puckType === 'DISRUPTOR') applyDisruption(puck, otherPuck);
                    if (otherPuck.puckType === 'DISRUPTOR') applyDisruption(otherPuck, puck);
                }

              const overlap = (collisionDistance - distance) / 2;
              const overlapVec = { x: (distVec.x / distance) * overlap, y: (distVec.y / distance) * overlap };
              puck.position.x -= overlapVec.x; puck.position.y -= overlapVec.y;
              otherPuck.position.x += overlapVec.x; otherPuck.position.y += overlapVec.y;
              const normal = { x: distVec.x / distance, y: distVec.y / distance };
              const tangent = { x: -normal.y, y: normal.x };
              const dpTan1 = puck.velocity.x * tangent.x + puck.velocity.y * tangent.y;
              const dpTan2 = otherPuck.velocity.x * tangent.x + otherPuck.velocity.y * tangent.y;
              const dpNorm1 = puck.velocity.x * normal.x + puck.velocity.y * normal.y;
              const dpNorm2 = otherPuck.velocity.x * normal.x + otherPuck.velocity.y * normal.y;
              
              let m1 = puck.mass;
              if (puck.puckType === 'JUGGERNAUT') m1 *= (1 + getVectorMagnitude(puck.velocity) * JUGGERNAUT_MASS_FACTOR);
              let m2 = otherPuck.mass;
              if (otherPuck.puckType === 'JUGGERNAUT') m2 *= (1 + getVectorMagnitude(otherPuck.velocity) * JUGGERNAUT_MASS_FACTOR);

              const e1 = puck.elasticity ?? 1; const e2 = otherPuck.elasticity ?? 1;
              const restitution = (e1 + e2) / 2;
              const newDpNorm1 = (dpNorm1 * (m1 - restitution * m2) + (1 + restitution) * m2 * dpNorm2) / (m1 + m2);
              const newDpNorm2 = (dpNorm2 * (m2 - restitution * m1) + (1 + restitution) * m1 * dpNorm1) / (m1 + m2);
              puck.velocity.x = tangent.x * dpTan1 + normal.x * newDpNorm1;
              puck.velocity.y = tangent.y * dpTan1 + normal.y * newDpNorm1;
              otherPuck.velocity.x = tangent.x * dpTan2 + normal.x * newDpNorm2;
              otherPuck.velocity.y = tangent.y * dpTan2 + normal.y * newDpNorm2;
              
              const impactForce = Math.abs(newDpNorm1 - dpNorm1) * m1 + Math.abs(newDpNorm2 - dpNorm2) * m2;
              playSound('COLLISION', { volume: Math.min(1, 0.1 + impactForce / 20), throttleMs: 50 });
  
              if (impactForce > 2.5) {
                if (puck.puckType === 'PAWN' && puck.durability !== undefined) {
                    puck.durability--;
                }
                if (otherPuck.puckType === 'PAWN' && otherPuck.durability !== undefined) {
                    otherPuck.durability--;
                }
              }
  
              const config = PARTICLE_CONFIG.COLLISION;
              const particleCount = Math.min(5, Math.floor(impactForce * 0.5));
  
              for (let k = 0; k < particleCount; k++) {
                  const angle = Math.atan2(distVec.y, distVec.x) + (Math.random() - 0.5) * Math.PI;
                  const speed = 1 + Math.random() * (impactForce / 4);
                  spawnParticle(newParticles, {
                      position: { ...impactPoint },
                      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                      radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                      color: Math.random() > 0.5 ? TEAM_COLORS[puck.team] : TEAM_COLORS[otherPuck.team],
                      opacity: 0.9,
                      life: config.life,
                      decay: config.decay,
                  });
              }
  
              if (puck.puckType === 'BOUNCER' || otherPuck.puckType === 'BOUNCER') {
                  spawnParticle(newParticles, {
                      position: {...impactPoint},
                      velocity: {x:0, y:0},
                      radius: 1,
                      color: puck.puckType === 'BOUNCER' ? TEAM_COLORS[puck.team] : TEAM_COLORS[otherPuck.team],
                      opacity: 1,
                      life: 20,
                      decay: 0.05,
                      renderType: 'ring'
                  });
              }
            }
        });
        
        if (!roundWinner && !turnLossReason) {
            const isEnteringTopGoal = puck.position.y - puck.radius <= GOAL_Y_BLUE_SCORES && inGoalZoneX;
            const isEnteringBottomGoal = puck.position.y + puck.radius >= GOAL_Y_RED_SCORES && inGoalZoneX;

            let scoredInGoal: 'TOP' | 'BOTTOM' | null = null;
            if (isEnteringTopGoal) scoredInGoal = 'TOP';
            else if (isEnteringBottomGoal) scoredInGoal = 'BOTTOM';

            if (scoredInGoal) {
                const scoringTeam: Team = scoredInGoal === 'TOP' ? 'RED' : 'BLUE';
                const isOwnGoal = puck.team !== scoringTeam;

                if (isOwnGoal) {
                    turnLossReason = 'OWN_GOAL';
                    const effectPosition = { ...puck.position };
                    puck.position = { ...puck.initialPosition };
                    puck.velocity = { x: 0, y: 0 };
    
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: '¡AUTOGOL!',
                        position: { ...effectPosition },
                        color: TEAM_COLORS[puck.team],
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });
                     newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: 'TURNO PERDIDO',
                        position: { x: effectPosition.x, y: effectPosition.y + 30 },
                        color: TEAM_COLORS[puck.team],
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });

                } else if (!puck.isCharged) {
                    turnLossReason = 'UNCHARGED_GOAL';
                    const effectPosition = { ...puck.position };
                    puck.position = { ...puck.initialPosition };
                    puck.velocity = { x: 0, y: 0 };
                        
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: '¡FICHA NO CARGADA!',
                        position: { ...effectPosition },
                        color: '#fca5a5',
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: 'TURNO PERDIDO',
                        position: { x: effectPosition.x, y: effectPosition.y + 30 },
                        color: '#fca5a5',
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });
                
                } else if (puck.temporaryEffects.some(e => e.type === 'PHASED')) {
                    turnLossReason = 'PHASED_GOAL';
                    const effectPosition = { ...puck.position };
                    puck.position = { ...puck.initialPosition };
                    puck.velocity = { x: 0, y: 0 };
                        
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: '¡INTANGIBLE!',
                        position: { ...effectPosition },
                        color: '#fca5a5',
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });
                    newFloatingTexts.push({
                        id: floatingTextIdCounter.current++,
                        text: 'TURNO PERDIDO',
                        position: { x: effectPosition.x, y: effectPosition.y + 30 },
                        color: '#fca5a5',
                        opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                        decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                        velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.8 },
                    });

                } else {
                    roundWinner = scoringTeam;
                    scoringPuck = puck;
                    playSound('GOAL_SCORE');

                    if (scoringPuck.activeSynergy) {
                        newPulsarPower[roundWinner] = Math.min(MAX_PULSAR_POWER, newPulsarPower[roundWinner] + SYNERGY_GOAL_PULSAR_BONUS);
                         newFloatingTexts.push({
                            id: floatingTextIdCounter.current++,
                            text: `¡BONUS DE SINERGIA! +${SYNERGY_GOAL_PULSAR_BONUS}`,
                            position: { x: puck.position.x, y: puck.position.y - 40 },
                            color: SYNERGY_EFFECTS[scoringPuck.activeSynergy.type].color,
                            opacity: 1, life: FLOATING_TEXT_CONFIG.LIFE * 1.5,
                            decay: FLOATING_TEXT_CONFIG.DECAY / 1.5,
                            velocity: { x: 0, y: FLOATING_TEXT_CONFIG.RISE_SPEED * 0.9 },
                        });
                    }
                        
                    let goalConfig;
                    let goalColor = TEAM_COLORS[roundWinner];
                    if (puck.puckType === 'KING') {
                        goalConfig = PARTICLE_CONFIG.GOAL_KING;
                        goalColor = UI_COLORS.GOLD;
                    } else if (PUCK_GOAL_POINTS[puck.puckType] > 1) {
                        goalConfig = PARTICLE_CONFIG.GOAL_HEAVY;
                    } else {
                        goalConfig = PARTICLE_CONFIG.GOAL_STANDARD;
                    }
                    
                    const explosionCenter = { ...puck.position };
                    
                    const shockwaveConfig = PARTICLE_CONFIG.GOAL_SHOCKWAVE;
                    spawnParticle(newParticles, {
                      position: explosionCenter,
                      velocity: { x: 0, y: 0 },
                      radius: 1,
                      color: goalColor,
                      opacity: 0.8,
                      life: shockwaveConfig.life,
                      decay: shockwaveConfig.decay,
                      renderType: 'shockwave',
                    });

                    const shardConfig = PARTICLE_CONFIG.GOAL_SHARD;
                    for (let k = 0; k < shardConfig.count; k++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const speed = shardConfig.minSpeed + Math.random() * (shardConfig.maxSpeed - shardConfig.minSpeed);
                        spawnParticle(newParticles, {
                            position: explosionCenter,
                            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                            radius: 1,
                            color: goalColor,
                            opacity: 1,
                            life: shardConfig.life,
                            decay: shardConfig.decay,
                            renderType: 'goal_shard',
                        });
                    }

                    for (let k = 0; k < goalConfig.count; k++) {
                        const angle = Math.random() * 2 * Math.PI;
                        const speed = goalConfig.minSpeed + Math.random() * (goalConfig.maxSpeed - goalConfig.minSpeed);
                        spawnParticle(newParticles, {
                            position: explosionCenter,
                            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                            radius: goalConfig.minRadius + Math.random() * (goalConfig.maxRadius - goalConfig.minRadius),
                            color: goalColor,
                            opacity: 1, life: goalConfig.life,
                            decay: goalConfig.decay,
                        });
                    }
                }
            }
        }
      }

      newPucks.forEach(puck => {
        if (puck.puckType === 'PAWN' && puck.durability !== undefined && puck.durability <= 0) {
          if (!puckIdsToDestroy.has(puck.id)) {
              puckIdsToDestroy.add(puck.id);
              playSound('PAWN_SHATTER');
              const config = PARTICLE_CONFIG.PAWN_SHATTER;
              for (let k = 0; k < config.count; k++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
                spawnParticle(newParticles, {
                  position: { ...puck.position },
                  velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                  radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                  color: TEAM_COLORS[puck.team],
                  opacity: 0.9,
                  life: config.life,
                  decay: config.decay,
                });
              }
          }
        }
      });

      if (puckIdsToDestroy.size > 0) {
        if (newSelectedPuckId !== null && puckIdsToDestroy.has(newSelectedPuckId)) {
          newSelectedPuckId = null;
        }
        if (newInfoCardPuckId !== null && puckIdsToDestroy.has(newInfoCardPuckId)) {
          newInfoCardPuckId = null;
        }
        
        newPucks = newPucks.filter(p => !puckIdsToDestroy.has(p.id));
        newSpecialShotStatus.BLUE = checkSpecialShotStatus('BLUE', newPucks);
        newSpecialShotStatus.RED = checkSpecialShotStatus('RED', newPucks);
      }

      const targetViewBoxStr = VIEWBOX_STRING;
      const currentVb = prev.viewBox.split(' ').map(Number);
      const targetVb = targetViewBoxStr.split(' ').map(Number);
      const lerpFactor = 0.05;
      const nextVb = currentVb.map((val, i) => val + (targetVb[i] - val) * lerpFactor);
      const newViewBox = nextVb.join(' ');
      
      const isPhysicsOver = fastestPuckSpeedSq < (MAX_VELOCITY_FOR_TURN_END * MAX_VELOCITY_FOR_TURN_END) || roundWinner || turnLossReason;
      
      if (isPhysicsOver) {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        lineGridRef.current = null;
        
        if (roundWinner && scoringPuck) {
            newPucks.forEach(p => { p.velocity = {x: 0, y: 0}; });
            const pointsScored = PUCK_GOAL_POINTS[scoringPuck.puckType] || 0;

            return {
                ...prev,
                pucks: newPucks,
                particles: newParticles,
                floatingTexts: newFloatingTexts,
                orbitingParticles: newOrbitingParticles,
                specialShotStatus: newSpecialShotStatus,
                isSimulating: false,
                canShoot: false,
                viewBox: VIEWBOX_STRING,
                imaginaryLine: null,
                shotPreview: null,
                selectedPuckId: null,
                infoCardPuckId: null,
                previewState: null,
                isCameraInTensionMode: false,
                lastShotWasSpecial: 'NONE',
                orbHitsThisShot: 0,
                goalScoredInfo: {
                    scoringTeam: roundWinner,
                    pointsScored: pointsScored,
                    scoringPuckType: scoringPuck.puckType,
                },
                gameMessage: null,
                bonusTurnForTeam: null,
                screenShake: 0,
                turnLossReason: null,
            };
        }

        const bonusTurnEarned = newCanShoot;
        const wasSpecialShotWithoutGoal = prev.lastShotWasSpecial !== 'NONE' && !roundWinner;
        
        let isSoftLocked = false;
        if (bonusTurnEarned) {
            const teamPucks = newPucks.filter(p => p.team === prev.currentTurn);
            const shootablePucks = teamPucks.filter(p => !prev.pucksShotThisTurn.includes(p.id));
            if (shootablePucks.length === 0) {
                isSoftLocked = true;
            }
        }

        const finalTurnLossReason = turnLossReason || (wasSpecialShotWithoutGoal ? 'SPECIAL_NO_GOAL' : null);
        const forceTurnChange = !!finalTurnLossReason || isSoftLocked;

        if (bonusTurnEarned && !forceTurnChange) {
            playSound('BONUS_TURN');
        }
        
        const nextTurn = (bonusTurnEarned && !forceTurnChange)
          ? prev.currentTurn
          : (prev.currentTurn === 'BLUE' ? 'RED' : 'BLUE');
          
        let newTurnCount = prev.turnCount;
        let finalOrbitingParticles = newOrbitingParticles;
        let turnChangeParticles: Particle[] = [];

        newPucks.forEach(p => {
            p.velocity = { x: 0, y: 0 };
            if (p.activeSynergy) {
                p.mass = p.activeSynergy.initialStats.mass;
                p.friction = p.activeSynergy.initialStats.friction;
                p.elasticity = p.activeSynergy.initialStats.elasticity;
                p.swerveFactor = p.activeSynergy.initialStats.swerveFactor;
                delete p.activeSynergy;
                delete p.synergyEffectTriggered;
            }
            // Bug fix: Clear all temporary effects at the end of a simulation step,
            // except for persistent ones like REPULSOR_ARMOR or NEUTRALIZED.
            p.temporaryEffects = p.temporaryEffects.filter(effect => 
                effect.type === 'REPULSOR_ARMOR' || effect.type === 'NEUTRALIZED'
            );
        });
        
        if (nextTurn !== prev.currentTurn) {
            newTurnCount++;
            
            if (newTurnCount > 0 && (newTurnCount % TURNS_PER_ORB_SPAWN === 0)) {
                const ORB_RADIUS = 16;
                const totalPerimeter = 2 * (BOARD_WIDTH + BOARD_HEIGHT);
                const orbDiameterOnPerimeter = (ORB_RADIUS * 2) / totalPerimeter;

                let newProgress;
                let attempts = 0;

                do {
                    newProgress = Math.random();
                    attempts++;
                    if (attempts > 100) { 
                        console.warn("Could not find a non-overlapping spot for a new orb after 100 attempts.");
                        break; 
                    }
                } while (finalOrbitingParticles.some(orb => {
                    let distance = Math.abs(newProgress - (orb.progress || 0));
                    if (distance > 0.5) distance = 1 - distance;
                    return distance < orbDiameterOnPerimeter * 1.5;
                }));

                const newOrb: Particle = {
                    id: -(finalOrbitingParticles.length + 1),
                    position: { x: 0, y: 0 },
                    velocity: { x: 0, y: 0 },
                    radius: ORB_RADIUS,
                    color: TEAM_COLORS.BLUE,
                    opacity: 1,
                    life: Infinity,
                    lifeSpan: Infinity,
                    decay: 0,
                    renderType: 'orbiting',
                    progress: newProgress,
                    speed: (finalOrbitingParticles.length % 2 === 0 ? 1 : -1) * (0.001 + Math.random() * 0.0002),
                };
                finalOrbitingParticles.push(newOrb);
            }
            
            if (prev.overchargedTeam === prev.currentTurn) {
                newOverchargedTeam = null;
            }
        
            const newBlueStatus = checkSpecialShotStatus('BLUE', newPucks);
            const newRedStatus = checkSpecialShotStatus('RED', newPucks);

            newSpecialShotStatus.BLUE = newBlueStatus;
            newSpecialShotStatus.RED = newRedStatus;

        
            finalOrbitingParticles.forEach(orb => {
                 orb.color = TEAM_COLORS[nextTurn];
            });

            playSound('PULSAR_ACTIVATE', { throttleMs: 100, volume: 0.6 });

            const config = PARTICLE_CONFIG.TURN_CHANGE_BURST;
            const turnChangeEffectPosition = finalOrbitingParticles.length > 0
                ? { ...finalOrbitingParticles[0].position }
                : { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };

            for (let k = 0; k < config.count; k++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
                spawnParticle(turnChangeParticles, {
                    position: turnChangeEffectPosition,
                    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                    color: TEAM_COLORS[nextTurn],
                    opacity: 0.9,
                    life: config.life,
                    decay: config.decay,
                });
            }
            spawnParticle(turnChangeParticles, {
                position: turnChangeEffectPosition,
                velocity: { x: 0, y: 0 },
                radius: 1,
                color: TEAM_COLORS[nextTurn],
                opacity: 1,
                life: 30,
                decay: 0.033,
                renderType: 'ring',
            });
        }

        const userHasStartedNextAction = newSelectedPuckId !== null;

        return {
          ...prev,
          pucks: newPucks,
          particles: turnChangeParticles.length > 0 ? turnChangeParticles : (userHasStartedNextAction ? newParticles : []),
          floatingTexts: [],
          orbitingParticles: finalOrbitingParticles,
          winner: null,
          isSimulating: false,
          canShoot: true,
          viewBox: VIEWBOX_STRING,
          pulsarPower: newPulsarPower,
          specialShotStatus: newSpecialShotStatus,
          currentTurn: nextTurn,
          pucksShotThisTurn: nextTurn !== prev.currentTurn ? [] : prev.pucksShotThisTurn,
          orbHitsThisShot: nextTurn !== prev.currentTurn ? 0 : newOrbHitsThisShot,
          lastShotWasSpecial: 'NONE',
          turnLossReason: finalTurnLossReason,
          turnCount: newTurnCount,
          orbCollection: newOrbCollection,
          overchargedTeam: newOverchargedTeam,
          
          imaginaryLine: userHasStartedNextAction ? prev.imaginaryLine : null,
          shotPreview: userHasStartedNextAction ? prev.shotPreview : null,
          selectedPuckId: userHasStartedNextAction ? newSelectedPuckId : null,
          infoCardPuckId: userHasStartedNextAction ? newInfoCardPuckId : null,
          
          previewState: null,
          isCameraInTensionMode: false,
          gameMessage: null,
          bonusTurnForTeam: (bonusTurnEarned && !forceTurnChange) ? prev.currentTurn : null,
          screenShake: 0,
        };
      } else {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return {
          ...prev,
          pucks: newPucks,
          particles: newParticles,
          floatingTexts: newFloatingTexts,
          orbitingParticles: newOrbitingParticles,
          isSimulating: true,
          viewBox: newViewBox,
          imaginaryLine: newImaginaryLine,
          canShoot: newCanShoot,
          isCameraInTensionMode: newIsCameraInTensionMode,
          pulsarPower: newPulsarPower,
          specialShotStatus: newSpecialShotStatus,
          orbHitsThisShot: newOrbHitsThisShot,
          orbCollection: newOrbCollection,
          overchargedTeam: newOverchargedTeam,
          screenShake: newScreenShake,
          gameMessage: newGameMessage,
          selectedPuckId: newSelectedPuckId,
          infoCardPuckId: newInfoCardPuckId,
        };
      }
    });
  }, [playSound, setGameMessageWithTimeout]);
  
  const ambientLoop = useCallback(() => {
    setGameState(prev => {
        if (prev.isSimulating) {
            if (ambientAnimationFrameId.current) cancelAnimationFrame(ambientAnimationFrameId.current);
            ambientAnimationFrameId.current = null;
            return prev;
        }
        
        let newParticles = [...prev.particles];
        let newOrbitingParticles = [...prev.orbitingParticles.map(p => ({...p}))];

        const spawnParticle = (particlesArray: Particle[], props: Omit<Particle, 'id' | 'lifeSpan'> & { life: number }) => {
            const p = particlePool.current.pop();
            const finalProps = { ...props, lifeSpan: props.life };
            if (p) {
                Object.assign(p, finalProps, { id: particleIdCounter.current++ });
                particlesArray.push(p);
            } else {
                particlesArray.push({
                    ...finalProps,
                    id: particleIdCounter.current++,
                } as Particle);
            }
        };

        newOrbitingParticles.forEach(orb => {
            if (orb.progress !== undefined && orb.speed !== undefined) {
                orb.progress = (orb.progress + orb.speed) % 1;
                const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
                const p = orb.progress * totalPerimeter;
    
                if (p < BOARD_WIDTH) {
                    orb.position = { x: p, y: 0 };
                } else if (p < BOARD_WIDTH + BOARD_HEIGHT) {
                    orb.position = { x: BOARD_WIDTH, y: p - BOARD_WIDTH };
                } else if (p < 2 * BOARD_WIDTH + BOARD_HEIGHT) {
                    orb.position = { x: BOARD_WIDTH - (p - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT };
                } else {
                    orb.position = { x: 0, y: BOARD_HEIGHT - (p - (2 * BOARD_WIDTH + BOARD_HEIGHT)) };
                }
            }
        });
        
        const activeParticles: Particle[] = [];
        for (const p of newParticles) {
            p.life -= 1;
            p.opacity -= p.decay;
            if (p.life > 0 && p.opacity > 0) {
                p.position.x += p.velocity.x;
                p.position.y += p.velocity.y;
                activeParticles.push(p);
            } else {
                particlePool.current.push(p);
            }
        }
        newParticles = activeParticles;

        const newFloatingTexts = prev.floatingTexts.map(ft => ({
            ...ft,
            position: { x: ft.position.x + ft.velocity.x, y: ft.position.y + ft.velocity.y },
            life: ft.life - 1,
            opacity: ft.opacity - ft.decay,
        })).filter(ft => ft.life > 0 && ft.opacity > 0);
        
        ambientAnimationFrameId.current = requestAnimationFrame(ambientLoop);
        
        return {
            ...prev,
            particles: newParticles,
            floatingTexts: newFloatingTexts,
            orbitingParticles: newOrbitingParticles,
        };
    });
  }, []);

  useEffect(() => {
    if (gameState.isSimulating) {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [gameState.isSimulating, gameLoop]);

  useEffect(() => {
    if (!gameState.isSimulating && !gameState.goalScoredInfo && !gameState.winner) {
        if (!ambientAnimationFrameId.current) {
            ambientAnimationFrameId.current = requestAnimationFrame(ambientLoop);
        }
    } else {
        if (ambientAnimationFrameId.current) {
            cancelAnimationFrame(ambientAnimationFrameId.current);
            ambientAnimationFrameId.current = null;
        }
    }
    return () => {
        if (ambientAnimationFrameId.current) {
            cancelAnimationFrame(ambientAnimationFrameId.current);
            ambientAnimationFrameId.current = null;
        }
    };
  }, [gameState.isSimulating, gameState.goalScoredInfo, gameState.winner, ambientLoop]);
  
  useEffect(() => {
    const triggerHeartbeat = () => {
        setGameState(prev => {
            if (!prev.canShoot || prev.isSimulating || prev.winner || prev.selectedPuckId) {
                return prev;
            }
            playSound('HEARTBEAT');
            const newParticles: Particle[] = [...prev.particles];

            const spawnParticle = (particlesArray: Particle[], props: Omit<Particle, 'id' | 'lifeSpan'> & { life: number }) => {
                const p = particlePool.current.pop();
                const finalProps = { ...props, lifeSpan: props.life };
                if (p) {
                    Object.assign(p, finalProps, { id: particleIdCounter.current++ });
                    particlesArray.push(p);
                } else {
                    particlesArray.push({
                        ...finalProps,
                        id: particleIdCounter.current++,
                    } as Particle);
                }
            };

            spawnParticle(newParticles, {
                position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
                velocity: { x: 0, y: 0 },
                radius: 10,
                color: TEAM_COLORS[prev.currentTurn],
                opacity: 0.3,
                life: 90,
                decay: 0.008,
                renderType: 'heartbeat',
            });

            return {
                ...prev,
                particles: newParticles,
            };
        });
    };

    const clearInactivityTimers = () => {
        if (inactivityStateRef.current.timeout) clearTimeout(inactivityStateRef.current.timeout);
        if (inactivityStateRef.current.interval) clearInterval(inactivityStateRef.current.interval);
        inactivityStateRef.current = { timeout: null, interval: null };
    };

    const isIdle = gameState.canShoot && !gameState.isSimulating && !gameState.winner && !gameState.selectedPuckId;

    if (isIdle) {
        if (!inactivityStateRef.current.timeout && !inactivityStateRef.current.interval) {
            inactivityStateRef.current.timeout = setTimeout(() => {
                triggerHeartbeat();
                inactivityStateRef.current.interval = setInterval(triggerHeartbeat, 12000);
            }, 10000);
        }
    } else {
        clearInactivityTimers();
    }

    return () => clearInactivityTimers();
  }, [gameState.canShoot, gameState.isSimulating, gameState.winner, gameState.selectedPuckId, playSound]);

  useEffect(() => {
    if (gameState.goalScoredInfo) {
      const { scoringTeam, pointsScored } = gameState.goalScoredInfo;

      if (roundEndTimeoutRef.current) {
        clearTimeout(roundEndTimeoutRef.current);
      }
      
      roundEndTimeoutRef.current = setTimeout(() => {
        setGameState(prev => {
          if (!prev.goalScoredInfo) return prev;
          
          const newScore = { ...prev.score };
          newScore[scoringTeam] += pointsScored;

          const gameWinner = checkWinner(newScore);

          if (gameWinner) {
             return {
                 ...prev,
                 winner: gameWinner,
                 score: newScore,
                 isSimulating: false,
                 canShoot: false,
                 goalScoredInfo: null,
             };
          }

          const nextTurn = scoringTeam === 'BLUE' ? 'RED' : 'BLUE';
          
          const pucksResetForNextRound = prev.pucks.map(p => ({
              ...p,
              position: { ...p.initialPosition },
              velocity: { x: 0, y: 0 },
              isCharged: false,
              activeSynergy: undefined,
              synergyEffectTriggered: undefined,
              temporaryEffects: [],
          }));
          
          return {
            ...prev,
            score: newScore,
            winner: null,
            goalScoredInfo: null,
            isSimulating: false,
            canShoot: true,
            currentTurn: nextTurn,
            pucks: pucksResetForNextRound,
            pucksShotThisTurn: [],
            imaginaryLine: null,
            shotPreview: null,
          };
        });
      }, 3000);
    }

    return () => {
      if (roundEndTimeoutRef.current) {
        clearTimeout(roundEndTimeoutRef.current);
      }
    };
  }, [gameState.goalScoredInfo]);

  const handleMouseDown = useCallback((puckId: number, startPos: Vector) => {
    clearSynergyHoldTimer();
    clearInfoCardTimer();

    setGameState(prev => {
      if (!prev.canShoot || prev.winner) return prev;
      if (prev.currentTurn === aiTeam) return prev; // AI cannot interact with the board.
      
      const puck = prev.pucks.find(p => p.id === puckId);
      if (!puck || puck.team !== prev.currentTurn || prev.pucksShotThisTurn.includes(puckId)) {
        return prev;
      }
      
      playSound('PUCK_SELECT');
      const lines = calculatePotentialLines(puckId, prev.pucks);
      
      lineGridRef.current = new Map<string, number[]>();
      lines.forEach((line, index) => {
          const cells = getCellsForSegment(line.start, line.end);
          cells.forEach(key => {
              if (!lineGridRef.current!.has(key)) {
                  lineGridRef.current!.set(key, []);
              }
              lineGridRef.current!.get(key)!.push(index);
          });
      });

      const specialShotStatus = puck.puckType === 'KING' ? prev.specialShotStatus[puck.team] : null;

      infoCardTimerRef.current = setTimeout(() => {
         setGameState(g => ({...g, infoCardPuckId: puckId}));
      }, 800);

      return {
        ...prev,
        selectedPuckId: puckId,
        infoCardPuckId: null, // Hide on new selection
        shotPreview: {
            start: startPos,
            end: startPos,
            power: 0,
            isMaxPower: false,
            isCancelZone: true,
            specialShotStatus: specialShotStatus,
        },
        imaginaryLine: {
            lines: lines,
            isConfirmed: false,
            shotPuckId: puckId,
            crossedLineIndices: new Set(),
            pawnPawnLinesCrossed: new Set(),
            pawnSpecialLinesCrossed: new Set(),
            comboCount: 0,
            highlightedLineIndex: null,
        },
        previewState: null,
      };
    });
  }, [aiTeam, playSound, clearSynergyHoldTimer, clearInfoCardTimer]);

  const handleMouseMove = useCallback((currentPos: Vector) => {
    clearInfoCardTimer();

    setGameState(prev => {
        if (!prev.canShoot || prev.selectedPuckId === null || !prev.shotPreview) {
            return { ...prev, infoCardPuckId: null };
        }

        const puck = prev.pucks.find(p => p.id === prev.selectedPuckId);
        if (!puck) return { ...prev, infoCardPuckId: null };

        const startPos = prev.shotPreview.start;
        const shotVector = subtractVectors(startPos, currentPos);
        const distance = getVectorMagnitude(shotVector);
        
        const dragDistanceForPower = Math.min(distance, MAX_DRAG_FOR_POWER);
        const power = dragDistanceForPower / MAX_DRAG_FOR_POWER;
        const isMaxPower = power >= 1.0;
        
        const cancelDistance = getVectorMagnitude(subtractVectors(currentPos, startPos));
        const isCancelZone = cancelDistance < CANCEL_SHOT_THRESHOLD;

        let newHighlightedLineIndex = prev.imaginaryLine?.highlightedLineIndex ?? null;
        if (prev.imaginaryLine && !isCancelZone) {
            const angle = Math.atan2(shotVector.y, shotVector.x);
            const checkPoint = {
                x: startPos.x - Math.cos(angle) * (distance + puck.radius * 2),
                y: startPos.y - Math.sin(angle) * (distance + puck.radius * 2),
            };

            let bestLineIndex = -1;
            let minDistanceSq = Infinity;

            prev.imaginaryLine.lines.forEach((line, index) => {
                const lineMidPoint = { x: (line.start.x + line.end.x) / 2, y: (line.start.y + line.end.y) / 2 };
                const distSq = getVectorMagnitudeSq(subtractVectors(checkPoint, lineMidPoint));

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestLineIndex = index;
                }
            });
            
            const aimThreshold = 200 * 200;
            newHighlightedLineIndex = (minDistanceSq < aimThreshold) ? bestLineIndex : null;
        } else {
            newHighlightedLineIndex = null;
        }
        
        const newImaginaryLineState = prev.imaginaryLine ? { ...prev.imaginaryLine, highlightedLineIndex: newHighlightedLineIndex } : null;
        
        if (newHighlightedLineIndex !== null && newHighlightedLineIndex !== lastHighlightedLineIndexRef.current) {
            clearSynergyHoldTimer();
            const highlightedLine = prev.imaginaryLine?.lines[newHighlightedLineIndex];
            if (highlightedLine?.synergyType) {
                lastHighlightedLineIndexRef.current = newHighlightedLineIndex;
                synergyHoldTimerRef.current = setTimeout(() => {
                    setGameState(sg_prev => {
                        if (!sg_prev.imaginaryLine || sg_prev.selectedPuckId === null) return sg_prev;
                        const puckIndex = sg_prev.pucks.findIndex(p => p.id === sg_prev.selectedPuckId);
                        if (puckIndex === -1) return sg_prev;
                        playSound('SYNERGY_LOCK');
                        const newPucks = [...sg_prev.pucks];
                        const puckToModify = { ...newPucks[puckIndex] };
                        const synergyType = highlightedLine.synergyType!;
                        const synergyEffect = SYNERGY_EFFECTS[synergyType];
                        const initialStats = { mass: puckToModify.mass, friction: puckToModify.friction, elasticity: puckToModify.elasticity, swerveFactor: puckToModify.swerveFactor };
                        puckToModify.activeSynergy = { type: synergyType, initialStats, lineAngle: 0 };
                        puckToModify.synergyEffectTriggered = false;
                        if (synergyEffect.statModifiers) { Object.assign(puckToModify, synergyEffect.statModifiers); }
                        newPucks[puckIndex] = puckToModify;
                        setGameMessageWithTimeout(SYNERGY_DESCRIPTIONS[synergyType].name, 'synergy', 3000, synergyType);
                        return { ...sg_prev, pucks: newPucks };
                    });
                }, SYNERGY_HOLD_DURATION);
            }
        } else if (newHighlightedLineIndex === null && lastHighlightedLineIndexRef.current !== null) {
            clearSynergyHoldTimer();
            const newPucks = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
            return { ...prev, pucks: newPucks, imaginaryLine: newImaginaryLineState, shotPreview: { ...prev.shotPreview, end: currentPos, power, isMaxPower, isCancelZone }, infoCardPuckId: null };
        }
        
        return {
            ...prev,
            imaginaryLine: newImaginaryLineState,
            shotPreview: { ...prev.shotPreview, end: currentPos, power, isMaxPower, isCancelZone },
            infoCardPuckId: null,
        };
    });
  }, [playSound, setGameMessageWithTimeout, clearSynergyHoldTimer, cancelActiveSynergy, clearInfoCardTimer]);

  const handleMouseUp = useCallback((endPos: Vector | null) => {
    clearSynergyHoldTimer();
    clearInfoCardTimer();

    setGameState(prev => {
      if (!prev.canShoot || !prev.shotPreview || !endPos) {
        return { ...prev, selectedPuckId: null, shotPreview: null, imaginaryLine: null, previewState: null, infoCardPuckId: null };
      }

      const { start, isCancelZone, power, specialShotStatus } = prev.shotPreview;
      const shotVector = subtractVectors(start, endPos);
      const distance = getVectorMagnitude(shotVector);

      if (isCancelZone || distance < MIN_DRAG_DISTANCE || prev.selectedPuckId === null) {
        const newPucks = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
        return { ...prev, pucks: newPucks, selectedPuckId: null, shotPreview: null, imaginaryLine: null, previewState: null, infoCardPuckId: null };
      }
      
      const puckIndex = prev.pucks.findIndex(p => p.id === prev.selectedPuckId);
      if (puckIndex === -1) return prev;

      let finalPower = power * LAUNCH_POWER_MULTIPLIER;
      let lastShotWasSpecial = 'NONE' as SpecialShotStatus;
      
      if (prev.pulsarShotArmed === prev.currentTurn) {
          finalPower *= 2.0;
          playSound('PULSAR_SHOT');
      } else {
          playSound('SHOT', { volume: 0.5 + power });
      }

      const newPucks = [...prev.pucks];
      let launchedPuck = { ...newPucks[puckIndex] };
      
      if (launchedPuck.puckType === 'INFILTRATOR') {
          finalPower *= (PUCK_TYPE_PROPERTIES.INFILTRATOR.powerFactor ?? 1);
      }
      if (launchedPuck.puckType === 'KING') {
          finalPower *= (PUCK_TYPE_PROPERTIES.KING.powerFactor ?? 1);
          if (specialShotStatus === 'ROYAL' || specialShotStatus === 'ULTIMATE') {
              playSound(specialShotStatus === 'ROYAL' ? 'ROYAL_SHOT' : 'ULTIMATE_SHOT');
              const multiplier = specialShotStatus === 'ROYAL' ? ROYAL_SHOT_POWER_MULTIPLIER : ULTIMATE_SHOT_POWER_MULTIPLIER;
              finalPower *= multiplier;
              const effectType = specialShotStatus === 'ROYAL' ? 'ROYAL_RAGE' : 'ULTIMATE_RAGE';
              launchedPuck.temporaryEffects.push({ type: effectType, duration: Infinity, destroyedCount: 0 });
              lastShotWasSpecial = specialShotStatus;
          }
      }

      if (launchedPuck.activeSynergy) {
          const synergyType = launchedPuck.activeSynergy.type;
          if (synergyType === 'SPEED') {
            launchedPuck.temporaryEffects.push({ type: 'PHASED', duration: SYNERGY_GHOST_PHASE_DURATION });
          } else if (synergyType === 'REPULSOR_ARMOR') {
            launchedPuck.temporaryEffects.push({ type: 'REPULSOR_ARMOR', duration: REPULSOR_ARMOR_DURATION });
          }
      }

      const comboBonus = prev.imaginaryLine?.comboCount ? (COMBO_BONUSES[prev.imaginaryLine.comboCount] || (prev.imaginaryLine.comboCount > 4 ? 2.0 : 1.0)) : 1.0;

      const finalImpulse = {
          x: (shotVector.x / distance) * finalPower * comboBonus,
          y: (shotVector.y / distance) * finalPower * comboBonus,
      };

      launchedPuck.velocity = {
        x: finalImpulse.x / launchedPuck.mass,
        y: finalImpulse.y / launchedPuck.mass,
      };
      launchedPuck.distanceTraveledThisShot = 0;
      launchedPuck.collisionsThisShot = 0;
      newPucks[puckIndex] = launchedPuck;
      
      animationFrameId.current = requestAnimationFrame(gameLoop);
      
      return {
        ...prev,
        pucks: newPucks,
        isSimulating: true,
        canShoot: false,
        selectedPuckId: null,
        infoCardPuckId: null,
        shotPreview: null,
        imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, isConfirmed: true } : null,
        pucksShotThisTurn: [...prev.pucksShotThisTurn, prev.selectedPuckId],
        pulsarShotArmed: null,
        previewState: null,
        lastShotWasSpecial,
      };
    });
  }, [gameLoop, playSound, clearInfoCardTimer, clearSynergyHoldTimer, cancelActiveSynergy]);

  const handleBoardMouseDown = useCallback(() => {
    setGameState(prev => {
        if (prev.selectedPuckId !== null) {
            clearSynergyHoldTimer();
            clearInfoCardTimer();
            const newPucks = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
            return {
                ...prev,
                pucks: newPucks,
                selectedPuckId: null,
                shotPreview: null,
                imaginaryLine: null,
                previewState: null,
                infoCardPuckId: null,
            };
        }
        return prev;
    });
  }, [clearSynergyHoldTimer, clearInfoCardTimer, cancelActiveSynergy]);

  const handleActivatePulsar = useCallback(() => {
    setGameState(prev => {
        if (prev.isSimulating || !prev.canShoot || prev.currentTurn !== prev.pulsarShotArmed?.valueOf() && prev.pulsarPower[prev.currentTurn] < MAX_PULSAR_POWER) {
            return prev;
        }
        playSound('PULSAR_ACTIVATE');
        return {
            ...prev,
            pulsarShotArmed: prev.pulsarShotArmed === prev.currentTurn ? null : prev.currentTurn
        };
    });
  }, [playSound]);
  
  useEffect(() => {
    if (gameState.currentTurn === aiTeam && gameState.canShoot && !gameState.isSimulating && !gameState.winner) {
      const aiTurnTimeout = setTimeout(() => {
        const myTeam = aiTeam;
        const opponentTeam = myTeam === 'RED' ? 'BLUE' : 'RED';
        const myGoalY = myTeam === 'RED' ? GOAL_Y_RED_SCORES : GOAL_Y_BLUE_SCORES;
        const opponentGoalY = opponentTeam === 'RED' ? GOAL_Y_RED_SCORES : GOAL_Y_BLUE_SCORES;

        const myPucks = gameState.pucks.filter(p => p.team === myTeam);
        const shootablePucks = myPucks.filter(p => !gameState.pucksShotThisTurn.includes(p.id));
        const opponentPucks = gameState.pucks.filter(p => p.team === opponentTeam);
        
        if (shootablePucks.length === 0) return;

        let bestShot: { puck: Puck; target: Vector; score: number } | null = null;
        
        const threateningPucks = opponentPucks
            .filter(p => p.isCharged && Math.abs(p.position.y - myGoalY) < BOARD_HEIGHT * 0.6)
            .sort((a, b) => Math.abs(a.position.y - myGoalY) - Math.abs(b.position.y - myGoalY));

        if (threateningPucks.length > 0) {
            const primaryThreat = threateningPucks[0];
            let bestInterceptor: { puck: Puck; distance: number } | null = null;
            for (const puck of shootablePucks) {
                const distance = getVectorMagnitude(subtractVectors(puck.position, primaryThreat.position));
                if (!bestInterceptor || distance < bestInterceptor.distance) { bestInterceptor = { puck, distance }; }
            }
            if (bestInterceptor) {
                 bestShot = { puck: bestInterceptor.puck, target: primaryThreat.position, score: 1000 };
            }
        }
        
        if (!bestShot) {
            for (const puck of shootablePucks) {
                const target = { x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * GOAL_WIDTH * 0.5, y: opponentGoalY };
                let score = 100;
                if (puck.isCharged) score += 200;
                if (puck.puckType === 'KING') score += 50;
                score -= Math.abs(puck.position.y - opponentGoalY) * 0.1;
                if (!bestShot || score > bestShot.score) { bestShot = { puck, target, score }; }
            }
        }

        if (!bestShot) return;

        const { puck: shotPuck, target } = bestShot;
        const powerFactor = 0.7 + Math.random() * 0.3;
        const shotDirection = subtractVectors(target, shotPuck.position);
        const dist = getVectorMagnitude(shotDirection);
        if (dist === 0) return;

        const impulseMagnitude = powerFactor * LAUNCH_POWER_MULTIPLIER;
        const finalImpulse = {
            x: (shotDirection.x / dist) * impulseMagnitude,
            y: (shotDirection.y / dist) * impulseMagnitude,
        };

        setGameState(prev => {
            const puckIndex = prev.pucks.findIndex(p => p.id === shotPuck.id);
            if (puckIndex === -1) return prev;
            const newPucks = [...prev.pucks];
            const launchedPuck = { ...newPucks[puckIndex] };
            
            launchedPuck.velocity = {
              x: finalImpulse.x / launchedPuck.mass,
              y: finalImpulse.y / launchedPuck.mass,
            };
            launchedPuck.distanceTraveledThisShot = 0;
            launchedPuck.collisionsThisShot = 0;
            newPucks[puckIndex] = launchedPuck;
            playSound('SHOT', { volume: 0.5 + powerFactor * 0.5 });
            return { 
                ...prev, 
                pucks: newPucks, 
                isSimulating: true, 
                canShoot: false, 
                selectedPuckId: null, 
                pucksShotThisTurn: [...prev.pucksShotThisTurn, shotPuck.id], 
                imaginaryLine: { 
                    lines: calculatePotentialLines(shotPuck.id, prev.pucks), 
                    isConfirmed: true, 
                    shotPuckId: shotPuck.id, 
                    crossedLineIndices: new Set(), 
                    pawnPawnLinesCrossed: new Set(), 
                    pawnSpecialLinesCrossed: new Set(), 
                    comboCount: 0, 
                    highlightedLineIndex: null 
                } 
            };
        });
        
        animationFrameId.current = requestAnimationFrame(gameLoop);

      }, 1000 + Math.random() * 1500);

      return () => clearTimeout(aiTurnTimeout);
    }
  }, [gameState.currentTurn, aiTeam, gameState.canShoot, gameState.isSimulating, gameState.winner, gameState.pucks, gameState.pucksShotThisTurn, gameLoop, playSound]);

  return {
    gameState,
    startGame,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetGame,
    handleBoardMouseDown,
    handleActivatePulsar,
    clearTurnLossReason,
    clearBonusTurn,
  };
};