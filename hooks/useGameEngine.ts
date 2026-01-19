
import { useState, useEffect, useCallback, useRef } from 'react';
import { Puck, Team, Vector, GameState, ImaginaryLineState, PuckType, Particle, ImaginaryLine, SynergyType, TemporaryEffect, PreviewState, PuckTrajectory, SpecialShotStatus, TurnLossReason } from '../types';
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
  INITIAL_PUCK_CONFIG,
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
} from '../constants';

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

const createInitialPucks = (): Puck[] => {
    let idCounter = 0;
    const pucks: Puck[] = [];
    INITIAL_PUCK_CONFIG.forEach(({ team, pucks: puckConfigs }) => {
        puckConfigs.forEach(({ type, position }) => {
            const properties = PUCK_TYPE_PROPERTIES[type];
            const newPuck: Puck = {
                id: idCounter++,
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

            pucks.push(newPuck);
        });
    });
    return pucks;
};


const createInitialGameState = (): GameState => {
  const initialOrb: Particle = {
    id: -1, // Special ID for a unique particle
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 8,
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
    pucks: createInitialPucks(),
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
    
    // BUG FIX: The King was incorrectly excluded from being a "special" puck for synergy/charging lines.
    // By removing `&& p.puckType !== 'KING'`, we allow other special pucks to form lines with the King.
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

/**
 * Checks for a winner based on the score.
 * The standard win condition is reaching SCORE_TO_WIN.
 * However, if both players reach SCORE_TO_WIN - 1 (e.g., 2-2),
 * a "win by two" (deuce) rule is activated.
 * @param score The current score object { RED: number, BLUE: number }
 * @returns The winning team ('RED' | 'BLUE') or null if there is no winner yet.
 */
const checkWinner = (score: { RED: number; BLUE: number }): Team | null => {
  const blueScore = score.BLUE;
  const redScore = score.RED;
  // The score at which "deuce" mode can start. e.g., if SCORE_TO_WIN is 3, this is 2.
  const winThreshold = SCORE_TO_WIN - 1;

  // Check if scores are high enough to be in "deuce" mode.
  if (blueScore >= winThreshold && redScore >= winThreshold) {
    // "Win by two" rule is active. A player must be ahead by 2 points to win.
    if (blueScore >= redScore + 2) {
      return 'BLUE';
    }
    if (redScore >= blueScore + 2) {
      return 'RED';
    }
  } else {
    // Standard "first to SCORE_TO_WIN" rule.
    if (blueScore >= SCORE_TO_WIN) {
      return 'BLUE';
    }
    if (redScore >= SCORE_TO_WIN) {
      return 'RED';
    }
  }
  
  return null; // No winner yet.
};

const checkSpecialShotStatus = (team: Team, allPucks: Puck[]): SpecialShotStatus => {
    const teamPucks = allPucks.filter(p => p.team === team);
    const specialPucks = teamPucks.filter(p => SPECIAL_PUCKS_FOR_ROYAL_SHOT.includes(p.puckType));
    const pawns = teamPucks.filter(p => p.puckType === 'PAWN');

    // To have any special shot, there must be special pucks and they must all be charged.
    if (specialPucks.length === 0 || !specialPucks.every(p => p.isCharged)) {
        return 'NONE';
    }

    // At this point, all special pucks are charged.
    // Now check the pawn status for the ULTIMATE shot.
    const allPawnsCharged = pawns.length > 0 && pawns.every(p => p.isCharged);

    if (allPawnsCharged) {
        return 'ULTIMATE';
    }

    // If not ULTIMATE but specials are charged, it's ROYAL.
    return 'ROYAL';
};


export const useGameEngine = ({ playSound }: UseGameEngineProps) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const animationFrameId = useRef<number | null>(null);
  const ambientAnimationFrameId = useRef<number | null>(null);
  const particleIdCounter = useRef(0);
  const particlePool = useRef<Particle[]>([]);
  const floatingTextIdCounter = useRef(0);
  const roundEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{ mouseDownPuckId: number | null, isDragging: boolean, startPos: Vector | null, justSelected: boolean }>({ mouseDownPuckId: null, isDragging: false, startPos: null, justSelected: false });
  const inactivityStateRef = useRef<{ timeout: ReturnType<typeof setTimeout> | null; interval: ReturnType<typeof setInterval> | null }>({ timeout: null, interval: null });
  const synergyHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHighlightedLineIndexRef = useRef<number | null>(null);
  const gameMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineGridRef = useRef<Map<string, number[]> | null>(null);

  // BUG FIX #3 HELPER: Reverts synergy stats when a shot is cancelled.
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
      setGameState(prev => ({...prev, gameMessage: { text, type, synergyType }}));
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
    // Cleanup on unmount
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
          // This ensures the loop only restarts if it was explicitly stopped, preventing re-entry issues.
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

      // --- Particle Spawning Helper (for use within this state update) ---
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

      // Update orbiting particles
      newOrbitingParticles.forEach(orb => {
        if (orb.progress !== undefined && orb.speed !== undefined) {
          orb.progress = (orb.progress + orb.speed) % 1;
          const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
          const p = orb.progress * totalPerimeter;

          if (p < BOARD_WIDTH) { // Top edge
              orb.position = { x: p, y: 0 };
          } else if (p < BOARD_WIDTH + BOARD_HEIGHT) { // Right edge
              orb.position = { x: BOARD_WIDTH, y: p - BOARD_WIDTH };
          } else if (p < 2 * BOARD_WIDTH + BOARD_HEIGHT) { // Bottom edge
              orb.position = { x: BOARD_WIDTH - (p - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT };
          } else { // Left edge
              orb.position = { x: 0, y: BOARD_HEIGHT - (p - (2 * BOARD_WIDTH + BOARD_HEIGHT)) };
          }
        }
      });
      
      // --- Apply Overcharge Repulsor Effect ---
      if (prev.currentTurn === prev.overchargedTeam) {
        const overchargedPucks = newPucks.filter(p => p.team === prev.overchargedTeam);
        overchargedPucks.forEach(puck => {
            // Apply repulsor push to nearby enemies
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
            // Particle effect for overcharge aura
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
                  // Apply EMP push to nearby enemies
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
                   // Create EMP particle effect
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
                // Particle effect for repulsor
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
              return effect.duration > 0;
          });
      });

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

          puck.position.x += puck.velocity.x;
          puck.position.y += puck.velocity.y;
          puck.velocity.x *= puck.friction;
          puck.velocity.y *= puck.friction;
          
          vSq = getVectorMagnitudeSq(puck.velocity); // Recalculate after friction

          if (puck.swerveFactor && vSq > (0.1 * 0.1)) { /* swerve logic */ }
          
          if (vSq < MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP) {
            puck.velocity = { x: 0, y: 0 };
          } else {
            if (vSq > fastestPuckSpeedSq) {
              fastestPuckSpeedSq = vSq;
            }
            // Add sliding particles
            if (vSq > (1.5 * 1.5) && Math.random() < 0.007) {
                const config = PARTICLE_CONFIG.SLIDING;
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: (Math.random() - 0.5) * config.speed, y: (Math.random() - 0.5) * config.speed },
                    radius: config.radius,
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 0.7,
                    life: config.life,
                    decay: config.decay,
                });
            }

            // --- Special Synergy Trails ---
            if (puck.activeSynergy && Math.random() < 0.02) {
                 const config = PARTICLE_CONFIG.SYNERGY_TRAIL;
                 const synergyColor = SYNERGY_EFFECTS[puck.activeSynergy.type].color;
                 const angle = Math.random() * 2 * Math.PI;
                 spawnParticle(newParticles, {
                    position: { x: puck.position.x + (Math.random() - 0.5) * puck.radius, y: puck.position.y + (Math.random() - 0.5) * puck.radius },
                    velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                    radius: config.radius,
                    color: synergyColor,
                    opacity: 0.8,
                    life: config.life,
                    decay: config.decay,
                });
            }

            // Add Ghost trail particles
            if (puck.temporaryEffects.some(e => e.type === 'PHASED') && Math.random() < 0.03) {
                const config = PARTICLE_CONFIG.GHOST_TRAIL;
                const angle = Math.random() * 2 * Math.PI;
                spawnParticle(newParticles, {
                    position: { x: puck.position.x + (Math.random() - 0.5) * puck.radius, y: puck.position.y + (Math.random() - 0.5) * puck.radius },
                    velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                    radius: config.radius,
                    color: 'rgba(191, 219, 254, 0.7)', // blue-200 with opacity
                    opacity: 0.7,
                    life: config.life,
                    decay: config.decay,
                });
            }
            // Add Royal/Ultimate Rage aura particles
            const isRoyalRage = puck.temporaryEffects.some(e => e.type === 'ROYAL_RAGE');
            const isUltimateRage = puck.temporaryEffects.some(e => e.type === 'ULTIMATE_RAGE');

            if (isRoyalRage && Math.random() < 0.03) {
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
            } else if (isUltimateRage && Math.random() < 0.05) {
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
             // --- Special Puck Trails ---
            const velocityMagnitude = Math.sqrt(vSq);
            if (velocityMagnitude > 0.8 && !puck.activeSynergy) { // Only create trails if moving fast enough and no synergy trail
                switch (puck.puckType) {
                    case 'KING':
                        if (Math.random() < 0.04) {
                            const config = PARTICLE_CONFIG.KING_TRAIL;
                            const angle = Math.random() * 2 * Math.PI;
                            spawnParticle(newParticles, {
                                position: { x: puck.position.x, y: puck.position.y },
                                velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                                radius: config.radius,
                                color: UI_COLORS.GOLD,
                                opacity: 0.8,
                                life: config.life, decay: config.decay,
                            });
                        }
                        break;
                    case 'HEAVY':
                    case 'ANCHOR':
                        if (Math.random() < 0.02) {
                            const config = PARTICLE_CONFIG.HEAVY_TRAIL;
                            const angle = Math.random() * 2 * Math.PI;
                            spawnParticle(newParticles, {
                                position: { ...puck.position },
                                velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                                radius: config.radius,
                                color: '#b91c1c', // Dark red
                                opacity: 0.6,
                                life: config.life, decay: config.decay,
                            });
                        }
                        break;
                    case 'FAST':
                        if (Math.random() < 0.03) {
                            const config = PARTICLE_CONFIG.FAST_TRAIL;
                            const trailVel = { x: -puck.velocity.x * config.speed, y: -puck.velocity.y * config.speed };
                            spawnParticle(newParticles, {
                                position: { ...puck.position },
                                velocity: trailVel,
                                radius: config.radius,
                                color: TEAM_COLORS[puck.team],
                                opacity: 0.9,
                                life: config.life, decay: config.decay,
                            });
                        }
                        break;
                    case 'SWERVE':
                        if (Math.random() < 0.025) {
                            const config = PARTICLE_CONFIG.SWERVE_TRAIL;
                            // Perpendicular velocity for swirl effect
                            const perpVel = { x: -puck.velocity.y * config.speed, y: puck.velocity.x * config.speed };
                            const side = Math.random() > 0.5 ? 1 : -1;
                            spawnParticle(newParticles, {
                                position: { ...puck.position },
                                velocity: { x: perpVel.x * side, y: perpVel.y * side },
                                radius: config.radius,
                                color: '#d946ef', // Fuchsia
                                opacity: 0.8,
                                life: config.life, decay: config.decay,
                            });
                        }
                        break;
                    case 'BOUNCER':
                        if (Math.random() < 0.03) {
                             const config = PARTICLE_CONFIG.BOUNCER_TRAIL;
                             spawnParticle(newParticles, {
                                 position: { ...puck.position },
                                 velocity: { x: 0, y: 0 },
                                 radius: 1,
                                 color: UI_COLORS.ACCENT_YELLOW,
                                 opacity: 1,
                                 life: config.life, decay: config.decay,
                                 renderType: 'ring'
                             });
                        }
                        break;
                }
            }
          }
        }
      });
      
      // --- Check for Orbiting Particle Collision ---
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
    
                    // 1. Grant Power with Chain Reaction Bonus
                    const comboMultiplier = 1 + (newOrbHitsThisShot - 1) * 0.5;
                    let powerGained = Math.round(PULSAR_ORB_HIT_SCORE * comboMultiplier);
                    newPulsarPower[puck.team] = Math.min(MAX_PULSAR_POWER, newPulsarPower[puck.team] + powerGained);
                    
                    // 2. Create Floating Text
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
        
                    // 3. Create Particle Burst
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
        
                    // 4. Handle orb collection and overcharge
                    newOrbCollection[puck.team]++;
                    if (newOrbCollection[puck.team] >= ORBS_FOR_OVERCHARGE) {
                        newOverchargedTeam = puck.team;
                        newOrbCollection[puck.team] = 0; // Reset count
                        playSound('ROYAL_POWER_UNLOCKED');
                        setGameMessageWithTimeout('¡SOBRECARGA!', 'powerup', 3000);
                    }
        
                    // 5. Apply a small pushback to the puck
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

      // --- Check for imaginary line cross (OPTIMIZED) ---
      if (newImaginaryLine && newImaginaryLine.isConfirmed) {
        const movingPucksData = [];
        for (const puckPrev of prev.pucks) {
            if (getVectorMagnitudeSq(puckPrev.velocity) > (MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP)) {
                const puckNew = newPucks.find(p => p.id === puckPrev.id);
                if (puckNew) {
                    movingPucksData.push({ puckPrev, puckNew });
                }
            }
        }
        
        movingPucksData.forEach(({ puckPrev, puckNew }) => {
            const movementSegmentStart = puckPrev.position;
            const movementSegmentEnd = puckNew!.position;
            
            // --- NEW OPTIMIZATION: Use spatial grid to find candidate lines ---
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
            // --- END NEW OPTIMIZATION ---

            candidateLineIndices.forEach(index => {
                if (!newImaginaryLine.crossedLineIndices.has(index)) {
                    const line = newImaginaryLine.lines[index];
                    const intersectionPoint = getLineIntersection(movementSegmentStart, movementSegmentEnd, line.start, line.end);
                    if (intersectionPoint) {
                        newImaginaryLine.crossedLineIndices.add(index);
                        
                        // --- NEW: Categorize line type for pawn charging ---
                        if (puckNew.puckType === 'PAWN' && puckNew.id === newImaginaryLine.shotPuckId) {
                            const sourcePuck1 = newPucks.find(p => p.id === line.sourcePuckIds[0]);
                            const sourcePuck2 = newPucks.find(p => p.id === line.sourcePuckIds[1]);

                            if (sourcePuck1 && sourcePuck2) {
                                // BUG FIX: King should count as a special puck for charging pawns.
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

                        // --- Apply Puck-Specific Abilities on cross ---
                        if (puckNew.puckType === 'HEAVY' || puckNew.puckType === 'ANCHOR') {
                            puckNew.temporaryEffects.push({ type: 'EMP_BURST', duration: 1 });
                        }
                        if (puckNew.puckType === 'GHOST') {
                           puckNew.temporaryEffects.push({ type: 'PHASED', duration: GHOST_PHASE_DURATION / 3 }); // shorter phase for active crossing
                        }

                        // --- Main shot puck bonuses ---
                        if (puckNew.id === newImaginaryLine.shotPuckId) {
                            newImaginaryLine.comboCount++;
                            let powerGained = PULSAR_POWER_PER_LINE;
                            let isPerfect = false;

                            // Perfect Crossing Bonus
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
                            // Synergy Crossing Bonus
                            if (line.synergyType) {
                                powerGained += SYNERGY_CROSSING_BONUS;
                            }
                            
                            const comboBonus = COMBO_BONUSES[newImaginaryLine.comboCount] || (newImaginaryLine.comboCount > 4 ? 2.0 : 1.0);
                            const finalPowerGained = Math.round(powerGained * comboBonus);
                            newPulsarPower[prev.currentTurn] = Math.min(MAX_PULSAR_POWER, newPulsarPower[prev.currentTurn] + finalPowerGained);
                            
                             // Create Pulsar charge particles flowing to the goal
                            const chargeConfig = PARTICLE_CONFIG.PULSAR_CHARGE;
                            const team = prev.currentTurn;
                            // BLUE team bar is at the top, RED team bar is at the bottom
                            const targetY = team === 'BLUE' ? -PULSAR_BAR_HEIGHT : BOARD_HEIGHT + PULSAR_BAR_HEIGHT;
                            const numParticles = Math.min(5, Math.floor(finalPowerGained / 4));
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

                            // Create floating text
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

                            // Create shockwave particle
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
                             // Check for bonus turn and puck charging
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
                                // Charge the puck if it's not already
                                if (!puckNew.isCharged) {
                                    puckNew.isCharged = true;
                                    playSound('BONUS_TURN'); // Play sound on charge for immediate feedback
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
                                    
                                    // Grant the ability to shoot again IMMEDIATELY for newly charging a puck.
                                    newCanShoot = true;

                                    // --- Check for Special Shot Unlock ---
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
        });
      }

      // --- Handle collisions ---
      // Create a map for quick puck lookups by ID
      const puckMap = new Map(newPucks.map(p => [p.id, p]));
      
      // OPTIMIZATION: Populate spatial grid with all pucks for collision detection
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
        
        // Wall collisions
        const inGoalZoneX = puck.position.x > GOAL_X_MIN && puck.position.x < GOAL_X_MAX;
        let wallImpact = false;
        let impactVelocity = 0;

        // Left wall
        if (puck.position.x - puck.radius < 0) {
            puck.position.x = puck.radius;
            impactVelocity = Math.abs(puck.velocity.x);
            puck.velocity.x *= -(puck.elasticity ?? 1);
            wallImpact = true;
        }
        // Right wall
        else if (puck.position.x + puck.radius > BOARD_WIDTH) {
            puck.position.x = BOARD_WIDTH - puck.radius;
            impactVelocity = Math.abs(puck.velocity.x);
            puck.velocity.x *= -(puck.elasticity ?? 1);
            wallImpact = true;
        }

        // Top/Bottom walls (outside goal areas)
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
            // BUG FIX #2: Pawns now only lose durability from significant impacts (> 2.0 velocity).
            if (puck.puckType === 'PAWN' && puck.durability !== undefined && impactVelocity > 2.0) {
                puck.durability--;
            }
        }

        // Puck-puck collisions
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
            // Ensure each pair is checked only once (puck.id < otherPuckId)
            if (otherPuckId <= puck.id) {
                return;
            }
            const otherPuck = puckMap.get(otherPuckId);
            if (!otherPuck) return;

            // --- Start of original collision logic ---
            if (puckIdsToDestroy.has(puck.id) || puckIdsToDestroy.has(otherPuck.id)) {
              return;
            }
  
            // --- Check for Royal/Ultimate Rage Destruction ---
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
  
            // Check for phasing
            const isPhased = puck.temporaryEffects.some(e => e.type === 'PHASED') || otherPuck.temporaryEffects.some(e => e.type === 'PHASED');
            if (isPhased) {
                return; // Ignore collision if either puck is phased
            }
  
            const distVec = subtractVectors(otherPuck.position, puck.position);
            const distance = getVectorMagnitude(distVec);
            const collisionDistance = puck.radius + otherPuck.radius;
  
            if (distance < collisionDistance) {
              const impactPoint = {
                  x: puck.position.x + (distVec.x / 2),
                  y: puck.position.y + (distVec.y / 2),
              };
  
              // --- Handle one-time collision synergies ---
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
                      // Apply force to enemies
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
                      // Teleport logic
                      const teleportVec = subtractVectors(targetForSynergy.position, synergyPuck.position);
                      const teleportDist = getVectorMagnitude(teleportVec);
                      if (teleportDist > 0) {
                          const normal = { x: teleportVec.x / teleportDist, y: teleportVec.y / teleportDist };
                          const newPosition = {
                              x: targetForSynergy.position.x + normal.x * (targetForSynergy.radius + synergyPuck.radius + TELEPORT_STRIKE_DISTANCE),
                              y: targetForSynergy.position.y + normal.y * (targetForSynergy.radius + synergyPuck.radius + TELEPORT_STRIKE_DISTANCE),
                          };
  
                          // Particle effects
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
              
              // --- Synergy Power EMP Burst on Collision ---
              const puckPowerSynergy = puck.activeSynergy?.type === 'POWER';
              const otherPuckPowerSynergy = otherPuck.activeSynergy?.type === 'POWER';
              if (puckPowerSynergy || otherPuckPowerSynergy) {
                  const synergyPuck = puckPowerSynergy ? puck : otherPuck;
                  // Apply EMP push to all other pucks
                  newPucks.forEach(targetPuck => {
                      if (targetPuck.id !== synergyPuck.id) {
                           const empDistVec = subtractVectors(targetPuck.position, synergyPuck.position);
                           const distSq = getVectorMagnitudeSq(empDistVec);
                           if (distSq > 0 && distSq < EMP_BURST_RADIUS * EMP_BURST_RADIUS) {
                              const empDistance = Math.sqrt(distSq);
                              const pushForce = EMP_BURST_FORCE * 1.5; // Stronger for synergy
                              const pushVec = { x: (empDistVec.x / empDistance) * pushForce, y: (empDistVec.y / empDistance) * pushForce };
                              targetPuck.velocity.x += pushVec.x / targetPuck.mass;
                              targetPuck.velocity.y += pushVec.y / targetPuck.mass;
                           }
                      }
                  });
                  // Create EMP particle effect
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
  
              // Standard collision physics response
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
  
              // GAME BALANCE FIX: Pawns only lose durability on significant impacts.
              if (impactForce > 2.5) {
                if (puck.puckType === 'PAWN' && puck.durability !== undefined) {
                    puck.durability--;
                }
                if (otherPuck.puckType === 'PAWN' && otherPuck.durability !== undefined) {
                    otherPuck.durability--;
                }
              }
  
              // Create collision particles
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
  
              // Special effect for Bouncer collision
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
            // --- End of original collision logic ---
        });
        
        // --- GOAL LOGIC (REFACTORED) ---
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

                } else { // VALID GOAL
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
                    
                    // 1. Shockwave
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

                    // 2. Shards
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

                    // 3. Debris particles
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

      // --- Handle Pawn Destruction ---
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
        // If a selected puck or info-card puck is being destroyed, deselect it.
        if (newSelectedPuckId !== null && puckIdsToDestroy.has(newSelectedPuckId)) {
          newSelectedPuckId = null;
        }
        if (newInfoCardPuckId !== null && puckIdsToDestroy.has(newInfoCardPuckId)) {
          newInfoCardPuckId = null;
        }
        
        newPucks = newPucks.filter(p => !puckIdsToDestroy.has(p.id));
        // After destroying pucks, re-check the special shot status for both teams
        newSpecialShotStatus.BLUE = checkSpecialShotStatus('BLUE', newPucks);
        newSpecialShotStatus.RED = checkSpecialShotStatus('RED', newPucks);
      }

      // Tension-based camera logic
      /* ... existing camera logic ... */
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
        
        // --- GOAL SCORED SEQUENCE ---
        if (roundWinner && scoringPuck) {
            // Stop all pucks immediately
            newPucks.forEach(p => { p.velocity = {x: 0, y: 0}; });
            const pointsScored = PUCK_GOAL_POINTS[scoringPuck.puckType] || 0;

            return {
                ...prev,
                pucks: newPucks,
                particles: newParticles, // keep goal particles
                floatingTexts: newFloatingTexts,
                orbitingParticles: newOrbitingParticles,
                specialShotStatus: newSpecialShotStatus,
                isSimulating: false, // Stop the game loop, but show the result
                canShoot: false,
                viewBox: VIEWBOX_STRING,
                imaginaryLine: null,
                shotPreview: null,
                selectedPuckId: null,
                infoCardPuckId: null,
                previewState: null,
                isCameraInTensionMode: false,
                lastShotWasSpecial: 'NONE', // Reset flag on goal
                orbHitsThisShot: 0, // Reset on goal
                goalScoredInfo: { // This is the trigger for the UI
                    scoringTeam: roundWinner,
                    pointsScored: pointsScored,
                    scoringPuckType: scoringPuck.puckType,
                },
                gameMessage: null,
                bonusTurnForTeam: null,
                screenShake: 0,
                turnLossReason: null, // No turn loss on a valid goal
            };
        }

        // --- NORMAL END OF TURN (NO GOAL) ---
        const bonusTurnEarned = newCanShoot;
        const wasSpecialShotWithoutGoal = prev.lastShotWasSpecial !== 'NONE' && !roundWinner;
        
        // BUG FIX: Check for soft-lock state on bonus turn
        let isSoftLocked = false;
        if (bonusTurnEarned) {
            const teamPucks = newPucks.filter(p => p.team === prev.currentTurn);
            // prev.pucksShotThisTurn already includes the puck just shot
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

        // Reset effects at end of turn
        newPucks.forEach(p => {
            p.velocity = { x: 0, y: 0 }; // Force stop all pucks
            if (p.activeSynergy) {
                p.mass = p.activeSynergy.initialStats.mass;
                p.friction = p.activeSynergy.initialStats.friction;
                p.elasticity = p.activeSynergy.initialStats.elasticity;
                p.swerveFactor = p.activeSynergy.initialStats.swerveFactor;
                delete p.activeSynergy;
                delete p.synergyEffectTriggered;
            }
            // CRITICAL BUG FIX: Clear temporary offensive effects at the end of the turn.
            // This prevents Royal/Ultimate Rage from persisting into the opponent's turn,
            // which was an unintended and unbalanced exploit. Defensive effects like Repulsor Armor persist.
            p.temporaryEffects = p.temporaryEffects.filter(effect => 
                effect.type === 'REPULSOR_ARMOR'
            );
        });
        
        // Turn actually changes
        if (nextTurn !== prev.currentTurn) {
            newTurnCount++;
            
            // Spawn new orb if needed
            if (newTurnCount > 0 && (newTurnCount % TURNS_PER_ORB_SPAWN === 0)) {
                const ORB_RADIUS = 8;
                const totalPerimeter = 2 * (BOARD_WIDTH + BOARD_HEIGHT);
                // Calculate the 'width' of an orb in the 0-1 progress space
                const orbDiameterOnPerimeter = (ORB_RADIUS * 2) / totalPerimeter;

                let newProgress;
                let attempts = 0; // Safety break to prevent infinite loops

                // Find a random spot that doesn't overlap with existing orbs
                do {
                    newProgress = Math.random();
                    attempts++;
                    if (attempts > 100) { 
                        console.warn("Could not find a non-overlapping spot for a new orb after 100 attempts.");
                        break; 
                    }
                } while (finalOrbitingParticles.some(orb => {
                    // Calculate shortest distance on a circular perimeter (0 to 1)
                    let distance = Math.abs(newProgress - (orb.progress || 0));
                    if (distance > 0.5) distance = 1 - distance; // Handle wrap-around
                    return distance < orbDiameterOnPerimeter * 1.5; // Use 1.5 multiplier for spacing
                }));

                const newOrb: Particle = {
                    id: -(finalOrbitingParticles.length + 1), // unique negative id
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
                    // Alternate direction based on the number of orbs already present
                    speed: (finalOrbitingParticles.length % 2 === 0 ? 1 : -1) * (0.001 + Math.random() * 0.0002),
                };
                finalOrbitingParticles.push(newOrb);
            }
            
            // Deactivate overcharge after the turn is used
            if (prev.overchargedTeam === prev.currentTurn) {
                newOverchargedTeam = null;
            }
        
            // If turn changes, all special shot statuses are reset unless a puck was just charged to trigger it
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

            // Create particle burst at the effect position
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
            // Also create a ring effect for emphasis
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

        // If user has already started aiming their next (bonus) shot, don't reset their UI state.
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
          lastShotWasSpecial: 'NONE', // Reset flag after turn resolution
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
  
  // Separate animation loop for ambient effects when the main simulation is paused
  const ambientLoop = useCallback(() => {
    setGameState(prev => {
        // This loop should stop if the main simulation starts
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

        // Update orbiting particles
        newOrbitingParticles.forEach(orb => {
            if (orb.progress !== undefined && orb.speed !== undefined) {
                orb.progress = (orb.progress + orb.speed) % 1;
                const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
                const p = orb.progress * totalPerimeter;
    
                if (p < BOARD_WIDTH) { // Top edge
                    orb.position = { x: p, y: 0 };
                } else if (p < BOARD_WIDTH + BOARD_HEIGHT) { // Right edge
                    orb.position = { x: BOARD_WIDTH, y: p - BOARD_WIDTH };
                } else if (p < 2 * BOARD_WIDTH + BOARD_HEIGHT) { // Bottom edge
                    orb.position = { x: BOARD_WIDTH - (p - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT };
                } else { // Left edge
                    orb.position = { x: 0, y: BOARD_HEIGHT - (p - (2 * BOARD_WIDTH + BOARD_HEIGHT)) };
                }
            }
        });
        
        // Add particle effects for Special Shot being ready & Synergy Aura
        const addParticlesForTeam = (team: Team, status: SpecialShotStatus) => {
            if (status !== 'NONE' && Math.random() > 0.96) {
                const king = prev.pucks.find(p => p.puckType === 'KING' && p.team === team);
                if (king) {
                    const isUltimate = status === 'ULTIMATE';
                    const config = isUltimate ? PARTICLE_CONFIG.ULTIMATE_POWER_READY : PARTICLE_CONFIG.ROYAL_POWER_READY;
                    const angle = Math.random() * 2 * Math.PI;
                    spawnParticle(newParticles, {
                        position: { ...king.position },
                        velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                        radius: config.radius,
                        color: isUltimate ? `hsl(${Date.now() / 10 % 360}, 100%, 70%)` : UI_COLORS.GOLD,
                        opacity: 0.9,
                        life: config.life,
                        decay: config.decay,
                    });
                }
            }
        };

        addParticlesForTeam('BLUE', prev.specialShotStatus.BLUE);
        addParticlesForTeam('RED', prev.specialShotStatus.RED);

        // Add Synergy Aura particles
        prev.pucks.forEach(puck => {
            if (puck.activeSynergy && Math.random() < 0.02) {
                const config = PARTICLE_CONFIG.SYNERGY_AURA;
                const color = SYNERGY_EFFECTS[puck.activeSynergy.type].color;
                const angle = Math.random() * 2 * Math.PI;
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
                    radius: puck.radius,
                    color: color,
                    opacity: 0.8,
                    life: config.life,
                    decay: config.decay,
                    renderType: 'synergy_aura',
                });
            }
            
            // --- NEW: Ambient Sparks for Charged Pucks ---
            if (puck.isCharged && Math.random() < 0.04) {
              const config = PARTICLE_CONFIG.CHARGED_SPARKS;
              const angle = Math.random() * 2 * Math.PI;
              const radiusOffset = puck.radius * (0.8 + Math.random() * 0.4);
              const startX = puck.position.x + Math.cos(angle) * radiusOffset;
              const startY = puck.position.y + Math.sin(angle) * radiusOffset;
              
              spawnParticle(newParticles, {
                  position: { x: startX, y: startY },
                  velocity: { x: (Math.random() - 0.5) * config.speed, y: (Math.random() - 0.5) * config.speed },
                  radius: config.radius * (0.5 + Math.random()),
                  color: '#fde047', // Yellow spark color
                  opacity: 0.8,
                  life: config.life,
                  decay: config.decay,
              });
            }
        });

        // Add Pulsar Armed Aura particles
        if (prev.pulsarShotArmed && Math.random() < 0.04) {
            const armedTeam = prev.pulsarShotArmed;
            prev.pucks.forEach(puck => {
                if (puck.team === armedTeam) {
                    const config = PARTICLE_CONFIG.PULSAR_AURA;
                    const angle = Math.random() * 2 * Math.PI;
                    const radiusOffset = puck.radius + 3;
                    const startPos = {
                        x: puck.position.x + Math.cos(angle) * radiusOffset,
                        y: puck.position.y + Math.sin(angle) * radiusOffset,
                    };
                    // Velocity perpendicular to the radius for orbit effect
                    const vel = {
                        x: -Math.sin(angle) * config.speed,
                        y: Math.cos(angle) * config.speed,
                    };

                    spawnParticle(newParticles, {
                        position: startPos,
                        velocity: vel,
                        radius: config.radius,
                        color: TEAM_COLORS[armedTeam],
                        opacity: 0.9,
                        life: config.life,
                        decay: config.decay,
                    });
                }
            });
        }

        // Add ambient turn particles
        if (prev.canShoot && Math.random() < 0.02) {
            const config = PARTICLE_CONFIG.TURN_DRIFT;
            const team = prev.currentTurn;
            const startX = Math.random() * BOARD_WIDTH;
            let startY, velY;

            if (team === 'BLUE') { // Top team, particles drift down
                startY = (Math.random() * BOARD_HEIGHT * 0.4) - 20; // Spawn in top 40% of board, slightly off-screen
                velY = config.speed;
            } else { // Bottom team, particles drift up
                startY = BOARD_HEIGHT - (Math.random() * BOARD_HEIGHT * 0.4) + 20; // Spawn in bottom 40%
                velY = -config.speed;
            }

            spawnParticle(newParticles, {
                position: { x: startX, y: startY },
                velocity: { x: (BOARD_WIDTH / 2 - startX) * 0.001, y: velY },
                radius: config.radius,
                color: TEAM_COLORS[team],
                opacity: 0.6,
                life: config.life,
                decay: config.decay,
            });
        }

        // Update existing particles (Recycle with Pooling)
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

  // Effect to manage starting/stopping the physics simulation loop
  useEffect(() => {
    if (gameState.isSimulating) {
        if (!animationFrameId.current) { // Prevent multiple loops
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

  // Effect to manage starting/stopping the ambient effects loop
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
  
  // Effect to handle inactivity timer
  useEffect(() => {
    const triggerHeartbeat = () => {
        setGameState(prev => {
            // Final check to ensure we should still trigger the effect
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

            // 1. Central heartbeat
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

            // 2. Pulse on shootable pucks
            const shootablePucks = prev.pucks.filter(p =>
                p.team === prev.currentTurn && !prev.pucksShotThisTurn.includes(p.id)
            );

            shootablePucks.forEach(puck => {
                spawnParticle(newParticles, {
                    position: { ...puck.position },
                    velocity: { x: 0, y: 0 },
                    radius: puck.radius, // Base radius
                    color: TEAM_COLORS[puck.team],
                    opacity: 0.4,
                    life: 90,
                    decay: 0, // Let render logic handle fade
                    renderType: 'idle_pulse',
                    puckType: puck.puckType,
                    rotation: puck.rotation,
                });
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
                triggerHeartbeat(); // First beat
                inactivityStateRef.current.interval = setInterval(triggerHeartbeat, 12000); // Subsequent beats
            }, 10000); // 10s initial delay
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

          // Reset for next round if no winner
          const nextGameState = createInitialGameState();
          const loserStartsTurn = scoringTeam === 'BLUE' ? 'RED' : 'BLUE';
          
          // Preserve orbiting particles from the previous round
          const preservedOrbs = prev.orbitingParticles.map(orb => ({
              ...orb,
              color: TEAM_COLORS[loserStartsTurn]
          }));
          
          // If all orbs were collected, ensure at least one is present for the next round.
          if (preservedOrbs.length === 0) {
              const newInitialOrb = { ...nextGameState.orbitingParticles[0] };
              newInitialOrb.color = TEAM_COLORS[loserStartsTurn];
              preservedOrbs.push(newInitialOrb);
          }
          
          return {
            ...nextGameState,
            score: newScore,
            currentTurn: loserStartsTurn, 
            pucks: nextGameState.pucks.map(p => ({...p, initialPosition: {...p.position}})),
            orbitingParticles: preservedOrbs,
          };
        });
      }, 3000); // Wait 3 seconds for the animation to play
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

      const puck = prev.pucks.find(p => p.id === puckId);
      if (!puck || puck.team !== prev.currentTurn || prev.pucksShotThisTurn.includes(puck.id)) {
        if (prev.selectedPuckId !== null) playSound('UI_CLICK_2');
        return { ...prev, selectedPuckId: null, infoCardPuckId: null, shotPreview: null, previewState: null, imaginaryLine: null };
      }

      dragStateRef.current = { mouseDownPuckId: puckId, isDragging: false, startPos, justSelected: puckId !== prev.selectedPuckId };

      infoCardTimerRef.current = setTimeout(() => {
        if (dragStateRef.current.mouseDownPuckId === puckId && !dragStateRef.current.isDragging) {
          setGameState(current => ({ ...current, infoCardPuckId: puckId }));
        }
      }, 1200);

      let nextState: GameState = { ...prev };

      if (nextState.bonusTurnForTeam) {
        nextState.bonusTurnForTeam = null;
      }
      
      // If switching pucks, cancel synergy on the previously selected puck.
      let pucksAfterCancel = prev.pucks;
      if (prev.selectedPuckId !== null && prev.selectedPuckId !== puckId) {
          pucksAfterCancel = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
      }
      nextState.pucks = pucksAfterCancel;

      if (puckId !== prev.selectedPuckId) {
        playSound('PUCK_SELECT');
        const potentialLines = calculatePotentialLines(puckId, pucksAfterCancel);
        const puckToSelect = pucksAfterCancel.find(p => p.id === puckId);
        
        let highlightedLineIndex: number | null = null;
        
        if (puckToSelect?.activeSynergy) {
            const synergyType = puckToSelect.activeSynergy.type;
            const lineAngle = puckToSelect.activeSynergy.lineAngle;

            const foundIndex = potentialLines.findIndex(line => {
                if (line.synergyType !== synergyType) return false;
                
                const currentLineVector = subtractVectors(line.end, line.start);
                const currentLineAngle = Math.atan2(currentLineVector.y, currentLineVector.x);
                
                // Compare angles, accounting for 180-degree opposition
                const angleDiff1 = Math.abs(currentLineAngle - lineAngle);
                if (Math.min(angleDiff1, 2 * Math.PI - angleDiff1) < 0.01) return true;
                
                const angleDiff2 = Math.abs(currentLineAngle - (lineAngle + Math.PI));
                 if (Math.min(angleDiff2, 2 * Math.PI - angleDiff2) < 0.01) return true;

                return false;
            });

            if (foundIndex !== -1) {
                highlightedLineIndex = foundIndex;
            }
        }
        
        const newImaginaryLineState: ImaginaryLineState = potentialLines.length > 0 ? {
          lines: potentialLines,
          isConfirmed: false,
          crossedLineIndices: new Set(),
          pawnPawnLinesCrossed: new Set(),
          pawnSpecialLinesCrossed: new Set(),
          shotPuckId: puckId,
          comboCount: 0,
          highlightedLineIndex: highlightedLineIndex,
        } : null;

        nextState = {
          ...nextState,
          selectedPuckId: puckId,
          infoCardPuckId: null,
          shotPreview: null,
          previewState: null,
          imaginaryLine: newImaginaryLineState,
        };
      } else {
        // BUG FIX: Re-clicking a selected puck now resets the aiming UI AND synergy state.
        const pucksReverted = cancelActiveSynergy(pucksAfterCancel, puckId);
        nextState = { 
            ...nextState, 
            pucks: pucksReverted,
            infoCardPuckId: null,
            shotPreview: null,
            previewState: null,
            imaginaryLine: nextState.imaginaryLine ? { ...nextState.imaginaryLine, highlightedLineIndex: null } : null,
        };
      }
      
      return nextState;
    });
  }, [playSound, clearSynergyHoldTimer, clearInfoCardTimer, cancelActiveSynergy]);
  
  const handleMouseMove = useCallback((currentPos: Vector) => {
    const { mouseDownPuckId, isDragging: wasDragging, startPos } = dragStateRef.current;
    if (mouseDownPuckId === null || !startPos) return;

    const dragDistanceSq = getVectorMagnitudeSq(subtractVectors(currentPos, startPos));
    const isStartingToDrag = !wasDragging && dragDistanceSq >= MIN_DRAG_DISTANCE * MIN_DRAG_DISTANCE;

    if (isStartingToDrag) {
      dragStateRef.current.isDragging = true;
      clearInfoCardTimer();
    }
    
    if (!dragStateRef.current.isDragging) {
        return;
    }

    setGameState(prev => {
      const puck = prev.pucks.find(p => p.id === mouseDownPuckId);
      if (!puck) return prev;

      // --- We are now officially dragging ---
      let newParticles = [...prev.particles];
      let nextPucks = prev.pucks;
      const shotVector = subtractVectors(puck.position, currentPos);
      const shotDistance = getVectorMagnitude(shotVector);
      const isNowMaxPower = shotDistance >= MAX_DRAG_FOR_POWER;
      const isCancelZone = shotDistance < CANCEL_SHOT_THRESHOLD;
      const wasMaxPower = prev.shotPreview?.isMaxPower ?? false;
      const power = Math.min(1, shotDistance / MAX_DRAG_FOR_POWER);
      
      const specialShotType = puck.puckType === 'KING' ? prev.specialShotStatus[puck.team] : null;
      
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

      if (isNowMaxPower && !wasMaxPower) {
          playSound('MAX_POWER_LOCK');
          const config = PARTICLE_CONFIG.MAX_POWER_REACHED;
          let particleColor = TEAM_COLORS[puck.team];
          if (specialShotType === 'ROYAL') particleColor = UI_COLORS.GOLD;
          else if (specialShotType === 'ULTIMATE') particleColor = `hsl(${Date.now() / 20 % 360}, 100%, 70%)`;

          for (let i = 0; i < config.count; i++) {
              const angle = Math.random() * 2 * Math.PI;
              const speed = Math.random() * config.speed;
              spawnParticle(newParticles, {
                  position: { ...puck.position },
                  velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                  radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                  color: particleColor,
                  opacity: 0.9,
                  life: config.life,
                  decay: config.decay,
              });
          }
      }

      if (isNowMaxPower && Math.random() < 0.1) {
        const config = PARTICLE_CONFIG.MAX_POWER_IDLE;
        const angle = Math.random() * 2 * Math.PI;
        let particleColor = TEAM_COLORS[puck.team];
        if (specialShotType === 'ROYAL') particleColor = UI_COLORS.GOLD;
        else if (specialShotType === 'ULTIMATE') particleColor = `hsl(${Date.now() / 20 % 360}, 100%, 70%)`;

        spawnParticle(newParticles, {
            position: { x: puck.position.x + (Math.random() - 0.5) * puck.radius * 2.5, y: puck.position.y + (Math.random() - 0.5) * puck.radius * 2.5 },
            velocity: { x: Math.cos(angle) * config.speed, y: Math.sin(angle) * config.speed },
            radius: config.radius,
            color: particleColor,
            opacity: 0.8,
            life: config.life,
            decay: config.decay,
        });
      }

      if (!isCancelZone && power > 0.1 && Math.random() < 0.1) {
        const config = PARTICLE_CONFIG.AIM_FLOW;
        const angle = Math.atan2(shotVector.y, shotVector.x);
        const speed = config.speed * (0.5 + power * 1.5);
        
        let particleColor = TEAM_COLORS[puck.team];
        if (specialShotType === 'ULTIMATE') particleColor = `hsl(${Date.now() / 10 % 360}, 100%, 70%)`;
        else if (specialShotType === 'ROYAL') particleColor = UI_COLORS.GOLD;
        
        spawnParticle(newParticles, {
            position: { ...puck.position },
            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            radius: config.radius * (0.5 + power),
            color: particleColor,
            opacity: 0.9,
            life: config.life,
            decay: config.decay,
            renderType: 'aim_streak',
        });
    }
      
      const potentialLines = calculatePotentialLines(puck.id, prev.pucks);
      const shotAngle = Math.atan2(shotVector.y, shotVector.x);

      let bestLineIndex = -1;
      let minAngleDiff = Math.PI;

      potentialLines.forEach((line, index) => {
          const lineVector = subtractVectors(line.end, line.start);
          const lineAngle1 = Math.atan2(lineVector.y, lineVector.x);
          const lineAngle2 = Math.atan2(-lineVector.y, -lineVector.x);
          const diff1 = Math.abs(shotAngle - lineAngle1);
          const angleDiff1 = Math.min(diff1, 2 * Math.PI - diff1);
          const diff2 = Math.abs(shotAngle - lineAngle2);
          const angleDiff2 = Math.min(diff2, 2 * Math.PI - diff2);
          const minDiff = Math.min(angleDiff1, angleDiff2);

          if (minDiff < minAngleDiff && minDiff < Math.PI / 8) { // 22.5 degree tolerance
              minAngleDiff = minDiff;
              bestLineIndex = index;
          }
      });
      
      // Synergy Activation/Deactivation Logic
      if (!puck.activeSynergy) {
        if (bestLineIndex !== lastHighlightedLineIndexRef.current) {
          clearSynergyHoldTimer();
          const highlightedLine = (bestLineIndex !== -1) ? potentialLines[bestLineIndex] : null;
          if (highlightedLine?.synergyType) {
              playSound('SYNERGY_LOCK', { throttleMs: 200 });
              synergyHoldTimerRef.current = setTimeout(() => {
                  setGameState(p => {
                      const puckToCharge = p.pucks.find(puck => puck.id === mouseDownPuckId);
                      if (!puckToCharge || p.imaginaryLine?.highlightedLineIndex !== bestLineIndex) {
                          return p;
                      }
                      playSound('ROYAL_POWER_UNLOCKED');
                      const synergyType = highlightedLine.synergyType!;
                      const synergyInfo = SYNERGY_DESCRIPTIONS[synergyType];
                      setGameMessageWithTimeout(`¡${synergyInfo.name} activada!`.toUpperCase(), 'synergy', 3000, synergyType);

                      const newPucks = [...p.pucks];
                      const puckIndex = newPucks.findIndex(puc => puc.id === puckToCharge.id);
                      const newPuck = { ...newPucks[puckIndex] };
                      
                      const confirmConfig = PARTICLE_CONFIG.SYNERGY_CONFIRM;
                      const synergyColor = SYNERGY_EFFECTS[synergyType].color;
                      const newParticles = [...p.particles];
                      spawnParticle(newParticles, {
                          position: { ...newPuck.position },
                          velocity: { x: 0, y: 0 },
                          radius: 1,
                          color: synergyColor,
                          opacity: 1,
                          life: confirmConfig.life,
                          decay: confirmConfig.decay,
                          renderType: 'ring',
                      });

                      const lineVector = subtractVectors(highlightedLine.end, highlightedLine.start);
                      const lineAngle = Math.atan2(lineVector.y, lineVector.x);

                      newPuck.activeSynergy = {
                          type: synergyType,
                          initialStats: { mass: newPuck.mass, friction: newPuck.friction, elasticity: newPuck.elasticity, swerveFactor: newPuck.swerveFactor },
                          lineAngle: lineAngle,
                      };
                      
                      const effects = SYNERGY_EFFECTS[synergyType];
                      if (effects.statModifiers) {
                          if (effects.statModifiers.elasticity) newPuck.elasticity = effects.statModifiers.elasticity;
                      }
                      newPucks[puckIndex] = newPuck;

                      return {...p, pucks: newPucks, particles: newParticles };
                  });
              }, SYNERGY_HOLD_DURATION);
          }
          lastHighlightedLineIndexRef.current = bestLineIndex;
        }
      } else { // Synergy is already active
          // BUG FIX: If player moves aim away from an active synergy, deactivate it.
          const highlightedLine = (bestLineIndex !== -1) ? potentialLines[bestLineIndex] : null;
          // Deactivate if we are no longer on a line OR the line's synergy doesn't match the active one.
          if (!highlightedLine || highlightedLine.synergyType !== puck.activeSynergy.type) {
              nextPucks = cancelActiveSynergy(prev.pucks, puck.id);
          }
      }
        
        const highlightedLine = (bestLineIndex !== -1) ? potentialLines[bestLineIndex] : null;
        if (highlightedLine?.synergyType && Math.random() < 0.1) {
          const config = PARTICLE_CONFIG.SYNERGY_CHARGE;
          const color = SYNERGY_EFFECTS[highlightedLine.synergyType].color;
          [highlightedLine.sourcePuckIds[0], highlightedLine.sourcePuckIds[1]].forEach(sourceId => {
              const sourcePuck = prev.pucks.find(p => p.id === sourceId);
              if (sourcePuck) {
                  const travelVec = subtractVectors(puck.position, sourcePuck.position);
                  const dist = getVectorMagnitude(travelVec);
                  if (dist > 0) {
                      const travelTime = config.life; // travel time in frames
                      const speed = dist / travelTime;
                      spawnParticle(newParticles, {
                           position: { ...sourcePuck.position },
                           velocity: { x: travelVec.x / dist * speed, y: travelVec.y / dist * speed },
                           radius: config.radius,
                           color,
                           opacity: 1,
                           life: travelTime,
                           decay: 0,
                           renderType: 'synergy_charge',
                      });
                  }
              }
          });
        }
      
      const newImaginaryLine: ImaginaryLineState = prev.imaginaryLine ? {
          ...prev.imaginaryLine,
          lines: potentialLines,
          shotPuckId: puck.id,
          highlightedLineIndex: bestLineIndex,
      } : null;

      return {
          ...prev,
          pucks: nextPucks,
          shotPreview: { start: puck.position, end: currentPos, isMaxPower: isNowMaxPower, isCancelZone, specialShotType, power },
          particles: newParticles,
          imaginaryLine: newImaginaryLine,
          infoCardPuckId: null, // Hide info card on drag
          previewState: null,
      };
    });
  }, [playSound, clearSynergyHoldTimer, clearInfoCardTimer, setGameMessageWithTimeout, cancelActiveSynergy]);

  const handleMouseUp = useCallback((endPos: Vector | null) => {
    clearInfoCardTimer();
    
    const { mouseDownPuckId, isDragging, justSelected } = dragStateRef.current;
    
    clearSynergyHoldTimer();
    dragStateRef.current = { mouseDownPuckId: null, isDragging: false, startPos: null, justSelected: false };
    
    if (mouseDownPuckId === null) {
      return;
    }

    if (!isDragging) {
      if (justSelected) {
        return;
      }
      setGameState(prev => {
        if (mouseDownPuckId === prev.selectedPuckId) {
          playSound('UI_CLICK_2');
          const newPucks = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
          lineGridRef.current = null;
          return {
            ...prev,
            pucks: newPucks,
            selectedPuckId: null,
            infoCardPuckId: null,
            shotPreview: null,
            imaginaryLine: null,
            previewState: null,
          };
        }
        return prev;
      });
      return;
    }

    setGameState(prev => {
        const puckToShoot = prev.pucks.find(p => p.id === mouseDownPuckId);
        if (!puckToShoot) {
            lineGridRef.current = null;
            return { ...prev, selectedPuckId: null, shotPreview: null, imaginaryLine: null, previewState: null, infoCardPuckId: null };
        }

        const finalEndPos = endPos || prev.shotPreview?.end;
        if (!finalEndPos) {
            playSound('UI_CLICK_2');
            const newPucks = cancelActiveSynergy(prev.pucks, mouseDownPuckId);
            lineGridRef.current = null;
            return {
                ...prev,
                pucks: newPucks,
                shotPreview: null,
                imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, highlightedLineIndex: null } : null,
                previewState: null,
            };
        }
    
        const launchVectorRaw = subtractVectors(puckToShoot.position, finalEndPos);
        const launchDistance = getVectorMagnitude(launchVectorRaw);

        if (launchDistance < CANCEL_SHOT_THRESHOLD) {
            playSound('UI_CLICK_2');
            const newPucks = cancelActiveSynergy(prev.pucks, mouseDownPuckId);
            lineGridRef.current = null;
            return {
                ...prev,
                pucks: newPucks,
                selectedPuckId: null,
                infoCardPuckId: null,
                shotPreview: null,
                imaginaryLine: null,
                previewState: null,
            };
        }
        
        const cappedDistance = Math.min(launchDistance, MAX_DRAG_FOR_POWER);
        const launchVector = {
            x: (launchVectorRaw.x / launchDistance) * cappedDistance,
            y: (launchVectorRaw.y / launchDistance) * cappedDistance,
        };

        let newPucks = [...prev.pucks.map(p => ({ ...p, temporaryEffects: [...p.temporaryEffects] }))];
        let puckIndex = newPucks.findIndex(p => p.id === mouseDownPuckId);
        const puckBeingShot = newPucks[puckIndex];

        if (puckBeingShot.activeSynergy) {
            const shotAngle = Math.atan2(launchVectorRaw.y, launchVectorRaw.x);
            const synergyAngle = puckBeingShot.activeSynergy.lineAngle;

            const diff1 = Math.abs(shotAngle - synergyAngle);
            const angleDiff1 = Math.min(diff1, 2 * Math.PI - diff1);
            
            const diff2 = Math.abs(shotAngle - (synergyAngle + Math.PI));
            const angleDiff2 = Math.min(diff2, 2 * Math.PI - diff2);

            const minAngleDiff = Math.min(angleDiff1, angleDiff2);
            const SYNERGY_ANGLE_TOLERANCE = Math.PI / 8;

            if (minAngleDiff > SYNERGY_ANGLE_TOLERANCE) {
                playSound('UI_CLICK_2');
                
                const initialStats = puckBeingShot.activeSynergy.initialStats;
                puckBeingShot.mass = initialStats.mass;
                puckBeingShot.friction = initialStats.friction;
                puckBeingShot.elasticity = initialStats.elasticity;
                puckBeingShot.swerveFactor = initialStats.swerveFactor;
                
                delete puckBeingShot.activeSynergy;
            }
        }
        
        const isPulsarShot = prev.pulsarShotArmed === puckBeingShot.team;
        const specialShotType = puckBeingShot.puckType === 'KING' ? prev.specialShotStatus[puckBeingShot.team] : 'NONE';
        
        let powerMultiplier = isPulsarShot ? LAUNCH_POWER_MULTIPLIER * 2.5 : LAUNCH_POWER_MULTIPLIER;
        let newScreenShake = 0;
        
        if (specialShotType === 'ROYAL') {
            powerMultiplier *= ROYAL_SHOT_POWER_MULTIPLIER;
            newScreenShake = 15;
        } else if (specialShotType === 'ULTIMATE') {
            powerMultiplier *= ULTIMATE_SHOT_POWER_MULTIPLIER;
            newScreenShake = 20;
        }

        const puckProps = PUCK_TYPE_PROPERTIES[puckBeingShot.puckType];
        if (puckProps.powerFactor) {
            powerMultiplier *= puckProps.powerFactor;
        }

        let newParticles = [...prev.particles];
        let newSpecialShotStatus = { ...prev.specialShotStatus };
        let newPulsarPower = { ...prev.pulsarPower };

        // CRITICAL BUG FIX: Consume Special Shot resources immediately on firing.
        // This prevents an exploit where a goal scored with a special shot would not consume it.
        if (specialShotType === 'ROYAL' || specialShotType === 'ULTIMATE') {
            const shotTeam = puckBeingShot.team;

            // Reset pulsar power bar to 0 for the team.
            newPulsarPower[shotTeam] = 0;

            // Uncharge all pucks for the team to consume the shot.
            newPucks.forEach(p => {
                if (p.team === shotTeam) {
                    p.isCharged = false;
                }
            });
        }
        
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
        
        const highlightedLine = prev.imaginaryLine && prev.imaginaryLine.highlightedLineIndex !== null
          ? prev.imaginaryLine.lines[prev.imaginaryLine.highlightedLineIndex]
          : null;
          
        if (highlightedLine?.passivelyCrossedBy.size > 0) {
            highlightedLine.passivelyCrossedBy.forEach(ghostId => {
                const ghostPuckIndex = newPucks.findIndex(p => p.id === ghostId);
                if (ghostPuckIndex !== -1) {
                    newPucks[ghostPuckIndex].temporaryEffects.push({ type: 'PHASED', duration: GHOST_PHASE_DURATION });
                }
            });
        }
        
        const activeSynergyType = puckBeingShot.activeSynergy?.type;
        if (activeSynergyType) {
            const synergyAbility = SYNERGY_EFFECTS[activeSynergyType].ability;
            if (synergyAbility === 'GHOST_ON_LAUNCH') {
                 puckBeingShot.temporaryEffects.push({ type: 'PHASED', duration: SYNERGY_GHOST_PHASE_DURATION });
            } else if (synergyAbility === 'REPULSOR_AURA') {
                 puckBeingShot.temporaryEffects.push({ type: 'REPULSOR_ARMOR', duration: REPULSOR_ARMOR_DURATION });
            } else if (synergyAbility === 'GRAVITY_ON_COLLISION' || synergyAbility === 'TELEPORT_ON_COLLISION') {
                 puckBeingShot.synergyEffectTriggered = false;
            }
        }
        
        if (specialShotType === 'ROYAL') {
            playSound('ROYAL_SHOT');
            const config = PARTICLE_CONFIG.ROYAL_SHOT_LAUNCH;
            for (let i = 0; i < config.count; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = Math.random() * config.speed;
                spawnParticle(newParticles, {
                    position: { ...puckToShoot.position },
                    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                    color: UI_COLORS.GOLD,
                    opacity: 1, life: config.life, decay: config.decay,
                });
            }
            puckBeingShot.temporaryEffects.push({ type: 'ROYAL_RAGE', duration: 300, destroyedCount: 0 });
            newSpecialShotStatus[puckToShoot.team] = 'NONE';
        } else if (specialShotType === 'ULTIMATE') {
            playSound('ULTIMATE_SHOT');
            const config = PARTICLE_CONFIG.ULTIMATE_SHOT_LAUNCH;
            for (let i = 0; i < config.count; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = Math.random() * config.speed;
                spawnParticle(newParticles, {
                    position: { ...puckToShoot.position },
                    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                    color: `hsl(${i * 2 % 360}, 100%, 70%)`,
                    opacity: 1, life: config.life, decay: config.decay,
                });
            }
            puckBeingShot.temporaryEffects.push({ type: 'ULTIMATE_RAGE', duration: 400, destroyedCount: 0 });
            newSpecialShotStatus[puckToShoot.team] = 'NONE';
        } else if (isPulsarShot) {
            playSound('PULSAR_SHOT');
            const config = PARTICLE_CONFIG.PULSAR_LAUNCH;
            for (let i = 0; i < config.count; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speed = Math.random() * config.speed;
                spawnParticle(newParticles, {
                    position: { ...puckToShoot.position },
                    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                    radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                    color: TEAM_COLORS[puckToShoot.team],
                    opacity: 1, life: config.life, decay: config.decay,
                });
            }
        } else {
          playSound('SHOT');
           const shotConfig = PARTICLE_CONFIG.SHOT_BURST;
          const angle = Math.atan2(launchVector.y, launchVector.x);
          for(let i = 0; i < shotConfig.count; i++) {
              const particleAngle = angle + Math.PI + (Math.random() - 0.5) * 1.5;
              const speed = Math.random() * shotConfig.speed;
              spawnParticle(newParticles, {
                  position: { ...puckToShoot.position },
                  velocity: { x: Math.cos(particleAngle) * speed, y: Math.sin(particleAngle) * speed },
                  radius: shotConfig.minRadius + Math.random() * shotConfig.maxRadius - shotConfig.minRadius,
                  color: TEAM_COLORS[puckToShoot.team],
                  opacity: 0.9,
                  life: shotConfig.life,
                  decay: shotConfig.decay,
              });
          }
        }

        const finalLaunchVelocity = {
            x: (launchVector.x * powerMultiplier) / puckBeingShot.mass, 
            y: (launchVector.y * powerMultiplier) / puckBeingShot.mass 
        };
        puckBeingShot.velocity = finalLaunchVelocity;
        newPucks[puckIndex] = puckBeingShot;

        const newLineGrid = new Map<string, number[]>();
        if (prev.imaginaryLine) {
            prev.imaginaryLine.lines.forEach((line, index) => {
                const cells = getCellsForSegment(line.start, line.end);
                cells.forEach(key => {
                    if (!newLineGrid.has(key)) {
                        newLineGrid.set(key, []);
                    }
                    newLineGrid.get(key)!.push(index);
                });
            });
        }
        lineGridRef.current = newLineGrid;

        return {
          ...prev,
          pucks: newPucks,
          particles: newParticles,
          isSimulating: true,
          canShoot: false,
          selectedPuckId: null,
          infoCardPuckId: null,
          shotPreview: null,
          imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, isConfirmed: true } : null,
          previewState: null,
          pucksShotThisTurn: [...prev.pucksShotThisTurn, puckToShoot.id],
          pulsarShotArmed: isPulsarShot ? null : prev.pulsarShotArmed,
          pulsarPower: isPulsarShot ? { ...newPulsarPower, [puckToShoot.team]: 0 } : newPulsarPower,
          specialShotStatus: newSpecialShotStatus,
          lastShotWasSpecial: specialShotType,
          screenShake: newScreenShake,
          orbHitsThisShot: 0,
        };
      });
  }, [playSound, clearSynergyHoldTimer, clearInfoCardTimer, cancelActiveSynergy]);

  const handleBoardMouseDown = useCallback(() => {
    clearInfoCardTimer();
    setGameState(prev => {
      if (prev.isSimulating || dragStateRef.current.mouseDownPuckId !== null) {
        return prev;
      }

      if (prev.selectedPuckId !== null) {
        playSound('UI_CLICK_2');
        clearSynergyHoldTimer();
        lineGridRef.current = null;
        // BUG FIX #3: When deselecting, revert any active synergy stats.
        const newPucks = cancelActiveSynergy(prev.pucks, prev.selectedPuckId);
        return { ...prev, pucks: newPucks, selectedPuckId: null, infoCardPuckId: null, shotPreview: null, previewState: null, imaginaryLine: null, bonusTurnForTeam: null };
      }
      
      return prev;
    });
  }, [playSound, clearSynergyHoldTimer, clearInfoCardTimer, cancelActiveSynergy]);

  const handleActivatePulsar = useCallback(() => {
    setGameState(prev => {
        // Prevent interaction during simulation or if the player can't shoot.
        if (prev.isSimulating || !prev.canShoot) {
            return prev;
        }

        // If it's already armed for the current team, disarm it (cancel).
        if (prev.pulsarShotArmed === prev.currentTurn) {
            playSound('UI_CLICK_2'); // A deactivation/cancel sound
            return { ...prev, pulsarShotArmed: null };
        } 
        
        // If it's not armed, and the power is full for the current team, arm it.
        if (!prev.pulsarShotArmed && prev.pulsarPower[prev.currentTurn] >= MAX_PULSAR_POWER) {
            playSound('PULSAR_ACTIVATE');
            return { ...prev, pulsarShotArmed: prev.currentTurn };
        }
        
        // In any other case (e.g., not enough power), do nothing.
        return prev;
    });
  }, [playSound]);

  return { gameState, handleMouseDown, handleMouseMove, handleMouseUp, resetGame, handleBoardMouseDown, handleActivatePulsar, clearTurnLossReason, clearBonusTurn };
};
