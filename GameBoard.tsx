import React from 'react';
import { GameState, Vector, Puck, PuckType, SynergyType, SpecialShotStatus } from './types';
// Fixed: Removed missing constants EMP_BURST_RADIUS, PULSAR_BAR_HEIGHT, and SPECIAL_PUCKS_FOR_ROYAL_SHOT
import { BOARD_WIDTH, BOARD_HEIGHT, PUCK_RADIUS, GOAL_WIDTH, GOAL_DEPTH, TEAM_COLORS, SYNERGY_EFFECTS, PARTICLE_CONFIG, SHOCKWAVE_COLORS, PAWN_DURABILITY, UI_COLORS, MAX_PULSAR_POWER, MAX_DRAG_FOR_POWER, CANCEL_SHOT_THRESHOLD, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, SYNERGY_DESCRIPTIONS, PUCK_TYPE_PROPERTIES, PUCK_SVG_DATA, GRAVITY_WELL_RADIUS, REPULSOR_ARMOR_RADIUS, MIN_DRAG_DISTANCE, FLOATING_TEXT_CONFIG, MAX_VELOCITY_FOR_TURN_END } from './constants';
import InfoPanel from './components/InfoPanel';
import PuckShape from './components/PuckShape';

interface GameBoardProps {
  gameState: GameState;
  onMouseDown: (puckId: number, pos: Vector) => void;
  onBoardMouseDown: () => void;
}

const subtractVectors = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });
const getVectorMagnitude = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);

const GameBoard = React.forwardRef<SVGSVGElement, GameBoardProps>(({ gameState, onMouseDown, onBoardMouseDown }, ref) => {
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

  const infoCardPuck = gameState.infoCardPuckId !== null
    ? gameState.pucks.find(p => p.id === gameState.infoCardPuckId)
    : null;
    
  const isAiming = gameState.shotPreview !== null && !gameState.shotPreview.isCancelZone;
  
  const focusPucks = React.useMemo(() => {
    if (!isAiming) return [];
    return gameState.pucks.filter(p => p.team === gameState.currentTurn);
  }, [isAiming, gameState.pucks, gameState.currentTurn]);

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

  return (
    <svg
      ref={ref}
      viewBox={gameState.viewBox}
      className={`w-full h-full ${svgCursorClass}`}
      onMouseDown={onBoardMouseDown}
      onTouchStart={onBoardMouseDown}
    >
      <defs>
        <style>
            {`
                .cursor-default { cursor: default; }
                .cursor-grabbing { cursor: grabbing; }
                .cursor-not-allowed { cursor: not-allowed; }
                .cursor-pointer { cursor: pointer; }
                @keyframes breathe {
                    0% { stroke-opacity: 0.3; }
                    50% { stroke-opacity: 0.6; }
                    100% { stroke-opacity: 0.3; }
                }
                .line-breathe {
                    animation: breathe 2.5s infinite ease-in-out;
                }
                @keyframes goal-pulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }
                .goal-box-frame {
                    animation: goal-pulse 2s infinite ease-in-out;
                }
                .floating-text {
                    animation: rise-and-fade 1.5s ease-out forwards;
                    font-size: 1.5rem;
                    font-weight: 800;
                    paint-order: stroke;
                    stroke: #000000;
                    stroke-width: 4px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }
                @keyframes rise-and-fade {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-40px); opacity: 0; }
                }
            `}
        </style>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
        </filter>
        <filter id="neon-blue-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={TEAM_COLORS.BLUE} floodOpacity="0.8" />
        </filter>
        <filter id="neon-red-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={TEAM_COLORS.RED} floodOpacity="0.8" />
        </filter>
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(0, 246, 255, 0.04)" strokeWidth="1"/>
        </pattern>
        <mask id="aim-focus-mask">
            <rect x="-10" y="-100" width={BOARD_WIDTH+20} height={BOARD_HEIGHT+200} fill="white" />
            {focusPucks.map(puck => (
                <circle key={`focus-mask-${puck.id}`} cx={puck.position.x} cy={puck.position.y} r={puck.radius + 25} fill="black" />
            ))}
        </mask>
      </defs>

      <rect x="0" y={-GOAL_DEPTH-20} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2 + 40} fill="#020406" />
      <rect x="0" y={-GOAL_DEPTH-20} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2 + 40} fill="url(#grid)" opacity="0.5" />

      {/* Top Goal Area */}
      <g className="goal-area top">
          <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#000000" />
          <rect x={goalX + 5} y={-GOAL_DEPTH + 2} width={GOAL_WIDTH - 10} height={GOAL_DEPTH - 4} fill="rgba(0, 212, 255, 0.1)" />
          <path 
            d={`M ${goalX} 0 L ${goalX} ${-GOAL_DEPTH} L ${goalX + GOAL_WIDTH} ${-GOAL_DEPTH} L ${goalX + GOAL_WIDTH} 0`} 
            fill="none" 
            stroke={TEAM_COLORS.BLUE} 
            strokeWidth="6" 
            strokeLinejoin="round" 
            filter="url(#neon-blue-glow)"
            className="goal-box-frame"
          />
      </g>

      {/* Bottom Goal Area Adjusted for new HEIGHT */}
      <g className="goal-area bottom">
          <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="#000000" />
          <rect x={goalX + 5} y={BOARD_HEIGHT + 2} width={GOAL_WIDTH - 10} height={GOAL_DEPTH - 4} fill="rgba(255, 0, 0, 0.1)" />
          {/* Frame Principal (Caja Roja) */}
          <path 
            d={`M ${goalX} ${BOARD_HEIGHT} L ${goalX} ${BOARD_HEIGHT + GOAL_DEPTH} L ${goalX + GOAL_WIDTH} ${BOARD_HEIGHT + GOAL_DEPTH} L ${goalX + GOAL_WIDTH} ${BOARD_HEIGHT}`} 
            fill="none" 
            stroke={TEAM_COLORS.RED} 
            strokeWidth="8" 
            strokeLinejoin="round" 
            filter="url(#neon-red-glow)"
            className="goal-box-frame"
          />
          {/* Marco exterior extra para sensación de volumen */}
          <path 
            d={`M ${goalX - 4} ${BOARD_HEIGHT} L ${goalX - 4} ${BOARD_HEIGHT + GOAL_DEPTH + 4} L ${goalX + GOAL_WIDTH + 4} ${BOARD_HEIGHT + GOAL_DEPTH + 4} L ${goalX + GOAL_WIDTH + 4} ${BOARD_HEIGHT}`} 
            fill="none" 
            stroke={TEAM_COLORS.RED} 
            strokeWidth="2" 
            opacity="0.3"
          />
      </g>

      <line x1="0" y1={BOARD_HEIGHT / 2} x2={BOARD_WIDTH} y2={BOARD_HEIGHT / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="10 10" />
      <circle cx={BOARD_WIDTH/2} cy={BOARD_HEIGHT/2} r="100" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />

      <g className="shot-preview">
        {gameState.shotPreview && (() => {
            const { start, end, power, isCancelZone, specialShotType } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;
            const shotVector = subtractVectors(start, end);
            const distance = getVectorMagnitude(shotVector);
            if (distance < 5) return null;
            const cappedDistance = Math.min(distance, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);
            const beamStart = { x: start.x + Math.cos(angle) * puck.radius, y: start.y + Math.sin(angle) * puck.radius };
            const beamEnd = { x: start.x + Math.cos(angle) * (puck.radius + cappedDistance), y: start.y + Math.sin(angle) * (puck.radius + cappedDistance) };
            let color = isCancelZone ? "#666" : TEAM_COLORS[gameState.currentTurn];
            return (
                <g style={{ pointerEvents: 'none' }}>
                    <line x1={beamStart.x} y1={beamStart.y} x2={beamEnd.x} y2={beamEnd.y} stroke={color} strokeWidth={2 + power * 8} strokeLinecap="round" opacity="0.8" />
                    <circle cx={beamEnd.x} cy={beamEnd.y} r={4 + power * 6} fill={color} filter="url(#shadow)" />
                </g>
            );
        })()}
      </g>
      
      <g className="particles">
        {gameState.particles.map(p => (
            <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />
        ))}
      </g>

      <rect x={-10} y={-100} width={BOARD_WIDTH+20} height={BOARD_HEIGHT+200} fill="rgba(1, 4, 9, 0.7)" mask="url(#aim-focus-mask)" style={{ opacity: isAiming ? 1 : 0, transition: 'opacity 0.4s ease-out', pointerEvents: 'none' }} />

      <g className="pucks" filter="url(#shadow)">
        {gameState.pucks.map((puck) => {
          const isShootable = gameState.canShoot && puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
          return (
            <g
              key={puck.id}
              transform={`translate(${puck.position.x}, ${puck.position.y})`}
              onMouseDown={(e) => handleLocalInteractionStart(e, puck.id)}
              onTouchStart={(e) => handleLocalInteractionStart(e, puck.id)}
              className={isShootable ? 'cursor-pointer' : ''}
            >
              <circle r={puck.radius + 10} fill="transparent" />
              <PuckShape puck={puck} />
              {puck.isCharged && (
                  <circle r={puck.radius + 4} fill="none" stroke="#fde047" strokeWidth="2.5" className="line-breathe" />
              )}
            </g>
          );
        })}
      </g>

      <g className="floating-texts">
         {gameState.floatingTexts.map(ft => (
          <text
            key={ft.id}
            x={ft.position.x}
            y={ft.position.y}
            fill={ft.color}
            textAnchor="middle"
            dominantBaseline="central"
            className="floating-text"
            style={{ opacity: ft.opacity }}
          >
            {ft.text}
          </text>
        ))}
      </g>
      
       <foreignObject x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} style={{ pointerEvents: 'none' }}>
            <div style={infoPanelContainerStyle}>
                {infoCardPuck && (
                    <InfoPanel
                        puck={infoCardPuck}
                        specialShotStatus={infoCardPuck.puckType === 'KING' ? gameState.specialShotStatus[infoCardPuck.team] : 'NONE'}
                        renderDirection={infoPanelProps.renderDirection}
                        pointerHorizontalOffset={infoPanelProps.pointerHorizontalOffset}
                        lang="es"
                    />
                )}
            </div>
      </foreignObject>
    </svg>
  );
});

export default React.memo(GameBoard);