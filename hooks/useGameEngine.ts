
import { useState, useEffect, useCallback, useRef } from 'react';
import { Puck, Team, Vector, GameState, ImaginaryLineState, PuckType, Particle, ImaginaryLine, SynergyType, TemporaryEffect, PreviewState, PuckTrajectory, SpecialShotStatus, TurnLossReason, FormationType, GameStatus } from '../types';
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
  getPuckConfig
} from '../constants';

const GOAL_X_MIN = (BOARD_WIDTH - GOAL_WIDTH) / 2;
const GOAL_X_MAX = (BOARD_WIDTH + GOAL_WIDTH) / 2;

const getVectorMagnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);
const subtractVectors = (v1: Vector, v2: Vector) => ({ x: v1.x - v2.x, y: v1.y - v2.y });

const checkLineIntersection = (a: Vector, b: Vector, c: Vector, d: Vector): boolean => {
  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) return false;
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
};

export const useGameEngine = ({ playSound }: { playSound: (s: string, o?: any) => void }) => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'PRE_GAME',
    preGameCountdown: 10,
    pucks: [],
    particles: [],
    orbitingParticles: [],
    floatingTexts: [],
    currentTurn: 'RED',
    winner: null,
    score: { RED: 0, BLUE: 0 },
    isSimulating: false,
    canShoot: false,
    selectedPuckId: null,
    infoCardPuckId: null,
    shotPreview: null,
    imaginaryLine: null,
    pucksShotThisTurn: [],
    viewBox: `0 ${-GOAL_DEPTH} ${BOARD_WIDTH} ${BOARD_HEIGHT + GOAL_DEPTH * 2}`,
    isCameraInTensionMode: false,
    pulsarPower: { RED: 0, BLUE: 0 },
    specialShotStatus: { RED: 'NONE', BLUE: 'NONE' },
    pulsarShotArmed: null,
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
    formations: { RED: 'BALANCED', BLUE: 'BALANCED' },
  });

  const requestRef = useRef<number>(null);

  const initPucks = useCallback((redFormation: FormationType, blueFormation: FormationType) => {
    const pucks: Puck[] = [];
    let idCounter = 1;

    const configs = [
        { team: 'RED' as Team, formation: redFormation },
        { team: 'BLUE' as Team, formation: blueFormation }
    ];

    configs.forEach(config => {
      const pConfig = getPuckConfig(config.team, config.formation);
      pConfig.forEach(p => {
        const props = PUCK_TYPE_PROPERTIES[p.type];
        pucks.push({
          id: idCounter++,
          puckType: p.type as PuckType, // Fixed Type casting from string to PuckType
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

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'PRE_GAME',
      preGameCountdown: 10,
      pucks: initPucks('BALANCED', 'BALANCED'),
      score: { RED: 0, BLUE: 0 },
      winner: null,
      currentTurn: 'RED',
      isSimulating: false,
      canShoot: false,
      pucksShotThisTurn: [],
      pulsarPower: { RED: 0, BLUE: 0 },
      specialShotStatus: { RED: 'NONE', BLUE: 'NONE' },
      orbCollection: { RED: 0, BLUE: 0 },
      turnCount: 0,
      imaginaryLine: null,
      goalScoredInfo: null,
      formations: { RED: 'BALANCED', BLUE: 'BALANCED' }
    }));
  }, [initPucks]);

  const setFormation = useCallback((team: Team, formation: FormationType) => {
    setGameState(prev => {
        const newFormations = { ...prev.formations, [team]: formation };
        return {
            ...prev,
            formations: newFormations,
            pucks: initPucks(newFormations.RED, newFormations.BLUE)
        };
    });
  }, [initPucks]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'PLAYING', canShoot: true }));
  }, []);

  // Countdown Logic
  useEffect(() => {
    if (gameState.status === 'PRE_GAME') {
        const timer = setInterval(() => {
            setGameState(prev => {
                if (prev.preGameCountdown <= 1) {
                    clearInterval(timer);
                    return { ...prev, preGameCountdown: 0, status: 'PLAYING', canShoot: true };
                }
                return { ...prev, preGameCountdown: prev.preGameCountdown - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [gameState.status]);

  // Goal logic cleanup
  useEffect(() => {
    if (gameState.goalScoredInfo) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          if (!prev.goalScoredInfo) return prev;
          const scoringTeam = prev.goalScoredInfo.scoringTeam;
          return {
            ...prev,
            pucks: initPucks(prev.formations.RED, prev.formations.BLUE),
            goalScoredInfo: null,
            isSimulating: false,
            canShoot: !prev.winner,
            pucksShotThisTurn: [],
            currentTurn: scoringTeam,
            imaginaryLine: null,
            specialShotStatus: { RED: 'NONE', BLUE: 'NONE' }
          };
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState.goalScoredInfo, initPucks]);

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
          synergyType: null,
          passivelyCrossedBy: new Set()
        });
      }
    }
    return lines;
  }, []);

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
          pawnPawnLinesCrossed: new Set(),
          pawnSpecialLinesCrossed: new Set(),
          shotPuckId: puckId,
          comboCount: 0,
          highlightedLineIndex: null
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
      const velocity = {
        x: shotVector.x * LAUNCH_POWER_MULTIPLIER,
        y: shotVector.y * LAUNCH_POWER_MULTIPLIER
      };

      playSound('SHOT');

      return {
        ...prev,
        pucks: prev.pucks.map(p => p.id === prev.selectedPuckId ? { ...p, velocity, isCharged: false } : p),
        selectedPuckId: null,
        shotPreview: null,
        isSimulating: true,
        pucksShotThisTurn: [...prev.pucksShotThisTurn, puck.id],
        imaginaryLine: prev.imaginaryLine ? { ...prev.imaginaryLine, isConfirmed: true } : null
      };
    });
  }, [playSound]);

  const updatePhysics = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== 'PLAYING' || prev.goalScoredInfo) return prev;

      const movingPucks = prev.pucks.filter(p => getVectorMagnitude(p.velocity) > MIN_VELOCITY_TO_STOP);
      
      if (!prev.isSimulating && movingPucks.length === 0) {
          if (prev.pucksShotThisTurn.length > 0) {
              const nextTurn = prev.currentTurn === 'RED' ? 'BLUE' : 'RED';
              return { 
                  ...prev, 
                  currentTurn: nextTurn, 
                  pucksShotThisTurn: [],
                  isSimulating: false,
                  canShoot: true,
                  imaginaryLine: null,
                  goalScoredInfo: null
              };
          }
          return { ...prev, isSimulating: false, canShoot: true };
      }

      let nextPucks = [...prev.pucks];
      let nextImaginaryLine = prev.imaginaryLine ? { ...prev.imaginaryLine } : null;
      let nextScore = { ...prev.score };
      let nextGoalInfo = prev.goalScoredInfo;

      nextPucks = nextPucks.map(p => {
        const prevPos = { ...p.position };
        const nextPos = {
          x: p.position.x + p.velocity.x,
          y: p.position.y + p.velocity.y
        };

        if (nextImaginaryLine && p.id === nextImaginaryLine.shotPuckId && !p.isCharged) {
          nextImaginaryLine.lines.forEach((line, idx) => {
            if (!nextImaginaryLine!.crossedLineIndices.has(idx)) {
              if (checkLineIntersection(prevPos, nextPos, line.start, line.end)) {
                nextImaginaryLine!.crossedLineIndices.add(idx);
                playSound('LINE_CROSS');
                
                const required = PUCK_TYPE_PROPERTIES[p.puckType].linesToCrossForBonus;
                if (nextImaginaryLine!.crossedLineIndices.size >= required) {
                  p.isCharged = true;
                  playSound('MAX_POWER_LOCK');
                }
              }
            }
          });
        }

        let nextVel = {
          x: p.velocity.x * p.friction,
          y: p.velocity.y * p.friction
        };

        const inGoalX = nextPos.x > GOAL_X_MIN && nextPos.x < GOAL_X_MAX;
        
        if (nextPos.x < p.radius || nextPos.x > BOARD_WIDTH - p.radius) {
          nextPos.x = nextPos.x < p.radius ? p.radius : BOARD_WIDTH - p.radius;
          nextVel.x *= -1;
          playSound('WALL_IMPACT', { throttleMs: 50 });
        }

        const crossingTop = nextPos.y < p.radius;
        const crossingBottom = nextPos.y > BOARD_HEIGHT - p.radius;

        if (inGoalX && (crossingTop || crossingBottom)) {
           if (p.isCharged) {
              const passedTopLine = nextPos.y < 0;
              const passedBottomLine = nextPos.y > BOARD_HEIGHT;

              if ((passedTopLine || passedBottomLine) && !nextGoalInfo) {
                  // Red is top, scores in bottom goal (passedBottomLine)
                  // Blue is bottom, scores in top goal (passedTopLine)
                  const pointReceiver = passedTopLine ? 'BLUE' : 'RED';
                  const points = PUCK_GOAL_POINTS[p.puckType];
                  
                  nextScore[pointReceiver] += points;
                  nextGoalInfo = { scoringTeam: pointReceiver, pointsScored: points, scoringPuckType: p.puckType };
                  playSound('GOAL_SCORE');
                  nextVel = { x: 0, y: 0 };
              }
           } else {
              if (nextPos.y < p.radius || nextPos.y > BOARD_HEIGHT - p.radius) {
                 nextPos.y = nextPos.y < p.radius ? p.radius : BOARD_HEIGHT - p.radius;
                 nextVel.y *= -1.1;
                 playSound('WALL_IMPACT');
              }
           }
        } else if (crossingTop || crossingBottom) {
           nextPos.y = crossingTop ? p.radius : BOARD_HEIGHT - p.radius;
           nextVel.y *= -1;
           playSound('WALL_IMPACT', { throttleMs: 50 });
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
            const normalX = dx / dist;
            const normalY = dy / dist;
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
        score: nextScore,
        winner,
        goalScoredInfo: nextGoalInfo,
        isSimulating: anyMoving,
        canShoot: !winner && !anyMoving && !nextGoalInfo && prev.status === 'PLAYING',
        imaginaryLine: nextImaginaryLine
      };
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [playSound]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [updatePhysics]);

  return { 
    gameState, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    resetGame, 
    startGame,
    setFormation,
    handleBoardMouseDown: () => setGameState(prev => ({ ...prev, infoCardPuckId: null })),
    handleActivatePulsar: () => {},
    clearTurnLossReason: () => setGameState(prev => ({ ...prev, turnLossReason: null })),
    clearBonusTurn: () => setGameState(prev => ({ ...prev, bonusTurnForTeam: null })),
  };
};
