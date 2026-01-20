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

  const svgCursorClass = gameState.shotPreview 
    ? (gameState.shotPreview.isCancelZone ? 'cursor-not-allowed' : 'cursor-grabbing') 
    : 'cursor-default';

  const isAiming = gameState.shotPreview !== null && !gameState.shotPreview.isCancelZone;
  
  const focusPucks = React.useMemo(() => {
    if (!isAiming) return [];
    return gameState.pucks.filter(p => p.team === gameState.currentTurn);
  }, [isAiming, gameState.pucks, gameState.currentTurn]);

  return (
    <svg
      ref={ref}
      viewBox={gameState.viewBox}
      className={`w-full h-full ${svgCursorClass}`}
      onMouseDown={onBoardMouseDown}
      onTouchStart={onBoardMouseDown}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.8" />
        </filter>
        <filter id="puck-glow-blue">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="blur" operator="out" result="glow"/>
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={TEAM_COLORS.BLUE} />
        </filter>
         <filter id="puck-glow-red">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={TEAM_COLORS.RED} />
        </filter>
         <filter id="puck-glow-charged">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ff0000" floodOpacity="1" />
        </filter>
        <filter id="pulsar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 0, 0, 0.05)" strokeWidth="1"/>
        </pattern>
        <mask id="aim-focus-mask">
            <rect x="-1" y={-GOAL_DEPTH-1} width={BOARD_WIDTH+2} height={BOARD_HEIGHT + GOAL_DEPTH * 2 + 2} fill="white" />
            {focusPucks.map(puck => (
                <circle key={`focus-mask-${puck.id}`} cx={puck.position.x} cy={puck.position.y} r={puck.radius + 20} fill="black" />
            ))}
        </mask>
      </defs>

      {/* Background including goal depths */}
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill={UI_COLORS.BACKGROUND_DARK} />
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="url(#grid)" />
      
      {/* Board Bounds */}
      <rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="none" stroke={TEAM_COLORS[gameState.currentTurn]} strokeWidth="2" opacity="0.3" />

      {/* Goal Render (Visuals) */}
      <g className="goals">
        {/* Top Goal (Blue) */}
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#1a1a1a" stroke={TEAM_COLORS.BLUE} strokeWidth="3" />
        {/* Bottom Goal (Red) */}
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#1a1a1a" stroke={TEAM_COLORS.RED} strokeWidth="3" />
      </g>

      <g className="particles" style={{ pointerEvents: 'none' }}>
        {gameState.particles.map(p => (
            <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />
        ))}
      </g>

      <rect 
        x={-1} y={-GOAL_DEPTH-1} 
        width={BOARD_WIDTH+2} height={BOARD_HEIGHT + GOAL_DEPTH * 2 + 2} 
        fill="rgba(0, 0, 0, 0.7)" 
        mask="url(#aim-focus-mask)" 
        style={{ 
            opacity: isAiming ? 1 : 0, 
            transition: 'opacity 0.5s',
            pointerEvents: 'none' 
        }} 
      />

      <g className="shot-preview" style={{ pointerEvents: 'none' }}>
        {gameState.shotPreview && (() => {
            const { start, end, power, isCancelZone } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;
            const shotVector = subtractVectors(start, end);
            const distance = getVectorMagnitude(shotVector);
            const cappedDistance = Math.min(distance, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);
            const beamEnd = {
                x: start.x + Math.cos(angle) * (puck.radius + cappedDistance),
                y: start.y + Math.sin(angle) * (puck.radius + cappedDistance),
            };
            return (
                <line x1={start.x} y1={start.y} x2={beamEnd.x} y2={beamEnd.y} stroke="white" strokeWidth="2" strokeDasharray="5 5" />
            );
        })()}
      </g>

      <g className="pucks" filter="url(#shadow)">
        {gameState.pucks.map((puck) => {
          const isSelected = gameState.selectedPuckId === puck.id;
          const isShootable = puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
          const isMovingFast = getVectorMagnitude(puck.velocity) > MAX_VELOCITY_FOR_TURN_END * 2;

          let glowFilter = "";
          if (puck.isCharged) glowFilter = "url(#puck-glow-charged)";
          else if (isSelected) glowFilter = puck.team === 'BLUE' ? `url(#puck-glow-blue)` : `url(#puck-glow-red)`;

          return (
            <g
              key={puck.id}
              transform={`translate(${puck.position.x}, ${puck.position.y})`}
              onMouseDown={(e) => handleLocalInteractionStart(e, puck.id)}
              onTouchStart={(e) => handleLocalInteractionStart(e, puck.id)}
              style={{ cursor: (isShootable && !isMovingFast) ? 'pointer' : 'default', pointerEvents: 'auto' }}
            >
              <circle r={puck.radius + 15} fill="transparent" />
              <g filter={glowFilter}>
                <g transform={`rotate(${puck.rotation})`}>
                  <PuckShape puck={puck} />
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
});

export default React.memo(GameBoard);