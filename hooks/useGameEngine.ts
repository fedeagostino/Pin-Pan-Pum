
import { useState, useEffect, useCallback, useRef } from 'react';
import { Puck, Team, Vector, GameState, ImaginaryLineState, PuckType, Particle, ImaginaryLine, SynergyType, TurnLossReason, FormationType, GameStatus, FloatingText } from '../types';
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
  CANCEL_SHOT_THRESHOLD,
  SCORE_TO_WIN,
  PUCK_GOAL_POINTS,
  PAWN_DURABILITY,
  MAX_DRAG_FOR_POWER,
  getPuckConfig,
  MAX_PULSAR_POWER,
  PULSAR_POWER_PER_LINE,
  PULSAR_ORB_CHARGE_AMOUNT,
  PULSAR_ORB_RADIUS,
  PULSAR_ORB_SPEED,
  PULSAR_ORB_SYNC_THRESHOLD,
  TRANSLATIONS,
  Language,
  TEAM_COLORS,
  FLOATING_TEXT_CONFIG,
  SUB_STEPS,
  WALL_BOUNCE_ELASTICITY
} from '../constants';

const GOAL_X_MIN = (BOARD_WIDTH - GOAL_WIDTH) / 2;
const GOAL_X_MAX = (BOARD_WIDTH + GOAL_WIDTH) / 2;

const getVectorMagnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);
const subtractVectors = (v1: Vector, v2: Vector) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

const checkLineIntersection = (a: Vector, b: Vector, c: Vector, d: Vector): Vector | null => {
  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (Math.abs(det) < 0.0001) return null;
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  if ((lambda > 0 && lambda < 1) && (gamma > 0 && gamma < 1)) {
      return {
          x: a.x + lambda * (b.x - a.x),
          y: a.y + lambda * (b.y - a.y)
      };
  }
  return null;
};

interface GameEngineProps {
    playSound: (s: string, o?: any) => void;
    lang: Language;
    onGameEvent?: (event: string) => void;
}

export const useGameEngine = ({ playSound, lang, onGameEvent }: GameEngineProps) => {
  const initPucks = useCallback((redFormation: FormationType, blueFormation: FormationType) => {
    const pucks: Puck[] = [];
    let idCounter = 1;
    const configs = [{ team: 'RED' as Team, formation: redFormation }, { team: 'BLUE' as Team, formation: blueFormation }];
    configs.forEach(config => {
      const pConfig = getPuckConfig(config.team, config.formation);
      pConfig.forEach(p => {
        const props = PUCK_TYPE_PROPERTIES[p.type];
        pucks.push({
          id: idCounter++,
          puckType: p.type as PuckType,
          team: config.team,
          position: { ...p.position },
          initialPosition: { ...p.position },
          velocity: { x: 0, y: 0 },
          rotation: config.team === 'BLUE' ? 180 : 0,
          mass: props.mass,
          friction: props.friction,
          radius: p.type === 'KING' ? KING_PUCK_RADIUS : (p.type === 'PAWN' ? PAWN_PUCK_RADIUS : PUCK_RADIUS),
          isCharged: false,
          elasticity: props.elasticity,
          swerveFactor: props.swerveFactor,
          durability: p.type === 'PAWN' ? PAWN_DURABILITY : undefined,
          temporaryEffects: [],
        });
      });
    });
    return pucks;
  }, []);

  const VIEWBOX_OFFSET_Y = -GOAL_DEPTH - 10; 
  const VIEWBOX_TOTAL_HEIGHT = BOARD_HEIGHT + GOAL_DEPTH * 2 + 20;

  const [gameState, setGameState] = useState<GameState>({
    status: 'PLAYING',
    pucks: [],
    particles: [],
    orbitingParticles: [],
    floatingTexts: [],
    currentTurn: 'RED',
    winner: null,
    score: { RED: 0, BLUE: 0 },
    isSimulating: false,
    canShoot: true,
    selectedPuckId: null,
    infoCardPuckId: null,
    shotPreview: null,
    imaginaryLine: null,
    pucksShotThisTurn: [],
    viewBox: `0 ${VIEWBOX_OFFSET_Y} ${BOARD_WIDTH} ${VIEWBOX_TOTAL_HEIGHT}`,
    isCameraInTensionMode: false,
    pulsarPower: { RED: 0, BLUE: 0 },
    specialShotStatus: { RED: 'NONE', BLUE: 'NONE' },
    pulsarShotArmed: null,
    isPulsarShotActive: false,
    goalScoredInfo: null,
    gameMessage: null,
    bonusTurnForTeam: null,
    screenShake: 0,
    turnLossReason: null,
    turnCount: 0,
    formations: { RED: 'BALANCED', BLUE: 'BALANCED' },
    pulsarOrb: { position: { x: 0, y: 0 }, angle: 0, radius: PULSAR_ORB_RADIUS }
  });

  const requestRef = useRef<number>(null);

  const resetGame = useCallback((redFormation: FormationType = 'BALANCED', blueFormation: FormationType = 'BALANCED') => {
    const newPucks = initPucks(redFormation, blueFormation);
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      pucks: newPucks,
      particles: [],
      floatingTexts: [],
      currentTurn: 'RED',
      winner: null,
      score: { RED: 0, BLUE: 0 },
      isSimulating: false,
      canShoot: true,
      selectedPuckId: null,
      imaginaryLine: null,
      pucksShotThisTurn: [],
      pulsarPower: { RED: 0, BLUE: 0 },
      goalScoredInfo: null,
      bonusTurnForTeam: null,
      turnCount: 0,
      formations: { RED: redFormation, BLUE: blueFormation },
      pulsarOrb: { position: { x: 0, y: 0 }, angle: 0, radius: PULSAR_ORB_RADIUS }
    }));
  }, [initPucks]);

  const clearGoalInfo = useCallback(() => {
    setGameState(prev => {
      if (!prev.goalScoredInfo) return prev;
      const nextTurn = prev.goalScoredInfo.scoringTeam === 'RED' ? 'BLUE' : 'RED';
      const resetPucks = prev.pucks.map(p => ({
        ...p,
        position: { ...p.initialPosition },
        velocity: { x: 0, y: 0 },
        isCharged: false
      }));
      return {
        ...prev,
        pucks: resetPucks,
        goalScoredInfo: null,
        currentTurn: nextTurn,
        canShoot: true,
        isSimulating: false,
        pucksShotThisTurn: [],
        imaginaryLine: null,
        bonusTurnForTeam: null
      };
    });
  }, []);

  const calculateLinesForPuck = useCallback((puckId: number, pucks: Puck[]): ImaginaryLine[] => {
    const lines: ImaginaryLine[] = [];
    const shotPuck = pucks.find(p => p.id === puckId);
    if (!shotPuck) return lines;
    const teamPucks = pucks.filter(p => p.team === shotPuck.team && p.id !== puckId);
    for (let i = 0; i < teamPucks.length; i++) {
      for (let j = i + 1; j < teamPucks.length; j++) {
        lines.push({
          start: teamPucks[i].position,
          end: teamPucks[j].position,
          sourcePuckIds: [teamPucks[i].id, teamPucks[j].id],
          synergyType: null
        });
      }
    }
    return lines;
  }, []);

  const getOrbPositionFromDistance = (d: number): Vector => {
      const W = BOARD_WIDTH;
      const H = BOARD_HEIGHT;
      const total = 2 * (W + H);
      const dist = d % total;
      if (dist < W) return { x: dist, y: 0 };
      if (dist < W + H) return { x: W, y: dist - W };
      if (dist < 2 * W + H) return { x: W - (dist - (W + H)), y: H };
      return { x: 0, y: H - (dist - (2 * W + H)) };
  };

  const updatePhysics = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== 'PLAYING' || prev.goalScoredInfo) return prev;
      
      const currentTurnCount = prev.turnCount + 1;

      // Update Pulsar Orb animation
      const nextPulsarOrbAngle = (prev.pulsarOrb?.angle || 0) + PULSAR_ORB_SPEED;
      const nextPulsarOrbPos = getOrbPositionFromDistance(nextPulsarOrbAngle);
      const nextPulsarOrb = {
          position: nextPulsarOrbPos,
          angle: nextPulsarOrbAngle,
          radius: PULSAR_ORB_RADIUS
      };

      // Particles and Floating texts logic
      const nextFloatingTexts = prev.floatingTexts
        .map(ft => ({
          ...ft,
          position: { x: ft.position.x + ft.velocity.x, y: ft.position.y + ft.velocity.y },
          life: ft.life - 1,
          opacity: ft.opacity - ft.decay
        }))
        .filter(ft => ft.life > 0 && ft.opacity > 0);

      const nextParticles = prev.particles.map(p => ({
        ...p,
        position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y },
        life: p.life - 1,
        opacity: p.opacity - p.decay
      })).filter(p => p.life > 0 && p.opacity > 0);

      // Physics loop
      let nextPucks = [...prev.pucks];
      let nextImaginaryLine = prev.imaginaryLine ? { ...prev.imaginaryLine, crossedLineIndices: new Set(prev.imaginaryLine.crossedLineIndices) } : null;
      let nextScore = { ...prev.score };
      let nextGoalInfo = prev.goalScoredInfo;
      let nextPulsarPower = { ...prev.pulsarPower };
      let turnLossReason: TurnLossReason | null = null;

      for (let step = 0; step < SUB_STEPS; step++) {
          nextPucks = nextPucks.map(p => {
              const prevPos = { ...p.position };
              const nextPos = { x: p.position.x + p.velocity.x / SUB_STEPS, y: p.position.y + p.velocity.y / SUB_STEPS };

              // Check line crossing
              if (nextImaginaryLine && p.id === nextImaginaryLine.shotPuckId) {
                nextImaginaryLine.lines.forEach((line, idx) => {
                  const intersectPoint = checkLineIntersection(prevPos, nextPos, line.start, line.end);
                  if (intersectPoint && !nextImaginaryLine!.crossedLineIndices.has(idx)) {
                      nextImaginaryLine!.crossedLineIndices.add(idx);
                      playSound('LINE_CROSS');
                      nextPulsarPower[p.team] = Math.min(MAX_PULSAR_POWER, nextPulsarPower[p.team] + PULSAR_POWER_PER_LINE);
                      nextImaginaryLine!.highlightedLines[idx] = 30; 
                      if (!p.isCharged) { p.isCharged = true; playSound('MAX_POWER_LOCK'); }
                  }
                });
              }

              let nextVel = { x: p.velocity.x, y: p.velocity.y };
              const inGoalX = nextPos.x > GOAL_X_MIN && nextPos.x < GOAL_X_MAX;

              // Collision with walls & Goals
              if (inGoalX && (nextPos.y < 0 || nextPos.y > BOARD_HEIGHT)) {
                  if (p.isCharged && !nextGoalInfo) {
                      const entersTop = nextPos.y < 0;
                      let scorer: Team;
                      if (entersTop) {
                          scorer = 'RED'; 
                          if (p.team === 'BLUE') { turnLossReason = 'OWN_GOAL'; }
                      } else {
                          scorer = 'BLUE';
                          if (p.team === 'RED') { turnLossReason = 'OWN_GOAL'; }
                      }
                      const points = PUCK_GOAL_POINTS[p.puckType];
                      nextScore[scorer] += points;
                      nextGoalInfo = { scoringTeam: scorer, pointsScored: points, scoringPuckType: p.puckType };
                      playSound('GOAL_SCORE');
                      nextVel = { x: 0, y: 0 };
                  } else if (!nextGoalInfo) {
                      if (nextPos.y < 0) { nextPos.y = 1; nextVel.y *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
                      if (nextPos.y > BOARD_HEIGHT) { nextPos.y = BOARD_HEIGHT - 1; nextVel.y *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
                  }
              } else {
                  if (nextPos.x < p.radius) { nextPos.x = p.radius; nextVel.x *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
                  if (nextPos.x > BOARD_WIDTH - p.radius) { nextPos.x = BOARD_WIDTH - p.radius; nextVel.x *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
                  if (nextPos.y < p.radius && !inGoalX) { nextPos.y = p.radius; nextVel.y *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
                  if (nextPos.y > BOARD_HEIGHT - p.radius && !inGoalX) { nextPos.y = BOARD_HEIGHT - p.radius; nextVel.y *= -WALL_BOUNCE_ELASTICITY; playSound('WALL_IMPACT'); }
              }
              return { ...p, position: nextPos, velocity: nextVel };
          });

          // Pucks collisions
          for (let i = 0; i < nextPucks.length; i++) {
              for (let j = i + 1; j < nextPucks.length; j++) {
                  const p1 = nextPucks[i]; const p2 = nextPucks[j];
                  const dx = p2.position.x - p1.position.x;
                  const dy = p2.position.y - p1.position.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const minDist = p1.radius + p2.radius;
                  if (dist < minDist && dist > 0) {
                      const normalX = dx / dist; const normalY = dy / dist;
                      const relativeVelX = p1.velocity.x - p2.velocity.x;
                      const relativeVelY = p1.velocity.y - p2.velocity.y;
                      const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;
                      if (velAlongNormal > 0) {
                          const restitution = Math.min(p1.elasticity || 0.9, p2.elasticity || 0.9);
                          let impulse = -(1 + restitution) * velAlongNormal / (1 / p1.mass + 1 / p2.mass);
                          nextPucks[i].velocity.x += (impulse * normalX) / p1.mass;
                          nextPucks[i].velocity.y += (impulse * normalY) / p1.mass;
                          nextPucks[j].velocity.x -= (impulse * normalX) / p2.mass;
                          nextPucks[j].velocity.y -= (impulse * normalY) / p2.mass;
                          playSound('COLLISION', { throttleMs: 35 });
                      }
                      const overlap = minDist - dist;
                      const totalMass = p1.mass + p2.mass;
                      nextPucks[i].position.x -= normalX * overlap * (p2.mass / totalMass);
                      nextPucks[i].position.y -= normalY * overlap * (p2.mass / totalMass);
                      nextPucks[j].position.x += normalX * overlap * (p1.mass / totalMass);
                      nextPucks[j].position.y += normalY * overlap * (p1.mass / totalMass);
                  }
              }
          }
      }

      nextPucks = nextPucks.map(p => {
          let nv = { x: p.velocity.x * p.friction, y: p.velocity.y * p.friction };
          if (getVectorMagnitude(nv) < MIN_VELOCITY_TO_STOP) nv = { x: 0, y: 0 };
          return { ...p, velocity: nv };
      });

      const currentlyMoving = nextPucks.some(p => getVectorMagnitude(p.velocity) > MAX_VELOCITY_FOR_TURN_END);
      let isSimulating = currentlyMoving;
      let currentTurn = prev.currentTurn;
      let canShoot = !currentlyMoving && !nextGoalInfo && prev.status === 'PLAYING';
      let bonusTurnForTeam = prev.bonusTurnForTeam;
      let pucksShotThisTurn = prev.pucksShotThisTurn;
      let finalTurnLossReason = turnLossReason || prev.turnLossReason;

      // TURN END LOGIC: TRIGGER ONLY WHEN PIECES JUST STOPPED
      if (prev.isSimulating && !currentlyMoving) {
          if (pucksShotThisTurn.length > 0) {
              const crossedThisTurn = (nextImaginaryLine?.crossedLineIndices.size || 0) > 0;
              const teamPucks = nextPucks.filter(p => p.team === currentTurn);
              const allCharged = teamPucks.every(p => p.isCharged);

              // Condition to KEEP turn: crossed a line AND not all pieces are charged.
              if ((crossedThisTurn || prev.isPulsarShotActive) && !allCharged) {
                  playSound('BONUS_TURN');
                  bonusTurnForTeam = currentTurn;
              } else {
                  // TURN LOST
                  const lossReason: TurnLossReason = allCharged && crossedThisTurn ? 'ALL_CHARGED' : 'NO_CHARGE';
                  finalTurnLossReason = lossReason;
                  currentTurn = currentTurn === 'RED' ? 'BLUE' : 'RED';
              }
              // Always clear shots list when settling
              pucksShotThisTurn = [];
              nextImaginaryLine = null;
          }
      }

      const winner = nextScore.RED >= SCORE_TO_WIN ? 'RED' : (nextScore.BLUE >= SCORE_TO_WIN ? 'BLUE' : null);

      return {
        ...prev,
        pucks: nextPucks,
        particles: nextParticles,
        score: nextScore,
        winner,
        goalScoredInfo: nextGoalInfo,
        floatingTexts: nextFloatingTexts,
        isSimulating,
        canShoot: canShoot && !winner,
        currentTurn,
        pulsarPower: nextPulsarPower,
        imaginaryLine: nextImaginaryLine,
        turnLossReason: finalTurnLossReason,
        bonusTurnForTeam,
        pucksShotThisTurn,
        turnCount: currentTurnCount,
        pulsarOrb: nextPulsarOrb
      };
    });
    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [playSound]);

  const handleMouseDown = useCallback((puckId: number, pos: Vector) => {
    setGameState(prev => {
      // Robust check: don't allow selection if simulating or pieces are still moving
      const currentlyMoving = prev.pucks.some(p => getVectorMagnitude(p.velocity) > MAX_VELOCITY_FOR_TURN_END);
      if (prev.winner || !prev.canShoot || currentlyMoving || prev.goalScoredInfo || prev.status !== 'PLAYING') return prev;
      
      const puck = prev.pucks.find(p => p.id === puckId);
      if (!puck || puck.team !== prev.currentTurn || prev.pucksShotThisTurn.includes(puckId)) return prev;
      
      playSound('PUCK_SELECT');
      return { 
        ...prev, 
        selectedPuckId: puckId,
        infoCardPuckId: null,
        imaginaryLine: { 
          lines: calculateLinesForPuck(puckId, prev.pucks), 
          isConfirmed: false, 
          crossedLineIndices: new Set(), 
          highlightedLines: {}, 
          shotPuckId: puckId, 
          comboCount: 0 
        }
      };
    });
  }, [playSound, calculateLinesForPuck]);

  const handleMouseMove = useCallback((pos: Vector) => {
    setGameState(prev => {
      if (prev.selectedPuckId === null) return prev;
      const puck = prev.pucks.find(p => p.id === prev.selectedPuckId);
      if (!puck) return prev;
      const dragVector = subtractVectors(puck.position, pos);
      const distance = getVectorMagnitude(dragVector);
      const power = Math.min(distance / MAX_DRAG_FOR_POWER, 1);
      return {
        ...prev,
        shotPreview: { start: puck.position, end: pos, isMaxPower: power >= 1, isCancelZone: distance < CANCEL_SHOT_THRESHOLD, specialShotType: 'NONE', power }
      };
    });
  }, []);

  const handleMouseUp = useCallback((pos: Vector | null) => {
    setGameState(prev => {
      if (prev.selectedPuckId === null || !prev.shotPreview || prev.shotPreview.isCancelZone) {
        return { ...prev, selectedPuckId: null, shotPreview: null, imaginaryLine: null };
      }
      const puck = prev.pucks.find(p => p.id === prev.selectedPuckId);
      if (!puck) return { ...prev, selectedPuckId: null, shotPreview: null, imaginaryLine: null };
      
      const shotVector = subtractVectors(puck.position, prev.shotPreview.end);
      const isPulsarActive = prev.pulsarShotArmed === prev.currentTurn;
      const velocity = { 
          x: shotVector.x * LAUNCH_POWER_MULTIPLIER * (isPulsarActive ? 1.6 : 1), 
          y: shotVector.y * LAUNCH_POWER_MULTIPLIER * (isPulsarActive ? 1.6 : 1) 
      };
      
      if (isPulsarActive) {
          playSound('PULSAR_SHOT');
      } else {
          playSound('SHOT');
      }
      
      return {
        ...prev,
        pucks: prev.pucks.map(p => p.id === prev.selectedPuckId ? { ...p, velocity } : p),
        selectedPuckId: null, 
        shotPreview: null, 
        isSimulating: true, 
        canShoot: false,
        pucksShotThisTurn: [...prev.pucksShotThisTurn, puck.id],
        imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, isConfirmed: true, crossedLineIndices: new Set() } : null,
        pulsarShotArmed: null, 
        isPulsarShotActive: isPulsarActive,
        pulsarPower: isPulsarActive ? { ...prev.pulsarPower, [prev.currentTurn]: 0 } : prev.pulsarPower
      };
    });
  }, [playSound]);

  const handleActivatePulsar = useCallback(() => {
    setGameState(prev => {
        if (prev.pulsarPower[prev.currentTurn] < MAX_PULSAR_POWER || prev.isSimulating) return prev;
        playSound('PULSAR_ACTIVATE');
        return { ...prev, pulsarShotArmed: prev.currentTurn };
    });
  }, [playSound]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [updatePhysics]);

  return { 
    gameState, handleMouseDown, handleMouseMove, handleMouseUp, resetGame,
    handleBoardMouseDown: () => setGameState(prev => ({ ...prev, infoCardPuckId: null })),
    handleActivatePulsar,
    clearTurnLossReason: () => setGameState(prev => ({ ...prev, turnLossReason: null })),
    clearBonusTurn: () => setGameState(prev => ({ ...prev, bonusTurnForTeam: null })),
    clearGoalInfo
  };
};
