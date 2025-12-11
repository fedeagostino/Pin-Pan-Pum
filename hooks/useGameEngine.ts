import { useState, useEffect, useCallback, useRef } from 'react';
import { Puck, Team, Vector, GameState, ImaginaryLineState, PuckType, Particle, ImaginaryLine, TemporaryEffect, PreviewState, PuckTrajectory, SpecialShotStatus, TurnLossReason } from '../types';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
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
  COMBO_BONUSES,
  SHOCKWAVE_COLORS,
  PERFECT_CROSSING_THRESHOLD,
  PERFECT_CROSSING_BONUS,
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
  ROYAL_SHOT_DESTROY_LIMIT,
  ULTIMATE_SHOT_POWER_MULTIPLIER,
  ULTIMATE_SHOT_DESTROY_LIMIT,
  TURNS_PER_ORB_SPAWN,
  ORBS_FOR_OVERCHARGE,
  OVERCHARGE_REPULSOR_RADIUS,
  OVERCHARGE_REPULSOR_FORCE,
  GUARDIAN_PUCK_RADIUS,
  GUARDIAN_DURABILITY,
} from '../constants';

// RED scores in the TOP goal, BLUE scores in the BOTTOM goal.
const GOAL_Y_BLUE_SCORES = 0; // This is the TOP goal, visually blue
const GOAL_Y_RED_SCORES = BOARD_HEIGHT; // This is the BOTTOM goal, visually red
const GOAL_X_MIN = (BOARD_WIDTH - GOAL_WIDTH) / 2;
const GOAL_X_MAX = (BOARD_WIDTH + GOAL_WIDTH) / 2;

// Expanded viewBox to include the goal depth at top and bottom so players/goals aren't cut off
const VIEWBOX_STRING = `0 -${GOAL_DEPTH} ${BOARD_WIDTH} ${BOARD_HEIGHT + GOAL_DEPTH * 2}`;

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

    const denominator = -s2_x * s1_y + s1_x * s2_y;
    if (denominator === 0) return null; // Collinear or parallel

    const s = (-s1_y * (a.x - c.x) + s1_x * (a.y - c.y)) / denominator;
    const t = ( s2_x * (a.y - c.y) - s2_y * (a.x - c.x)) / denominator;

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
                radius: type === 'KING' ? KING_PUCK_RADIUS : (type === 'PAWN' ? PAWN_PUCK_RADIUS : GUARDIAN_PUCK_RADIUS),
                isCharged: false,
                elasticity: properties.elasticity,
                temporaryEffects: [],
            };

            if (type === 'PAWN') {
                newPuck.durability = PAWN_DURABILITY;
            }
            if (type === 'GUARDIAN') {
                newPuck.durability = GUARDIAN_DURABILITY;
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
    const selectedPuckType = puck.puckType;
    
    const isSpecialForCharging = (p: Puck) => p.puckType !== 'PAWN';

    const lineSources: Puck[][] = [];
    if (selectedPuckType === 'PAWN') {
        const pawns = teamPucks.filter(p => p.puckType === 'PAWN');
        const specials = teamPucks.filter(isSpecialForCharging);
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
    } else { // King or Guardian
        const specials = teamPucks.filter(isSpecialForCharging);
        if (specials.length >= 2) lineSources.push(...generateCombinations(specials, 2));
        const pawns = teamPucks.filter(p => p.puckType === 'PAWN');
        if (pawns.length >= 2) lineSources.push(...generateCombinations(pawns, 2));
    }
    
    lineSources.forEach(pair => {
        const line = { start: pair[0].position, end: pair[1].position };
        const sourceIds = new Set([pair[0].id, pair[1].id]);
        const isObstructed = allPucks.some(p => 
            !sourceIds.has(p.id) &&
            isPuckOnLineSegment(p, line.start, line.end)
        );
        if (!isObstructed) {
            allPotentialLines.push({ ...line, sourcePuckIds: [pair[0].id, pair[1].id], passivelyCrossedBy: new Set() });
        }
    });
    return allPotentialLines;
};

// --- PREVIEW SIMULATION ---
const runPreviewSimulation = (initialPucks: Puck[], shotPuckId: number, shotVector: Vector, power: number): { trajectories: PuckTrajectory[] } => {
    // Deep copy pucks to avoid mutating real state
    let simPucks = JSON.parse(JSON.stringify(initialPucks)) as Puck[];
    const trajectories: Map<number, Vector[]> = new Map();

    // Apply initial shot
    const puckIndex = simPucks.findIndex(p => p.id === shotPuckId);
    if (puckIndex === -1) return { trajectories: [] };

    const puckToShoot = simPucks[puckIndex];
    const launchDistance = getVectorMagnitude(shotVector);
    if (launchDistance === 0) return { trajectories: [] };

    const powerMultiplier = LAUNCH_POWER_MULTIPLIER * (PUCK_TYPE_PROPERTIES[puckToShoot.puckType].powerFactor || 1);
    const finalLaunchPower = power * MAX_DRAG_FOR_POWER * powerMultiplier;

    const launchVelocity = {
        x: (shotVector.x / launchDistance) * finalLaunchPower,
        y: (shotVector.y / launchDistance) * finalLaunchPower,
    };

    puckToShoot.velocity = {
        x: launchVelocity.x / puckToShoot.mass,
        y: launchVelocity.y / puckToShoot.mass,
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
 */
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
  const animationFrameId = useRef<number | null>(null);
  const ambientAnimationFrameId = useRef<number | null>(null);
  const particleIdCounter = useRef(0);
  const particlePool = useRef<Particle[]>([]);
  const floatingTextIdCounter = useRef(0);
  const roundEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{ mouseDownPuckId: number | null, isDragging: boolean, startPos: Vector | null, justSelected: boolean }>({ mouseDownPuckId: null, isDragging: false, startPos: null, justSelected: false });
  const inactivityStateRef = useRef<{ timeout: ReturnType<typeof setTimeout> | null; interval: ReturnType<typeof setInterval> | null }>({ timeout: null, interval: null });
  const infoCardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineGridRef = useRef<Map<string, number[]> | null>(null);
  
  const setGameMessageWithTimeout = useCallback((text: string, type: 'royal' | 'ultimate' | 'powerup', duration: number = 3000) => {
      if (gameMessageTimeoutRef.current) {
          clearTimeout(gameMessageTimeoutRef.current);
      }
      setGameState(prev => ({...prev, gameMessage: { text, type }}));
      gameMessageTimeoutRef.current = setTimeout(() => {
          setGameState(prev => ({...prev, gameMessage: null}));
      }, duration);
  }, []);

  const clearInfoCardTimer = useCallback(() => {
    if (infoCardTimerRef.current) {
        clearTimeout(infoCardTimerRef.current);
        infoCardTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
        clearInfoCardTimer();
        if (gameMessageTimeoutRef.current) clearTimeout(gameMessageTimeoutRef.current);
    };
  }, [clearInfoCardTimer]);

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
          // This ensures the loop only restarts if it was explicitly stopped.
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

      // --- Particle Spawning Helper ---
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
                  return false;
              }
              effect.duration--;
              return effect.duration > 0;
          });
      });

      // --- Update Particles ---
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
              particlePool.current.push(p);
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
          
          vSq = getVectorMagnitudeSq(puck.velocity);
          
          if (vSq < MIN_VELOCITY_TO_STOP * MIN_VELOCITY_TO_STOP) {
            puck.velocity = { x: 0, y: 0 };
          } else {
            if (vSq > fastestPuckSpeedSq) {
              fastestPuckSpeedSq = vSq;
            }
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
            const velocityMagnitude = Math.sqrt(vSq);
            if (velocityMagnitude > 0.8 && puck.puckType === 'KING') {
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
                        newOrbCollection[puck.team] = 0;
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

                        if (puckNew.puckType === 'GUARDIAN') {
                            puckNew.temporaryEffects.push({ type: 'EMP_BURST', duration: 1 });
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
                            
                            const comboBonus = COMBO_BONUSES[newImaginaryLine.comboCount] || (newImaginaryLine.comboCount > 4 ? 2.0 : 1.0);
                            const finalPowerGained = Math.round(powerGained * comboBonus);
                            newPulsarPower[prev.currentTurn] = Math.min(MAX_PULSAR_POWER, newPulsarPower[prev.currentTurn] + finalPowerGained);
                            
                            const chargeConfig = PARTICLE_CONFIG.PULSAR_CHARGE;
                            const team = prev.currentTurn;
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

                            let powerText = `+${finalPowerGained}`;
                            let textColor = '#a3e635';
                            if (isPerfect) {
                                powerText += ` ¡Perfecto!`;
                                textColor = '#fde047';
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
        });
      }

      // --- Handle collisions ---
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
        
        // Wall collisions
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
            if ((puck.puckType === 'PAWN' || puck.puckType === 'GUARDIAN') && puck.durability !== undefined && impactVelocity > 2.0) {
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
            if (otherPuckId <= puck.id) return;
            const otherPuck = puckMap.get(otherPuckId);
            if (!otherPuck) return;

            if (puckIdsToDestroy.has(puck.id) || puckIdsToDestroy.has(otherPuck.id)) return;
  
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
                return;
              }
            }
  
            const distVec = subtractVectors(otherPuck.position, puck.position);
            const distance = getVectorMagnitude(distVec);
            const collisionDistance = puck.radius + otherPuck.radius;
  
            if (distance < collisionDistance) {
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
  
              if (impactForce > 2.5) {
                if ((puck.puckType === 'PAWN' || puck.puckType === 'GUARDIAN') && puck.durability !== undefined) {
                    puck.durability--;
                }
                if ((otherPuck.puckType === 'PAWN' || otherPuck.puckType === 'GUARDIAN') && otherPuck.durability !== undefined) {
                    otherPuck.durability--;
                }
              }
  
              const config = PARTICLE_CONFIG.COLLISION;
              const particleCount = Math.min(5, Math.floor(impactForce * 0.5));
  
              for (let k = 0; k < particleCount; k++) {
                  const angle = Math.atan2(distVec.y, distVec.x) + (Math.random() - 0.5) * Math.PI;
                  const speed = 1 + Math.random() * (impactForce / 4);
                  spawnParticle(newParticles, {
                      position: { x: puck.position.x + distVec.x/2, y: puck.position.y + distVec.y/2 },
                      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                      radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
                      color: Math.random() > 0.5 ? TEAM_COLORS[puck.team] : TEAM_COLORS[otherPuck.team],
                      opacity: 0.9,
                      life: config.life,
                      decay: config.decay,
                  });
              }
            }
        });
        
        // --- GOAL LOGIC ---
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
                
                } else { // VALID GOAL
                    roundWinner = scoringTeam;
                    scoringPuck = puck;
                    playSound('GOAL_SCORE');
                        
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

      // --- Handle Pawn/Guardian Destruction ---
      newPucks.forEach(puck => {
        if ((puck.puckType === 'PAWN' || puck.puckType === 'GUARDIAN') && puck.durability !== undefined && puck.durability <= 0) {
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

      // Tension-based camera logic
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
            newPucks.forEach(p => { p.velocity = {x: 0, y: 0}; });
            const pointsScored = PUCK_GOAL_POINTS[scoringPuck.puckType] || 0;
            const newScore = { ...prev.score };
            newScore[roundWinner] += pointsScored;

            const finalWinner = checkWinner(newScore);

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
                score: newScore,
                winner: finalWinner,
                gameMessage: null,
                bonusTurnForTeam: null,
                screenShake: 0,
                turnLossReason: null, 
            };
        }

        // --- NORMAL END OF TURN (NO GOAL) ---
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
            p.temporaryEffects = p.temporaryEffects.filter(effect => 
                effect.type === 'REPULSOR_ARMOR'
            );
        });
        
        if (nextTurn !== prev.currentTurn) {
            newTurnCount++;
            if (newTurnCount > 0 && (newTurnCount % TURNS_PER_ORB_SPAWN === 0)) {
                const ORB_RADIUS = 8;
                const totalPerimeter = 2 * (BOARD_WIDTH + BOARD_HEIGHT);
                const orbDiameterOnPerimeter = (ORB_RADIUS * 2) / totalPerimeter;

                let newProgress;
                let attempts = 0; 
                do {
                    newProgress = Math.random();
                    attempts++;
                    if (attempts > 100) break; 
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
        let newOrbitingParticles = [...prev.orbitingParticles];
        
        const spawnParticle = (props: Omit<Particle, 'id' | 'lifeSpan'> & { life: number }) => {
            const p = particlePool.current.pop();
            const finalProps = { ...props, lifeSpan: props.life };
            if (p) {
                Object.assign(p, finalProps, { id: particleIdCounter.current++ });
                newParticles.push(p);
            } else {
                newParticles.push({ ...finalProps, id: particleIdCounter.current++ } as Particle);
            }
        };

        const activeParticles: Particle[] = [];
        for (const p of newParticles) {
            p.life -= 1;
            p.opacity -= p.decay;
            if (p.life > 0 && p.opacity > 0) {
                if (p.renderType === 'orbiting') {
                     // Orbiting logic update for ambient mode
                     if (p.progress !== undefined && p.speed !== undefined) {
                        p.progress = (p.progress + p.speed) % 1;
                        const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
                        const prog = p.progress * totalPerimeter;
                        if (prog < BOARD_WIDTH) { p.position = { x: prog, y: 0 }; }
                        else if (prog < BOARD_WIDTH + BOARD_HEIGHT) { p.position = { x: BOARD_WIDTH, y: prog - BOARD_WIDTH }; }
                        else if (prog < 2 * BOARD_WIDTH + BOARD_HEIGHT) { p.position = { x: BOARD_WIDTH - (prog - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT }; }
                        else { p.position = { x: 0, y: BOARD_HEIGHT - (prog - (2 * BOARD_WIDTH + BOARD_HEIGHT)) }; }
                    }
                }
                activeParticles.push(p);
            } else {
                particlePool.current.push(p);
            }
        }
        newParticles = activeParticles;

         // Ambient Orbiting Particles Logic
        newOrbitingParticles.forEach(orb => {
            if (orb.progress !== undefined && orb.speed !== undefined) {
                orb.progress = (orb.progress + orb.speed) % 1;
                const totalPerimeter = 2 * BOARD_WIDTH + 2 * BOARD_HEIGHT;
                const p = orb.progress * totalPerimeter;
                 if (p < BOARD_WIDTH) { orb.position = { x: p, y: 0 }; }
                 else if (p < BOARD_WIDTH + BOARD_HEIGHT) { orb.position = { x: BOARD_WIDTH, y: p - BOARD_WIDTH }; }
                 else if (p < 2 * BOARD_WIDTH + BOARD_HEIGHT) { orb.position = { x: BOARD_WIDTH - (p - (BOARD_WIDTH + BOARD_HEIGHT)), y: BOARD_HEIGHT }; }
                 else { orb.position = { x: 0, y: BOARD_HEIGHT - (p - (2 * BOARD_WIDTH + BOARD_HEIGHT)) }; }
            }
        });

        // Ambient Spawning (Idle effects)
        prev.pucks.forEach(puck => {
             if (Math.random() < 0.005) {
                // Subtle glint
             }
             if (puck.isCharged && Math.random() < 0.02) {
                 const config = PARTICLE_CONFIG.IDLE_PULSE || { life: 40, decay: 0.02, radius: 2 };
                 spawnParticle({
                     position: { ...puck.position },
                     velocity: { x: 0, y: 0 },
                     radius: puck.radius,
                     color: '#fde047',
                     opacity: 0.6,
                     life: config.life,
                     decay: config.decay,
                     renderType: 'idle_pulse',
                     puckType: puck.puckType,
                     rotation: puck.rotation,
                 });
             }
        });

        ambientAnimationFrameId.current = requestAnimationFrame(ambientLoop);
        return {
            ...prev,
            particles: newParticles,
            orbitingParticles: newOrbitingParticles,
        };
    });
  }, []);

  useEffect(() => {
    if (gameState.isSimulating) {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
    } else {
        if (!ambientAnimationFrameId.current) {
            ambientAnimationFrameId.current = requestAnimationFrame(ambientLoop);
        }
    }
    return () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (ambientAnimationFrameId.current) cancelAnimationFrame(ambientAnimationFrameId.current);
    };
  }, [gameState.isSimulating, gameLoop, ambientLoop]);

  const handleMouseDown = useCallback((puckId: number, pos: Vector) => {
    setGameState(prev => {
      if (prev.isSimulating || !prev.canShoot) {
          const clickedPuck = prev.pucks.find(p => p.id === puckId);
          // Show info card if not in simulation or turn
          if (clickedPuck && prev.infoCardPuckId !== puckId) {
             // Clear existing timer
             if (infoCardTimerRef.current) clearTimeout(infoCardTimerRef.current);
             
             // Set new timer to clear info card after 3 seconds
             infoCardTimerRef.current = setTimeout(() => {
                 setGameState(gs => ({ ...gs, infoCardPuckId: null }));
                 infoCardTimerRef.current = null;
             }, 3000);
             
             playSound('UI_CLICK_1');
             return { ...prev, infoCardPuckId: puckId };
          }
          return prev;
      }
      
      const puck = prev.pucks.find(p => p.id === puckId);
      if (!puck) return prev;

      if (puck.team !== prev.currentTurn) {
         // Show info card for opponent pucks
         if (prev.infoCardPuckId !== puckId) {
             if (infoCardTimerRef.current) clearTimeout(infoCardTimerRef.current);
             infoCardTimerRef.current = setTimeout(() => {
                 setGameState(gs => ({ ...gs, infoCardPuckId: null }));
                 infoCardTimerRef.current = null;
             }, 3000);
             playSound('UI_CLICK_1');
             return { ...prev, infoCardPuckId: puckId };
         }
         return prev;
      }

      if (prev.pucksShotThisTurn.includes(puckId)) return prev;

      dragStateRef.current = { mouseDownPuckId: puckId, isDragging: false, startPos: pos, justSelected: true };
      
      const potentialLines = calculatePotentialLines(puckId, prev.pucks);

      // --- NEW: BUILD SPATIAL GRID FOR LINE CROSSING DETECTION ---
      // This allows the high-performance physics loop to quickly check for line crossings.
      const grid = new Map<string, number[]>();
      potentialLines.forEach((line, index) => {
          const cells = getCellsForSegment(line.start, line.end);
          cells.forEach(cellKey => {
              if (!grid.has(cellKey)) grid.set(cellKey, []);
              grid.get(cellKey)!.push(index);
          });
      });
      lineGridRef.current = grid;
      // -----------------------------------------------------------

      const isPawn = puck.puckType === 'PAWN';
      const linesToCross = PUCK_TYPE_PROPERTIES[puck.puckType].linesToCrossForBonus;
      const chargeText = isPawn 
        ? "Cruza entre 2 peones y 1 especial para cargar" 
        : `Cruza ${linesToCross} línea${linesToCross > 1 ? 's' : ''} para cargar`;

      playSound('PUCK_SELECT');

      return {
        ...prev,
        selectedPuckId: puckId,
        infoCardPuckId: null, // Clear info card on selection
        previewState: {
            leadPuckId: puckId,
            trajectories: [],
            potentialLines,
            linesToCrossForBonus: linesToCross,
            chargeRequirementText: chargeText,
        },
        imaginaryLine: {
            lines: potentialLines,
            isConfirmed: false,
            crossedLineIndices: new Set(),
            pawnPawnLinesCrossed: new Set(),
            pawnSpecialLinesCrossed: new Set(),
            shotPuckId: puckId,
            comboCount: 0,
            highlightedLineIndex: null, // Reset highlight
        }
      };
    });
  }, [playSound]);

  const handleMouseMove = useCallback((pos: Vector) => {
    if (dragStateRef.current.mouseDownPuckId === null) return;

    if (!dragStateRef.current.isDragging) {
      const dist = getVectorMagnitude(subtractVectors(pos, dragStateRef.current.startPos!));
      if (dist > MIN_DRAG_DISTANCE) {
        dragStateRef.current.isDragging = true;
        setGameState(prev => ({...prev, isCameraInTensionMode: true}));
      }
    }

    if (dragStateRef.current.isDragging) {
      setGameState(prev => {
        const start = dragStateRef.current.startPos!;
        const end = pos;
        const dragVector = subtractVectors(start, end);
        const dragDistance = getVectorMagnitude(dragVector);
        
        const power = Math.min(dragDistance, MAX_DRAG_FOR_POWER) / MAX_DRAG_FOR_POWER;
        const isCancelZone = dragDistance < CANCEL_SHOT_THRESHOLD;

        let specialShotType: SpecialShotStatus = 'NONE';
        const puck = prev.pucks.find(p => p.id === dragStateRef.current.mouseDownPuckId);
        if (puck && prev.pulsarShotArmed === puck.team) {
            // Pulsar shot overrides standard special shots visually
        } else if (puck && puck.puckType === 'KING') {
             specialShotType = prev.specialShotStatus[puck.team];
        }

        // --- NEW: Run Aim Simulation ---
        // This simulates the shot to see if it will hit any lines.
        let highlightedLineIndex: number | null = null;
        if (!isCancelZone && prev.previewState && prev.previewState.potentialLines.length > 0 && puck) {
             const { trajectories } = runPreviewSimulation(prev.pucks, puck.id, dragVector, power);
             const myTrajectory = trajectories.find(t => t.puckId === puck.id);
             
             if (myTrajectory && myTrajectory.path.length > 1) {
                 const path = myTrajectory.path;
                 // Check intersection with each potential line
                 for (let i = 0; i < prev.previewState.potentialLines.length; i++) {
                     const line = prev.previewState.potentialLines[i];
                     // Only check interaction if neither source is the shooting puck (which is always true by definition of potentialLines)
                     
                     // Optimization: Check if path intersects line segment
                     let intersects = false;
                     // We check segments of the trajectory
                     for (let j = 0; j < path.length - 1; j++) {
                         if (getLineIntersection(path[j], path[j+1], line.start, line.end)) {
                             intersects = true;
                             break;
                         }
                     }
                     
                     if (intersects) {
                         highlightedLineIndex = i;
                         break; // Highlight the first one we hit
                     }
                 }
             }
        }
        // -------------------------------

        return {
          ...prev,
          shotPreview: {
            start,
            end,
            isMaxPower: power >= 1,
            isCancelZone,
            specialShotType,
            power,
          },
          imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, highlightedLineIndex } : null,
        };
      });
    }
  }, []);

  const handleMouseUp = useCallback((pos: Vector) => {
    const { mouseDownPuckId, isDragging, startPos } = dragStateRef.current;
    
    dragStateRef.current = { mouseDownPuckId: null, isDragging: false, startPos: null, justSelected: false };

    setGameState(prev => {
      const puck = prev.pucks.find(p => p.id === mouseDownPuckId);
      if (!puck) return prev;
      
      if (!isDragging) {
          // If we just clicked without dragging, keep it selected (handled in MouseDown)
          // Just turn off tension mode if it was on
          return { ...prev, isCameraInTensionMode: false };
      }

      const dragVector = subtractVectors(startPos!, pos);
      const dragDistance = getVectorMagnitude(dragVector);

      if (dragDistance < CANCEL_SHOT_THRESHOLD) {
          // Cancel Shot
          return {
              ...prev,
              shotPreview: null,
              previewState: null, // Clear lines
              imaginaryLine: null,
              isCameraInTensionMode: false,
              selectedPuckId: null, // Deselect on cancel
          };
      }

      // --- FIRE SHOT ---
      const power = Math.min(dragDistance, MAX_DRAG_FOR_POWER) / MAX_DRAG_FOR_POWER;
      
      // Calculate velocity
      const powerMultiplier = LAUNCH_POWER_MULTIPLIER * (PUCK_TYPE_PROPERTIES[puck.puckType].powerFactor || 1);
      const finalLaunchPower = power * MAX_DRAG_FOR_POWER * powerMultiplier;
      
      // Special Shot Logic
      let specialStatus: SpecialShotStatus = 'NONE';
      let isPulsarShot = false;

      if (prev.pulsarShotArmed === puck.team) {
          isPulsarShot = true;
          // Pulsar shot logic (boost power/speed)
          // For now, Pulsar shot just ensures high velocity and maybe special effect triggers
      } else if (puck.puckType === 'KING') {
          specialStatus = prev.specialShotStatus[puck.team];
      }

      // Apply velocity
      // Note: We use the dragVector directly. The magnitude is clamped by power calculation, 
      // but direction is preserved.
      const launchVelocity = {
          x: (dragVector.x / dragDistance) * finalLaunchPower,
          y: (dragVector.y / dragDistance) * finalLaunchPower,
      };

      // Apply Special Shot Modifiers
      if (specialStatus === 'ROYAL') {
          launchVelocity.x *= ROYAL_SHOT_POWER_MULTIPLIER;
          launchVelocity.y *= ROYAL_SHOT_POWER_MULTIPLIER;
          puck.temporaryEffects.push({ type: 'ROYAL_RAGE', duration: 180, destroyedCount: 0 }); // 3 seconds
      } else if (specialStatus === 'ULTIMATE') {
          launchVelocity.x *= ULTIMATE_SHOT_POWER_MULTIPLIER;
          launchVelocity.y *= ULTIMATE_SHOT_POWER_MULTIPLIER;
           puck.temporaryEffects.push({ type: 'ULTIMATE_RAGE', duration: 240, destroyedCount: 0 }); // 4 seconds
      } else if (isPulsarShot) {
          launchVelocity.x *= 1.5;
          launchVelocity.y *= 1.5;
      }

      puck.velocity = {
          x: launchVelocity.x / puck.mass,
          y: launchVelocity.y / puck.mass,
      };
      
      // Consume Pulsar Power if used
      let newPulsarPower = { ...prev.pulsarPower };
      if (isPulsarShot) {
          newPulsarPower[puck.team] = 0;
      }
      
      // Play Sound
      if (specialStatus === 'ULTIMATE') playSound('ULTIMATE_SHOT');
      else if (specialStatus === 'ROYAL') playSound('ROYAL_SHOT');
      else if (isPulsarShot) playSound('PULSAR_SHOT');
      else playSound('SHOT', { volume: 0.3 + power * 0.7 });

      // Spawn Shot Particles
      const newParticles = [...prev.particles];
      const config = PARTICLE_CONFIG.SHOT_BURST;
      for (let k = 0; k < config.count; k++) {
          const angle = Math.atan2(-dragVector.y, -dragVector.x) + (Math.random() - 0.5) * 0.5;
          const speed = config.speed * (0.5 + Math.random());
          const p = particlePool.current.pop();
          const props = {
              position: { ...puck.position },
              velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
              radius: config.minRadius + Math.random() * (config.maxRadius - config.minRadius),
              color: TEAM_COLORS[puck.team],
              opacity: 1,
              life: config.life,
              decay: config.decay,
              id: particleIdCounter.current++,
              lifeSpan: config.life
          };
          if (p) Object.assign(p, props);
          else newParticles.push(props as Particle);
      }
      
      if (prev.imaginaryLine) {
          prev.imaginaryLine.isConfirmed = true;
          prev.imaginaryLine.shotPuckId = puck.id;
      }
      
      // Apply ghost phase to other pucks crossed by line? No, that was removed.
      
      return {
          ...prev,
          pucksShotThisTurn: [...prev.pucksShotThisTurn, puck.id],
          isSimulating: true,
          canShoot: false, // Wait until turn ends (or bonus triggers)
          shotPreview: null,
          previewState: null, // Stop showing lines once shot is fired
          isCameraInTensionMode: false,
          particles: newParticles,
          pulsarPower: newPulsarPower,
          pulsarShotArmed: null, // Consumed
          lastShotWasSpecial: specialStatus,
          orbHitsThisShot: 0,
      };
    });
  }, [playSound]);

  const handleBoardMouseDown = useCallback(() => {
      // If clicking on empty board while selected, deselect
      setGameState(prev => {
          if (prev.selectedPuckId !== null && !prev.isSimulating) {
              return { ...prev, selectedPuckId: null, previewState: null, imaginaryLine: null, shotPreview: null };
          }
          if (prev.infoCardPuckId !== null) {
              return { ...prev, infoCardPuckId: null };
          }
          return prev;
      });
  }, []);

  const handleActivatePulsar = useCallback(() => {
      setGameState(prev => {
          if (!prev.canShoot || prev.isSimulating) return prev;
          const team = prev.currentTurn;
          if (prev.pulsarPower[team] < MAX_PULSAR_POWER && prev.pulsarShotArmed !== team) return prev; // Cannot arm if not full
          
          const isArmed = prev.pulsarShotArmed === team;
          
          if (!isArmed) {
               playSound('MAX_POWER_LOCK');
          }

          return {
              ...prev,
              pulsarShotArmed: isArmed ? null : team
          };
      });
  }, [playSound]);

  return {
    gameState,
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