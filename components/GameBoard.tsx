
import React from 'react';
import { GameState, Vector, Puck, PuckType, SynergyType, SpecialShotStatus } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PUCK_RADIUS, GOAL_WIDTH, GOAL_DEPTH, TEAM_COLORS, SYNERGY_EFFECTS, PARTICLE_CONFIG, SHOCKWAVE_COLORS, EMP_BURST_RADIUS, PAWN_DURABILITY, UI_COLORS, MAX_PULSAR_POWER, PULSAR_BAR_HEIGHT, MAX_DRAG_FOR_POWER, CANCEL_SHOT_THRESHOLD, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, SYNERGY_DESCRIPTIONS, PUCK_TYPE_PROPERTIES, PUCK_SVG_DATA, SPECIAL_PUCKS_FOR_ROYAL_SHOT, GRAVITY_WELL_RADIUS, REPULSOR_ARMOR_RADIUS, MIN_DRAG_DISTANCE, FLOATING_TEXT_CONFIG, Language, TRANSLATIONS, MAX_VELOCITY_FOR_TURN_END } from '../constants';
import InfoPanel from './InfoPanel';
import PuckShape from './PuckShape';

interface GameBoardProps {
  gameState: GameState;
  onMouseDown: (puckId: number, pos: Vector) => void;
  onBoardMouseDown: () => void;
  lang: Language;
}

const subtractVectors = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });
const getVectorMagnitude = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);

const GameBoard = React.forwardRef<SVGSVGElement, GameBoardProps>(({ gameState, onMouseDown, onBoardMouseDown, lang }, ref) => {
  const t = TRANSLATIONS[lang];
  
  const getSVGCoordinatesFromEvent = (e: React.MouseEvent | React.TouchEvent): Vector => {
    const svg = ref && typeof ref !== 'function' && ref.current 
      ? ref.current 
      : (e.currentTarget as SVGElement).ownerSVGElement;

    if (!svg) return { x: 0, y: 0 };
    
    let clientX, clientY;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return { x: 0, y: 0 };
    return pt.matrixTransform(screenCTM.inverse());
  };

  const handleLocalInteractionStart = (e: React.MouseEvent<SVGGElement> | React.TouchEvent<SVGGElement>, puckId: number) => {
    e.stopPropagation(); 
    onMouseDown(puckId, getSVGCoordinatesFromEvent(e));
  };
  
  const goalX = (BOARD_WIDTH - GOAL_WIDTH) / 2;

  const isAiming = gameState.shotPreview !== null && !gameState.shotPreview.isCancelZone;
  
  const focusPucks = React.useMemo(() => {
    if (!isAiming) return [];
    return gameState.pucks.filter(p => p.team === gameState.currentTurn);
  }, [isAiming, gameState.pucks, gameState.currentTurn]);

  const goalGlowIntensity = React.useMemo(() => {
    if (!gameState.isSimulating) return { top: 0, bottom: 0 };
    
    let topMax = 0;
    let bottomMax = 0;
    
    gameState.pucks.forEach(p => {
        const vel = getVectorMagnitude(p.velocity);
        if (vel < 1) return;
        
        const distTop = Math.sqrt(Math.pow(p.position.x - BOARD_WIDTH/2, 2) + Math.pow(p.position.y, 2));
        if (distTop < 300) topMax = Math.max(topMax, (1 - distTop/300) * (p.isCharged ? 1.5 : 0.6));
        
        const distBottom = Math.sqrt(Math.pow(p.position.x - BOARD_WIDTH/2, 2) + Math.pow(p.position.y - BOARD_HEIGHT, 2));
        if (distBottom < 300) bottomMax = Math.max(bottomMax, (1 - distBottom/300) * (p.isCharged ? 1.5 : 0.6));
    });
    
    return { top: topMax, bottom: bottomMax };
  }, [gameState.pucks, gameState.isSimulating]);

  return (
    <svg
      ref={ref}
      viewBox={gameState.viewBox}
      className={`w-full h-full ${gameState.shotPreview ? 'cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={onBoardMouseDown}
      onTouchStart={onBoardMouseDown}
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
        <pattern id="hex-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 60 15 L 60 45 L 30 60 L 0 45 L 0 15 Z" fill="none" stroke="rgba(255, 0, 0, 0.05)" strokeWidth="1"/>
        </pattern>
        <mask id="aim-mask">
            <rect x="-100" y="-100" width={BOARD_WIDTH+200} height={BOARD_HEIGHT+200} fill="white" />
            {focusPucks.map(p => (
                <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius + 30} fill="black" />
            ))}
        </mask>
      </defs>

      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="#020406" />
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="url(#hex-grid)" />
      
      <rect x={goalX - 50} y={-GOAL_DEPTH} width={GOAL_WIDTH + 100} height={GOAL_DEPTH + 100} 
            fill="radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)" 
            style={{ opacity: goalGlowIntensity.top }} pointerEvents="none" />
            
      <rect x={goalX - 50} y={BOARD_HEIGHT - 100} width={GOAL_WIDTH + 100} height={GOAL_DEPTH + 100} 
            fill="radial-gradient(circle, rgba(255, 0, 0, 0.2) 0%, transparent 70%)" 
            style={{ opacity: goalGlowIntensity.bottom }} pointerEvents="none" />

      <g className="goal-areas">
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#05080a" stroke={TEAM_COLORS.BLUE} strokeWidth="4" filter="url(#neon-glow-blue)" />
        <path d={`M ${goalX} ${-GOAL_DEPTH} L ${goalX + GOAL_WIDTH} ${-GOAL_DEPTH}`} stroke={TEAM_COLORS.BLUE} strokeWidth="10" strokeLinecap="round" opacity={0.5 + goalGlowIntensity.top} />
        
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#05080a" stroke={TEAM_COLORS.RED} strokeWidth="4" filter="url(#neon-glow-red)" />
        <path d={`M ${goalX} ${BOARD_HEIGHT + GOAL_DEPTH} L ${goalX + GOAL_WIDTH} ${BOARD_HEIGHT + GOAL_DEPTH}`} stroke={TEAM_COLORS.RED} strokeWidth="10" strokeLinecap="round" opacity={0.5 + goalGlowIntensity.bottom} />
      </g>

      <g className="particles" style={{ pointerEvents: 'none' }}>
        {gameState.particles.map(p => (
            <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />
        ))}
      </g>

      <rect x="-100" y="-100" width={BOARD_WIDTH+200} height={BOARD_HEIGHT+200} fill="rgba(0,0,0,0.75)" mask="url(#aim-mask)" style={{ opacity: isAiming ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none' }} />

      <g className="shot-preview" style={{ pointerEvents: 'none' }}>
        {gameState.shotPreview && !gameState.shotPreview.isCancelZone && (() => {
            const { start, end, power } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;
            const shotVector = subtractVectors(start, end);
            const dist = getVectorMagnitude(shotVector);
            const cappedDist = Math.min(dist, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);
            
            const beamX2 = start.x + Math.cos(angle) * (puck.radius + cappedDist);
            const beamY2 = start.y + Math.sin(angle) * (puck.radius + cappedDist);

            return (
                <g>
                  <line x1={start.x} y1={start.y} x2={beamX2} y2={beamY2} stroke="white" strokeWidth={2 + power * 4} strokeDasharray="8 4" opacity="0.8" />
                  <circle cx={beamX2} cy={beamY2} r={4 + power * 6} fill="white" filter="url(#neon-glow-red)" />
                </g>
            );
        })()}
      </g>

      <g className="pucks" filter="url(#puck-shadow)">
        {gameState.pucks.map((puck) => {
          const isSelected = gameState.selectedPuckId === puck.id;
          const isShootable = puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
          const isMoving = getVectorMagnitude(puck.velocity) > MAX_VELOCITY_FOR_TURN_END;
          const teamColor = TEAM_COLORS[puck.team];

          return (
            <g
              key={puck.id}
              transform={`translate(${puck.position.x}, ${puck.position.y})`}
              onMouseDown={(e) => handleLocalInteractionStart(e, puck.id)}
              onTouchStart={(e) => handleLocalInteractionStart(e, puck.id)}
              style={{ cursor: (isShootable && !isMoving) ? 'pointer' : 'default', pointerEvents: 'auto' }}
            >
              <PuckShape puck={puck} />
              
              {/* Charged pulse ring - Intermitente entre color de equipo y dorado */}
              {puck.isCharged && (
                  <circle r={puck.radius + 5} fill="none" stroke="#fde047" strokeWidth="3" opacity="0.6">
                      <animate attributeName="r" values={`${puck.radius+3};${puck.radius+14};${puck.radius+3}`} dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="stroke" values={`#fde047;${teamColor};#fde047`} dur="0.8s" repeatCount="indefinite" />
                  </circle>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
});

export default React.memo(GameBoard);
