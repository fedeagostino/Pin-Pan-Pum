
import React from 'react';
import { GameState, Vector, Puck, PuckType, SynergyType, SpecialShotStatus } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PUCK_RADIUS, GOAL_WIDTH, GOAL_DEPTH, TEAM_COLORS, SYNERGY_EFFECTS, PARTICLE_CONFIG, SHOCKWAVE_COLORS, EMP_BURST_RADIUS, PAWN_DURABILITY, UI_COLORS, MAX_PULSAR_POWER, PULSAR_BAR_HEIGHT, MAX_DRAG_FOR_POWER, CANCEL_SHOT_THRESHOLD, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, SYNERGY_DESCRIPTIONS, PUCK_TYPE_PROPERTIES, PUCK_SVG_DATA, SPECIAL_PUCKS_FOR_ROYAL_SHOT, GRAVITY_WELL_RADIUS, REPULSOR_ARMOR_RADIUS, MIN_DRAG_DISTANCE, FLOATING_TEXT_CONFIG, Language, TRANSLATIONS } from '../constants';
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

  const highlightedLine = gameState.imaginaryLine && gameState.imaginaryLine.highlightedLineIndex !== null
    ? gameState.imaginaryLine.lines[gameState.imaginaryLine.highlightedLineIndex]
    : null;
    
  const synergyPuckIds = highlightedLine?.synergyType ? new Set(highlightedLine.sourcePuckIds) : new Set();
  const passiveGhostPuckIds = highlightedLine?.passivelyCrossedBy ?? new Set();

  const infoCardPuck = gameState.infoCardPuckId !== null
    ? gameState.pucks.find(p => p.id === gameState.infoCardPuckId)
    : null;

  const goalGlowState = React.useMemo(() => {
      if (!gameState.isSimulating) return { top: { intensity: 0, type: 'none' }, bottom: { intensity: 0, type: 'none' } };
      return { top: { intensity: 0.1, type: 'positive' }, bottom: { intensity: 0.1, type: 'positive' } };
  }, [gameState.isSimulating]);

  const createGlowStyle = (glowState: { intensity: number, type: string }, positiveColor: string): React.CSSProperties => {
      return {
          '--glow-color': positiveColor,
          '--glow-intensity-blur': '15px',
          animation: 'light-flicker 4s infinite'
      } as React.CSSProperties;
  };

  const topGoalStyle = createGlowStyle(goalGlowState.top, TEAM_COLORS.BLUE);
  const bottomGoalStyle = createGlowStyle(goalGlowState.bottom, TEAM_COLORS.RED);

  const INFO_PANEL_WIDTH = 320;
  const INFO_PANEL_PUCK_OFFSET = 45;
  const BOARD_PADDING = 10;

  let infoPanelContainerStyle: React.CSSProperties = { display: 'none' };
  let infoPanelProps: { renderDirection: 'up' | 'down', pointerHorizontalOffset: number } = { renderDirection: 'up', pointerHorizontalOffset: 0 };

  if (infoCardPuck) {
      const { position, radius, team } = infoCardPuck;
      const renderDirection = position.y > BOARD_HEIGHT / 2 ? 'up' : 'down';
      const halfWidth = INFO_PANEL_WIDTH / 2;
      let panelLeft = position.x - halfWidth;
      panelLeft = Math.max(BOARD_PADDING, panelLeft);
      panelLeft = Math.min(panelLeft, BOARD_WIDTH - INFO_PANEL_WIDTH - BOARD_PADDING);
      const panelCenterX = panelLeft + halfWidth;
      const pointerHorizontalOffset = position.x - panelCenterX;
      let top;
      let baseTransform = '';
      let transformOrigin;
      if (renderDirection === 'up') {
          top = position.y - radius - INFO_PANEL_PUCK_OFFSET;
          baseTransform = 'translateY(-100%)';
          transformOrigin = 'center bottom';
      } else {
          top = position.y + radius + INFO_PANEL_PUCK_OFFSET;
          baseTransform = 'translateY(0)';
          transformOrigin = 'center top';
      }
      const rotation = team === 'BLUE' ? ' rotate(180deg)' : '';
      infoPanelContainerStyle = {
          position: 'absolute',
          left: `${panelLeft}px`,
          top: `${top}px`,
          width: `${INFO_PANEL_WIDTH}px`,
          transform: baseTransform + rotation,
          transformOrigin: transformOrigin,
          zIndex: 10,
          pointerEvents: 'auto',
          display: 'block',
      };
      infoPanelProps = { renderDirection, pointerHorizontalOffset };
  }

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
            <rect x="-1" y="-1" width={BOARD_WIDTH+2} height={BOARD_HEIGHT+2} fill="white" />
            {focusPucks.map(puck => (
                <circle key={`focus-mask-${puck.id}`} cx={puck.position.x} cy={puck.position.y} r={puck.radius + 20} fill="black" />
            ))}
        </mask>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="33%" stopColor="#ffff00" />
            <stop offset="66%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#ff0000" />
        </linearGradient>
      </defs>

      {/* Board Background */}
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill={UI_COLORS.BACKGROUND_DARK} />
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="url(#grid)" />
      
      {/* Board Border */}
      <rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="none" stroke={TEAM_COLORS[gameState.currentTurn]} strokeWidth="2" style={{animation: 'light-flicker 5s infinite'}} />

      {/* Porterías */}
      <g style={topGoalStyle}>
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#050505" stroke={TEAM_COLORS.BLUE} strokeWidth="1" />
        <line x1={goalX} y1={0} x2={goalX+GOAL_WIDTH} y2={0} stroke={TEAM_COLORS.BLUE} strokeWidth="5" filter="url(#pulsar-glow)" />
      </g>
      <g style={bottomGoalStyle}>
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#050505" stroke={TEAM_COLORS.RED} strokeWidth="1" />
        <line x1={goalX} y1={BOARD_HEIGHT} x2={goalX+GOAL_WIDTH} y2={BOARD_HEIGHT} stroke={TEAM_COLORS.RED} strokeWidth="5" filter="url(#pulsar-glow)" />
      </g>

      {/* Partículas de ambiente */}
      <g className="particles" style={{ pointerEvents: 'none' }}>
        {gameState.particles.map(p => (
            <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity, filter: 'blur(1px)' }} />
        ))}
      </g>

      {/* Aiming Focus Overlay */}
      <rect 
        x={-1} y={-1} 
        width={BOARD_WIDTH+2} height={BOARD_HEIGHT+2} 
        fill="rgba(0, 0, 0, 0.7)" 
        mask="url(#aim-focus-mask)" 
        style={{ 
            opacity: isAiming ? 1 : 0, 
            transition: 'opacity 0.5s',
            pointerEvents: 'none' 
        }} 
      />

      {/* Shot Preview (Trajectory Line) */}
      <g className="shot-preview" style={{ pointerEvents: 'none' }}>
        {gameState.shotPreview && (() => {
            const { start, end, power, isCancelZone, specialShotType } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;

            const shotVector = subtractVectors(start, end);
            const distance = getVectorMagnitude(shotVector);
            
            if (distance < MIN_DRAG_DISTANCE / 2) return null;

            const cappedDistance = Math.min(distance, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);

            const beamStart = {
                x: start.x + Math.cos(angle) * puck.radius,
                y: start.y + Math.sin(angle) * puck.radius,
            };
            const beamEnd = {
                x: start.x + Math.cos(angle) * (puck.radius + cappedDistance),
                y: start.y + Math.sin(angle) * (puck.radius + cappedDistance),
            };

            let color = TEAM_COLORS[gameState.currentTurn];
            if (specialShotType === 'ULTIMATE') color = 'url(#rainbow-gradient)';
            else if (specialShotType === 'ROYAL') color = UI_COLORS.GOLD;

            if (isCancelZone) color = 'rgba(100, 116, 139, 0.3)';

            const beamWidth = 4 + power * 12;

            return (
                <g opacity={isAiming ? 1 : 0.4}>
                    {/* Glow exterior */}
                    <line 
                        x1={beamStart.x} y1={beamStart.y} 
                        x2={beamEnd.x} y2={beamEnd.y} 
                        stroke={color} 
                        strokeWidth={beamWidth + 4} 
                        strokeLinecap="round" 
                        opacity="0.3" 
                        filter="url(#pulsar-glow)"
                    />
                    {/* Línea principal */}
                    <line 
                        x1={beamStart.x} y1={beamStart.y} 
                        x2={beamEnd.x} y2={beamEnd.y} 
                        stroke={color} 
                        strokeWidth={beamWidth} 
                        strokeLinecap="round" 
                        strokeDasharray={isCancelZone ? "5 5" : "none"}
                    />
                    {/* Punta de flecha */}
                    <path 
                        d="M 10 0 L -5 -6 L -5 6 Z" 
                        fill={isCancelZone ? "gray" : "white"} 
                        transform={`translate(${beamEnd.x}, ${beamEnd.y}) rotate(${angle * 180 / Math.PI})`}
                    />
                </g>
            );
        })()}
      </g>

      {/* Fichas */}
      <g className="pucks" filter="url(#shadow)">
        {gameState.pucks.map((puck) => {
          const isSelected = gameState.selectedPuckId === puck.id;
          const isShootable = gameState.canShoot && puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
          const isPhased = puck.temporaryEffects.some(e => e.type === 'PHASED');
          
          let glowFilter = "";
          if (puck.isCharged) glowFilter = "url(#puck-glow-charged)";
          else if (isSelected) glowFilter = puck.team === 'BLUE' ? `url(#puck-glow-blue)` : `url(#puck-glow-red)`;

          return (
            <g
              key={puck.id}
              transform={`translate(${puck.position.x}, ${puck.position.y})`}
              onMouseDown={(e) => handleLocalInteractionStart(e, puck.id)}
              onTouchStart={(e) => handleLocalInteractionStart(e, puck.id)}
              className={isPhased ? 'phased-puck' : ''}
              style={{ cursor: isShootable ? 'pointer' : 'default', pointerEvents: 'auto' }}
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

      <foreignObject x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} style={{ pointerEvents: 'none' }}>
            <div style={infoPanelContainerStyle}>
                {infoCardPuck && (
                    <InfoPanel
                        puck={infoCardPuck}
                        specialShotStatus={infoCardPuck.puckType === 'KING' ? gameState.specialShotStatus[infoCardPuck.team] : 'NONE'}
                        renderDirection={infoPanelProps.renderDirection}
                        pointerHorizontalOffset={infoPanelProps.pointerHorizontalOffset}
                        lang={lang}
                    />
                )}
            </div>
      </foreignObject>
    </svg>
  );
});

export default React.memo(GameBoard);
