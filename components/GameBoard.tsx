
import React from 'react';
import { GameState, Vector } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, GOAL_WIDTH, GOAL_DEPTH, TEAM_COLORS, MAX_DRAG_FOR_POWER, Language, TRANSLATIONS, PULSAR_ORB_LINE_LENGTH } from '../constants';
import PuckShape from './PuckShape';

interface GameBoardProps {
  gameState: GameState;
  onMouseDown: (puckId: number, pos: Vector) => void;
  onBoardMouseDown: () => void;
  lang: Language;
}

const subtractVectors = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });
const getVectorMagnitude = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);

const GameBoardComponent = React.forwardRef<SVGSVGElement, GameBoardProps>(({ gameState, onMouseDown, onBoardMouseDown, lang }, ref) => {
  const t = TRANSLATIONS[lang];
  const goalX = (BOARD_WIDTH - GOAL_WIDTH) / 2;
  const isAiming = gameState.shotPreview !== null && !gameState.shotPreview.isCancelZone;
  
  const focusPucks = React.useMemo(() => {
    if (!isAiming) return [];
    return gameState.pucks.filter(p => p.team === gameState.currentTurn);
  }, [isAiming, gameState.pucks, gameState.currentTurn]);

  const getOrbPositionFromDistance = (d: number): Vector => {
      const W = BOARD_WIDTH; const H = BOARD_HEIGHT;
      const total = 2 * (W + H);
      const dist = d % total;
      if (dist < W) return { x: dist, y: 0 };
      if (dist < W + H) return { x: W, y: dist - W };
      if (dist < 2 * W + H) return { x: W - (dist - (W + H)), y: H };
      return { x: 0, y: H - (dist - (2 * W + H)) };
  };

  const renderPulsarLine = () => {
      if (!gameState.pulsarOrb) return null;
      const startDist = gameState.pulsarOrb.angle - PULSAR_ORB_LINE_LENGTH / 2;
      const endDist = gameState.pulsarOrb.angle + PULSAR_ORB_LINE_LENGTH / 2;
      const segments = 12; 
      const points: string[] = [];
      for (let i = 0; i <= segments; i++) {
          const d = startDist + (endDist - startDist) * (i / segments);
          const pos = getOrbPositionFromDistance(d);
          points.push(`${pos.x},${pos.y}`);
      }
      return (
          <g>
            <polyline points={points.join(' ')} fill="none" stroke="#f1c40f" strokeWidth="6" strokeLinecap="round" filter="url(#orb-glow)" opacity="0.8" />
            <circle cx={gameState.pulsarOrb.position.x} cy={gameState.pulsarOrb.position.y} r={gameState.pulsarOrb.radius} fill="#f1c40f" filter="url(#orb-glow)" />
          </g>
      );
  };

  return (
    <svg
      ref={ref}
      viewBox={gameState.viewBox}
      className={`w-full h-full ${gameState.shotPreview ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={onBoardMouseDown}
      onTouchStart={onBoardMouseDown}
      style={{ display: 'block', touchAction: 'none' }}
    >
      <defs>
        <filter id="puck-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.7" />
        </filter>
        <filter id="neon-glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#ff0000" floodOpacity="0.8" />
        </filter>
        <filter id="neon-glow-blue">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#00d4ff" floodOpacity="0.8" />
        </filter>
        <filter id="orb-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f1c40f" floodOpacity="1" />
        </filter>
        <pattern id="hex-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 60 15 L 60 45 L 30 60 L 0 45 L 0 15 Z" fill="none" stroke="rgba(255, 0, 0, 0.05)" strokeWidth="1"/>
        </pattern>
        <mask id="aim-mask">
            <rect x="-100" y="-200" width={BOARD_WIDTH+200} height={BOARD_HEIGHT+400} fill="white" />
            {focusPucks.map(p => (
                <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius + 30} fill="black" />
            ))}
        </mask>
      </defs>

      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="#020406" />
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="url(#hex-grid)" />
      
      <rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" pointerEvents="none" />

      <g className="imaginary-lines-layer" style={{ pointerEvents: 'none' }}>
        {gameState.imaginaryLine?.lines.map((line, idx) => {
            const life = gameState.imaginaryLine?.highlightedLines[idx] || 0;
            if (life <= 0) return null;
            return (
                <line key={`line-${idx}`} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} stroke={TEAM_COLORS[gameState.currentTurn]} strokeWidth="4" strokeLinecap="round" style={{ opacity: life / 30 }} filter={gameState.currentTurn === 'RED' ? 'url(#neon-glow-red)' : 'url(#neon-glow-blue)'} />
            );
        })}
      </g>

      <g className="goal-areas">
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#05080a" stroke={TEAM_COLORS.BLUE} strokeWidth="4" filter="url(#neon-glow-blue)" />
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#05080a" stroke={TEAM_COLORS.RED} strokeWidth="4" filter="url(#neon-glow-red)" />
      </g>

      <g className="pulsar-orb-container" style={{ pointerEvents: 'none' }}>
        {renderPulsarLine()}
      </g>

      <g className="particles" style={{ pointerEvents: 'none' }}>
        {gameState.particles.map(p => (
            <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />
        ))}
      </g>

      <rect x="-100" y="-200" width={BOARD_WIDTH+200} height={BOARD_HEIGHT+400} fill="rgba(0,0,0,0.75)" mask="url(#aim-mask)" style={{ opacity: isAiming ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }} />

      <g className="shot-preview" style={{ pointerEvents: 'none' }}>
        {gameState.shotPreview && !gameState.shotPreview.isCancelZone && (() => {
            const { start, end, power } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;
            const shotVector = subtractVectors(start, end);
            const dist = getVectorMagnitude(shotVector);
            const cappedDist = Math.min(dist, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);
            const isPortalArmed = gameState.pulsarShotArmed === puck.team;
            const beamX2 = start.x + Math.cos(angle) * (puck.radius + cappedDist);
            const beamY2 = start.y + Math.sin(angle) * (puck.radius + cappedDist);
            return (
                <g>
                  <line x1={start.x} y1={start.y} x2={beamX2} y2={beamY2} stroke={isPortalArmed ? "#f1c40f" : "white"} strokeWidth={2 + power * (isPortalArmed ? 12 : 4)} strokeDasharray={isPortalArmed ? "none" : "8 4"} opacity="0.8" />
                  <circle cx={beamX2} cy={beamY2} r={4 + power * (isPortalArmed ? 10 : 6)} fill={isPortalArmed ? "#f1c40f" : "white"} />
                </g>
            );
        })()}
      </g>

      <g className="pucks">
        {gameState.pucks.map(puck => {
            const isShootable = gameState.canShoot && puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
            return (
                <g key={puck.id} transform={`translate(${puck.position.x}, ${puck.position.y})`} 
                   onMouseDown={(e) => { e.stopPropagation(); onMouseDown(puck.id, {x: e.clientX, y: e.clientY}); }}
                   onTouchStart={(e) => { e.stopPropagation(); onMouseDown(puck.id, {x: e.touches[0].clientX, y: e.touches[0].clientY}); }}
                   className={isShootable ? 'cursor-pointer' : ''}
                >
                    <PuckShape puck={puck} />
                    {puck.isCharged && (
                        <circle r={puck.radius + 4} fill="none" stroke="#fde047" strokeWidth="2.5">
                            <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                    )}
                </g>
            );
        })}
      </g>
    </svg>
  );
});

const GameBoard = React.memo(GameBoardComponent);
export default GameBoard;
