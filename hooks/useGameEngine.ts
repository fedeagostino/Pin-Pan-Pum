
// Add missing resetGame function to useGameEngine hook.
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
  // Removed non-existent PULSAR_ORB_ORBIT_RADIUS
  PULSAR_ORB_SPEED,
  PULSAR_ORB_SYNC_THRESHOLD,
  TRANSLATIONS,
  Language,
  TEAM_COLORS,
  FLOATING_TEXT_CONFIG
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
    pulsarOrb: {
        position: { x: 0, y: 0 },
        angle: 0, // Usaremos angle como distancia recorrida en el perímetro
        radius: PULSAR_ORB_RADIUS
    }
  });

  const requestRef = useRef<number>(null);

  const resetGame = useCallback((redFormation: FormationType = 'BALANCED', blueFormation: FormationType = 'BALANCED') => {
    const newPucks = initPucks(redFormation, blueFormation);
    setGameState({
      status: 'PLAYING',
      pucks: newPucks,
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
      formations: { RED: redFormation, BLUE: blueFormation },
      pulsarOrb: {
          position: { x: 0, y: 0 },
          angle: 0,
          radius: PULSAR_ORB_RADIUS
      }
    });
  }, [initPucks, VIEWBOX_OFFSET_Y, VIEWBOX_TOTAL_HEIGHT]);

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
      
      const nextFloatingTexts = [...prev.floatingTexts]
        .map(ft => ({
          ...ft,
          position: { x: ft.position.x + ft.velocity.x, y: ft.position.y + ft.velocity.y },
          life: ft.life - 1,
          opacity: ft.opacity - ft.decay
        }))
        .filter(ft => ft.life > 0 && ft.opacity > 0);

      const movingPucks = prev.pucks.filter(p => getVectorMagnitude(p.velocity) > MIN_VELOCITY_TO_STOP);
      
      let nextPulsarOrb = prev.pulsarOrb ? { ...prev.pulsarOrb } : null;
      if (nextPulsarOrb) {
          nextPulsarOrb.angle += PULSAR_ORB_SPEED;
          nextPulsarOrb.position = getOrbPositionFromDistance(nextPulsarOrb.angle);
      }

      // Particles Update
      const nextParticles = prev.particles.map(p => ({
        ...p,
        position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y },
        life: p.life - 1,
        opacity: p.opacity - p.decay
      })).filter(p => p.life > 0 && p.opacity > 0);

      // TURN END LOGIC
      if (!prev.isSimulating && movingPucks.length === 0) {
          if (prev.pucksShotThisTurn.length > 0) {
              const crossedThisTurn = (prev.imaginaryLine?.crossedLineIndices.size || 0) > 0;
              const isPulsarShot = prev.isPulsarShotActive;
              
              if (crossedThisTurn || isPulsarShot) {
                  playSound('BONUS_TURN');
                  return {
                      ...prev,
                      particles: nextParticles,
                      floatingTexts: nextFloatingTexts,
                      pucksShotThisTurn: [], 
                      isSimulating: false,
                      canShoot: true,
                      bonusTurnForTeam: prev.currentTurn,
                      imaginaryLine: null,
                      turnLossReason: null,
                      isPulsarShotActive: false,
                      pulsarOrb: nextPulsarOrb
                  };
              } else {
                  const nextTurn = prev.currentTurn === 'RED' ? 'BLUE' : 'RED';
                  return { 
                      ...prev, 
                      currentTurn: nextTurn, 
                      particles: nextParticles,
                      floatingTexts: nextFloatingTexts,
                      pucksShotThisTurn: [],
                      isSimulating: false,
                      canShoot: true,
                      imaginaryLine: null,
                      turnLossReason: 'NO_CHARGE',
                      isPulsarShotActive: false,
                      pulsarOrb: nextPulsarOrb
                  };
              }
          }
          return { ...prev, particles: nextParticles, floatingTexts: nextFloatingTexts, isSimulating: false, canShoot: true, isPulsarShotActive: false, pulsarOrb: nextPulsarOrb };
      }

      let nextPucks = [...prev.pucks];
      let nextImaginaryLine = prev.imaginaryLine ? { ...prev.imaginaryLine } : null;
      let nextScore = { ...prev.score };
      let nextGoalInfo = prev.goalScoredInfo;
      let nextPulsarPower = { ...prev.pulsarPower };

      // Update Highlight Lifetimes
      if (nextImaginaryLine) {
          const nextHighlights = { ...nextImaginaryLine.highlightedLines };
          Object.keys(nextHighlights).forEach(idxStr => {
              const idx = parseInt(idxStr);
              nextHighlights[idx]--;
              if (nextHighlights[idx] <= 0) delete nextHighlights[idx];
          });
          nextImaginaryLine.highlightedLines = nextHighlights;
      }

      nextPucks = nextPucks.map(p => {
        const prevPos = { ...p.position };
        const nextPos = { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y };

        if (nextImaginaryLine && p.id === nextImaginaryLine.shotPuckId) {
          nextImaginaryLine.lines.forEach((line, idx) => {
            const intersectPoint = checkLineIntersection(prevPos, nextPos, line.start, line.end);
            if (intersectPoint) {
              if (!nextImaginaryLine!.crossedLineIndices.has(idx)) {
                  nextImaginaryLine!.crossedLineIndices.add(idx);
                  playSound('LINE_CROSS');
                  nextPulsarPower[p.team] = Math.min(MAX_PULSAR_POWER, nextPulsarPower[p.team] + PULSAR_POWER_PER_LINE);
                  
                  nextImaginaryLine!.highlightedLines[idx] = 30; 

                  const teamColor = TEAM_COLORS[p.team];
                  for (let i = 0; i < 8; i++) {
                      const angle = Math.random() * Math.PI * 2;
                      const speed = 1 + Math.random() * 2;
                      nextParticles.push({
                          id: Math.random(),
                          position: { ...intersectPoint },
                          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                          radius: 2 + Math.random() * 3,
                          color: teamColor,
                          opacity: 1,
                          life: 20 + Math.random() * 15,
                          lifeSpan: 30,
                          decay: 0.03,
                          renderType: 'line_impact'
                      });
                  }

                  if (!p.isCharged) {
                      p.isCharged = true;
                      playSound('MAX_POWER_LOCK');
                  }
              }
            }
          });
        }

        let nextVel = { x: p.velocity.x * p.friction, y: p.velocity.y * p.friction };
        const inGoalX = nextPos.x > GOAL_X_MIN && nextPos.x < GOAL_X_MAX;
        const crossingTop = nextPos.y < 0;
        const crossingBottom = nextPos.y > BOARD_HEIGHT;

        const checkOrbSync = (impactPos: Vector) => {
            if (!nextPulsarOrb) return;
            const dist = Math.sqrt(Math.pow(impactPos.x - nextPulsarOrb.position.x, 2) + Math.pow(impactPos.y - nextPulsarOrb.position.y, 2));
            if (dist < PULSAR_ORB_SYNC_THRESHOLD) {
                playSound('ORBITING_HIT');
                nextPulsarPower[p.team] = Math.min(MAX_PULSAR_POWER, nextPulsarPower[p.team] + PULSAR_ORB_CHARGE_AMOUNT);
                nextFloatingTexts.push({
                    id: Date.now() + Math.random(),
                    text: "+25% PULSAR",
                    position: { ...impactPos },
                    color: '#f1c40f',
                    opacity: 1,
                    life: FLOATING_TEXT_CONFIG.LIFE,
                    decay: 0.02,
                    velocity: { x: 0, y: -1.5 }
                });
            }
        };

        if (inGoalX && (crossingTop || crossingBottom)) {
           if (p.isCharged) {
              if (!nextGoalInfo) {
                  const pointReceiver = crossingTop ? 'BLUE' : 'RED';
                  const points = PUCK_GOAL_POINTS[p.puckType];
                  nextScore[pointReceiver] += points;
                  nextGoalInfo = { scoringTeam: pointReceiver, pointsScored: points, scoringPuckType: p.puckType };
                  playSound('GOAL_SCORE');
                  nextVel = { x: 0, y: 0 };
              }
           } else {
              if (crossingTop) { 
                  nextPos.y = 1; nextVel.y *= -1.2; playSound('WALL_IMPACT'); 
                  checkOrbSync({ x: nextPos.x, y: 0 });
              }
              else if (crossingBottom) { 
                  nextPos.y = BOARD_HEIGHT - 1; nextVel.y *= -1.2; playSound('WALL_IMPACT'); 
                  checkOrbSync({ x: nextPos.x, y: BOARD_HEIGHT });
              }
           }
        } else {
            const touchingTopWall = nextPos.y < p.radius;
            const touchingBottomWall = nextPos.y > BOARD_HEIGHT - p.radius;
            const touchingLeftWall = nextPos.x < p.radius;
            const touchingRightWall = nextPos.x > BOARD_WIDTH - p.radius;
            
            if (touchingLeftWall || touchingRightWall) {
                const impactPos = { x: touchingLeftWall ? 0 : BOARD_WIDTH, y: nextPos.y };
                nextPos.x = touchingLeftWall ? p.radius : BOARD_WIDTH - p.radius;
                nextVel.x *= -1;
                playSound('WALL_IMPACT', { throttleMs: 50 });
                checkOrbSync(impactPos);
            }
            if (!inGoalX && (touchingTopWall || touchingBottomWall)) {
                const impactPos = { x: nextPos.x, y: touchingTopWall ? 0 : BOARD_HEIGHT };
                nextPos.y = touchingTopWall ? p.radius : BOARD_HEIGHT - p.radius;
                nextVel.y *= -1;
                playSound('WALL_IMPACT', { throttleMs: 50 });
                checkOrbSync(impactPos);
            }
        }
        return { ...p, position: nextPos, velocity: nextVel };
      });

      for (let i = 0; i < nextPucks.length; i++) {
        for (let j = i + 1; j < nextPucks.length; j++) {
          const p1 = nextPucks[i];
          const p2 = nextPucks[j];
          const dx = p2.position.x - p1.position.x;
          const dy = p2.position.y - p1.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p1.radius + p2.radius;
          if (dist < minDist) {
            playSound('COLLISION', { throttleMs: 30 });
            const normalX = dx / (dist || 1);
            const normalY = dy / (dist || 1);
            const pVal = 2 * (p1.velocity.x * normalX + p1.velocity.y * normalY - p2.velocity.x * normalX - p2.velocity.y * normalY) / (p1.mass + p2.mass);
            nextPucks[i].velocity.x -= pVal * p2.mass * normalX;
            nextPucks[i].velocity.y -= pVal * p2.mass * normalY;
            nextPucks[j].velocity.x += pVal * p1.mass * normalX;
            nextPucks[j].velocity.y += pVal * p1.mass * normalY;
            const overlap = minDist - dist;
            nextPucks[i].position.x -= normalX * overlap / 2;
            nextPucks[i].position.y -= normalY * overlap / 2;
            nextPucks[j].position.x += normalX * overlap / 2;
            nextPucks[j].position.y += normalY * overlap / 2;
          }
        }
      }

      const anyMoving = nextPucks.some(p => getVectorMagnitude(p.velocity) > MAX_VELOCITY_FOR_TURN_END);
      const winner = nextScore.RED >= SCORE_TO_WIN ? 'RED' : (nextScore.BLUE >= SCORE_TO_WIN ? 'BLUE' : null);

      return {
        ...prev,
        pucks: nextPucks,
        particles: nextParticles,
        score: nextScore,
        winner,
        goalScoredInfo: nextGoalInfo,
        floatingTexts: nextFloatingTexts,
        isSimulating: anyMoving,
        canShoot: !winner && !anyMoving && !nextGoalInfo && prev.status === 'PLAYING',
        imaginaryLine: nextImaginaryLine,
        pulsarPower: nextPulsarPower,
        pulsarOrb: nextPulsarOrb
      };
    });
    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [playSound, onGameEvent, initPucks, VIEWBOX_OFFSET_Y, VIEWBOX_TOTAL_HEIGHT]);

  const handleMouseDown = useCallback((puckId: number, pos: Vector) => {
    setGameState(prev => {
      if (prev.winner || !prev.canShoot || prev.goalScoredInfo || prev.status !== 'PLAYING') return prev;
      const puck = prev.pucks.find(p => p.id === puckId);
      if (!puck || puck.team !== prev.currentTurn || prev.pucksShotThisTurn.includes(puckId)) return prev;
      const lines = calculateLinesForPuck(puckId, prev.pucks);
      playSound('PUCK_SELECT');
      return { 
        ...prev, 
        selectedPuckId: puckId,
        imaginaryLine: {
          lines,
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
      const isCancelZone = distance < CANCEL_SHOT_THRESHOLD;
      const power = Math.min(distance / MAX_DRAG_FOR_POWER, 1);
      return {
        ...prev,
        shotPreview: {
          start: puck.position,
          end: pos,
          isMaxPower: power >= 1,
          isCancelZone,
          specialShotType: puck.puckType === 'KING' ? prev.specialShotStatus[puck.team] : 'NONE',
          power
        }
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
      const powerMult = isPulsarActive ? 1.5 : 1.0;
      
      const velocity = { 
        x: shotVector.x * LAUNCH_POWER_MULTIPLIER * powerMult, 
        y: shotVector.y * LAUNCH_POWER_MULTIPLIER * powerMult 
      };
      
      let nextFloatingTexts = [...prev.floatingTexts];
      if (isPulsarActive) {
          playSound('PULSAR_SHOT');
          nextFloatingTexts.push({
            id: Date.now(),
            text: TRANSLATIONS[lang].PORTAL_DISCHARGE,
            position: { ...puck.position },
            color: '#f1c40f',
            opacity: 1,
            life: FLOATING_TEXT_CONFIG.LIFE,
            decay: 0.015,
            velocity: { x: 0, y: -2 }
          });
      } else {
          playSound('SHOT');
      }
      
      return {
        ...prev,
        pucks: prev.pucks.map(p => p.id === prev.selectedPuckId ? { ...p, velocity } : p),
        selectedPuckId: null,
        shotPreview: null,
        isSimulating: true,
        floatingTexts: nextFloatingTexts,
        pucksShotThisTurn: [...prev.pucksShotThisTurn, puck.id],
        imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, isConfirmed: true, crossedLineIndices: new Set() } : null,
        pulsarShotArmed: null,
        isPulsarShotActive: isPulsarActive,
        pulsarPower: isPulsarActive ? { ...prev.pulsarPower, [prev.currentTurn]: 0 } : prev.pulsarPower
      };
    });
  }, [playSound, lang]);

  const handleActivatePulsar = useCallback(() => {
    setGameState(prev => {
        if (prev.pulsarPower[prev.currentTurn] < MAX_PULSAR_POWER) return prev;
        playSound('PULSAR_ACTIVATE');
        const currentKing = prev.pucks.find(p => p.team === prev.currentTurn && p.puckType === 'KING');
        let nextFloatingTexts = [...prev.floatingTexts];
        if (currentKing) {
            nextFloatingTexts.push({
                id: Date.now(),
                text: TRANSLATIONS[lang].PORTAL_OPEN,
                position: { ...currentKing.position },
                color: '#f1c40f',
                opacity: 1,
                life: FLOATING_TEXT_CONFIG.LIFE,
                decay: 0.015,
                velocity: { x: 0, y: -2 }
            });
        }
        return { ...prev, floatingTexts: nextFloatingTexts, pulsarShotArmed: prev.currentTurn, pucksShotThisTurn: [], canShoot: true, isSimulating: false };
    });
  }, [playSound, lang]);

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
  };
};
