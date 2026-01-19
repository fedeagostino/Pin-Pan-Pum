import React from 'react';
import { GameState, Vector, Puck, PuckType, SynergyType, SpecialShotStatus } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PUCK_RADIUS, GOAL_WIDTH, GOAL_DEPTH, TEAM_COLORS, SYNERGY_EFFECTS, PARTICLE_CONFIG, SHOCKWAVE_COLORS, EMP_BURST_RADIUS, PAWN_DURABILITY, UI_COLORS, MAX_PULSAR_POWER, PULSAR_BAR_HEIGHT, MAX_DRAG_FOR_POWER, CANCEL_SHOT_THRESHOLD, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, SYNERGY_DESCRIPTIONS, PUCK_TYPE_PROPERTIES, PUCK_SVG_DATA, SPECIAL_PUCKS_FOR_ROYAL_SHOT, GRAVITY_WELL_RADIUS, REPULSOR_ARMOR_RADIUS, MIN_DRAG_DISTANCE, FLOATING_TEXT_CONFIG } from '../constants';
import InfoPanel from './InfoPanel';
import PuckShape from './PuckShape';

interface GameBoardProps {
  gameState: GameState;
  onMouseDown: (puckId: number, pos: Vector) => void;
  onBoardMouseDown: () => void;
}

// Helper functions for vector math, scoped to this component
const subtractVectors = (v1: Vector, v2: Vector): Vector => ({ x: v1.x - v2.x, y: v1.y - v2.y });
const getVectorMagnitude = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);

// Helper to get color based on durability percentage
const getDurabilityColor = (percentage: number): string => {
    // Clamp percentage between 0 and 1
    const p = Math.max(0, Math.min(1, percentage));

    const red = { r: 255, g: 7, b: 58 };     // from --color-red-neon
    const yellow = { r: 241, g: 224, b: 90 }; // from --color-accent-yellow
    const green = { r: 57, g: 211, b: 83 };   // from --color-accent-green

    let r, g, b;

    if (p > 0.5) {
        // Scale between yellow (at p=0.5) and green (at p=1.0)
        const scale = (p - 0.5) * 2;
        r = Math.round(yellow.r * (1 - scale) + green.r * scale);
        g = Math.round(yellow.g * (1 - scale) + green.g * scale);
        b = Math.round(yellow.b * (1 - scale) + green.b * scale);
    } else {
        // Scale between red (at p=0.0) and yellow (at p=0.5)
        const scale = p * 2;
        r = Math.round(red.r * (1 - scale) + yellow.r * scale);
        g = Math.round(red.g * (1 - scale) + yellow.g * scale);
        b = Math.round(red.b * (1 - scale) + yellow.b * scale);
    }

    return `rgb(${r}, ${g}, ${b})`;
};

const GameBoard = React.forwardRef<SVGSVGElement, GameBoardProps>(({ gameState, onMouseDown, onBoardMouseDown }, ref) => {
  const getSVGCoordinatesFromEvent = (e: React.MouseEvent | React.TouchEvent): Vector => {
    const svg = ref && typeof ref !== 'function' && ref.current 
      ? ref.current 
      : (e.currentTarget as SVGElement).ownerSVGElement;

    if (!svg) return { x: 0, y: 0 };
    
    let clientX, clientY;
    if ('touches' in e) { // It's a TouchEvent
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else { // It's a MouseEvent
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
    
  const showTurnHighlights = gameState.canShoot && !gameState.isSimulating;
  
    const goalGlowState = React.useMemo(() => {
        if (!gameState.isSimulating) {
            return {
                top: { intensity: 0, type: 'none' }, // For Red to score
                bottom: { intensity: 0, type: 'none' } // For Blue to score
            };
        }

        let topPositive = 0, topWarningUncharged = 0, topWarningOwnGoal = 0;
        let bottomPositive = 0, bottomWarningUncharged = 0, bottomWarningOwnGoal = 0;

        const GLOW_INFLUENCE_Y = BOARD_HEIGHT * 0.4;

        for (const puck of gameState.pucks) {
            if (getVectorMagnitude(puck.velocity) < 0.5) continue;

            const distToGoalCenter = Math.abs(puck.position.x - BOARD_WIDTH / 2);
            const xFactor = Math.max(0, 1 - (distToGoalCenter - GOAL_WIDTH / 2) / (BOARD_WIDTH * 0.25));
            if (xFactor <= 0) continue;

            if (puck.velocity.y < 0) { // Moving upwards (towards top goal)
                const distY = puck.position.y;
                if (distY < GLOW_INFLUENCE_Y) {
                    const yFactor = 1 - (distY / GLOW_INFLUENCE_Y);
                    const intensity = yFactor * xFactor;

                    if (puck.team === 'RED') {
                        if (puck.isCharged) topPositive = Math.max(topPositive, intensity);
                        else topWarningUncharged = Math.max(topWarningUncharged, intensity);
                    } else {
                        topWarningOwnGoal = Math.max(topWarningOwnGoal, intensity);
                    }
                }
            }

            if (puck.velocity.y > 0) { // Moving downwards (towards bottom goal)
                const distY = BOARD_HEIGHT - puck.position.y;
                if (distY < GLOW_INFLUENCE_Y) {
                    const yFactor = 1 - (distY / GLOW_INFLUENCE_Y);
                    const intensity = yFactor * xFactor;
                    
                    if (puck.team === 'BLUE') {
                        if (puck.isCharged) bottomPositive = Math.max(bottomPositive, intensity);
                        else bottomWarningUncharged = Math.max(bottomWarningUncharged, intensity);
                    } else {
                        bottomWarningOwnGoal = Math.max(bottomWarningOwnGoal, intensity);
                    }
                }
            }
        }

        let topGlow = { intensity: 0, type: 'none' };
        if (topWarningOwnGoal > 0) topGlow = { intensity: topWarningOwnGoal, type: 'warning_own_goal' };
        else if (topWarningUncharged > 0) topGlow = { intensity: topWarningUncharged, type: 'warning_uncharged' };
        else if (topPositive > 0) topGlow = { intensity: topPositive, type: 'positive' };
        
        let bottomGlow = { intensity: 0, type: 'none' };
        if (bottomWarningOwnGoal > 0) bottomGlow = { intensity: bottomWarningOwnGoal, type: 'warning_own_goal' };
        else if (bottomWarningUncharged > 0) bottomGlow = { intensity: bottomWarningUncharged, type: 'warning_uncharged' };
        else if (bottomPositive > 0) bottomGlow = { intensity: bottomPositive, type: 'positive' };

        return { top: topGlow, bottom: bottomGlow };

    }, [gameState.pucks, gameState.isSimulating]);

    const createGlowStyle = (glowState: { intensity: number, type: string }, positiveColor: string): React.CSSProperties => {
        if (glowState.intensity <= 0.05) return {};

        let color = 'transparent';
        let animationName = 'none';

        switch(glowState.type) {
            case 'positive':
                color = positiveColor;
                animationName = 'goal-glow-positive-anim';
                break;
            case 'warning_uncharged':
                color = '#facc15'; // Yellow
                animationName = 'goal-glow-warning-anim';
                break;
            case 'warning_own_goal':
                color = '#ef4444'; // Red
                animationName = 'goal-glow-warning-anim';
                break;
            default:
                return {};
        }

        return {
            '--glow-color': color,
            '--glow-intensity-blur': `${5 + glowState.intensity * 40}px`,
            animationName,
            animationDuration: '1.5s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out'
        } as React.CSSProperties;
    };

    const topGoalStyle = createGlowStyle(goalGlowState.top, TEAM_COLORS.BLUE);
    const bottomGoalStyle = createGlowStyle(goalGlowState.bottom, TEAM_COLORS.RED);

  // --- InfoPanel Positioning Logic ---
  const INFO_PANEL_WIDTH = 320;
  const INFO_PANEL_PUCK_OFFSET = 45;
  const BOARD_PADDING = 10;

  let infoPanelContainerStyle: React.CSSProperties = { display: 'none' };
  let infoPanelProps: { renderDirection: 'up' | 'down', pointerHorizontalOffset: number } = { renderDirection: 'up', pointerHorizontalOffset: 0 };

  if (infoCardPuck) {
      const { position, radius, team } = infoCardPuck;

      // --- DYNAMIC Vertical Positioning ---
      // The panel appears above pucks in the bottom half and below pucks in the top half.
      // This keeps the panel away from the user's finger and the edges of the screen.
      const renderDirection = position.y > BOARD_HEIGHT / 2 ? 'up' : 'down';

      // --- Horizontal Positioning (clamped to board edges) ---
      const halfWidth = INFO_PANEL_WIDTH / 2;
      let panelLeft = position.x - halfWidth;
      panelLeft = Math.max(BOARD_PADDING, panelLeft);
      panelLeft = Math.min(panelLeft, BOARD_WIDTH - INFO_PANEL_WIDTH - BOARD_PADDING);
      const panelCenterX = panelLeft + halfWidth;
      const pointerHorizontalOffset = position.x - panelCenterX;

      // --- Style Assembly ---
      let top;
      let baseTransform = '';
      let transformOrigin;

      if (renderDirection === 'up') {
          top = position.y - radius - INFO_PANEL_PUCK_OFFSET;
          baseTransform = 'translateY(-100%)'; // Aligns bottom of panel with `top` value
          transformOrigin = 'center bottom';
      } else { // 'down'
          top = position.y + radius + INFO_PANEL_PUCK_OFFSET;
          baseTransform = 'translateY(0)'; // Aligns top of panel with `top` value
          transformOrigin = 'center top';
      }

      // The BLUE team's UI is always rotated 180 degrees for head-to-head play.
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
      
      // This prop tells the InfoPanel component which way to draw its pointer.
      // The rotation is handled by the container style above.
      infoPanelProps = { renderDirection, pointerHorizontalOffset };
  }

  const svgCursorClass = gameState.shotPreview 
    ? (gameState.shotPreview.isCancelZone ? 'cursor-not-allowed' : 'cursor-grabbing') 
    : 'cursor-default';

  const isAiming = gameState.shotPreview !== null && !gameState.shotPreview.isCancelZone;
  const isAimingSpecialShot = gameState.shotPreview?.specialShotType === 'ROYAL' || gameState.shotPreview?.specialShotType === 'ULTIMATE';
  
  const focusPucks = React.useMemo(() => {
    // When aiming, we want to highlight all pucks of the current team.
    if (!isAiming) {
        return [];
    }
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
                @keyframes flow {
                    to { stroke-dashoffset: 100; }
                }
                .line-flow {
                    stroke-dasharray: 8 12;
                    stroke-dashoffset: 0;
                    animation: flow 2s linear infinite;
                }
                 @keyframes glitch-phase {
                    0% { opacity: 0.6; transform: translate(0, 0); }
                    25% { opacity: 0.4; transform: translate(-1px, 1px); }
                    50% { opacity: 0.7; transform: translate(1px, -1px); }
                    75% { opacity: 0.5; transform: translate(1px, 1px); }
                    100% { opacity: 0.6; transform: translate(0, 0); }
                }
                .phased-puck {
                    animation: glitch-phase 0.15s infinite;
                }
                 @keyframes rise-and-fade {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-40px); opacity: 0; }
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
                 .preview-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    paint-order: stroke;
                    stroke: #000000;
                    stroke-width: 3px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    animation: rise-and-fade 2.5s ease-out forwards;
                    animation-delay: 1.5s;
                    opacity: 0; /* Start invisible */
                }
                
                @keyframes goal-glow-positive-anim {
                    50% { filter: drop-shadow(0 0 var(--glow-intensity-blur) var(--glow-color)); }
                }
                @keyframes goal-glow-warning-anim {
                    0% { filter: drop-shadow(0 0 calc(var(--glow-intensity-blur) * 0.7) var(--glow-color)); opacity: 0.8; }
                    50% { filter: drop-shadow(0 0 var(--glow-intensity-blur) var(--glow-color)); opacity: 1; }
                    100% { filter: drop-shadow(0 0 calc(var(--glow-intensity-blur) * 0.7) var(--glow-color)); opacity: 0.8; }
                }
                 
                 @keyframes card-fade-in-up {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                 @keyframes special-aim-dim {
                    from { opacity: 0; }
                    to { opacity: 1; }
                 }
                 .special-aim-dim-rect {
                    animation: special-aim-dim 0.3s ease-out forwards;
                 }
            `}
        </style>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
        </filter>
        <filter id="puck-glow-blue">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="${TEAM_COLORS.BLUE}" floodOpacity="0.7" />
        </filter>
         <filter id="puck-glow-red">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="${TEAM_COLORS.RED}" floodOpacity="0.7" />
        </filter>
        <filter id="puck-glow-blue-active">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="${TEAM_COLORS.BLUE}" floodOpacity="1" />
        </filter>
         <filter id="puck-glow-red-active">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="${TEAM_COLORS.RED}" floodOpacity="1" />
        </filter>
         <filter id="puck-glow-charged">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fde047" floodOpacity="1" />
        </filter>
        <filter id="puck-glow-royal-ready">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="${UI_COLORS.GOLD}" floodOpacity="1" />
        </filter>
        <filter id="puck-glow-ultimate-ready">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="1">
                <animate attributeName="flood-color" values="#ff00de;#00f6ff;#ff00de" dur="2s" repeatCount="indefinite" />
            </feDropShadow>
        </filter>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="16%" stopColor="#ff7700" />
            <stop offset="33%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="66%" stopColor="#0000ff" />
            <stop offset="83%" stopColor="#ff00ff" />
            <stop offset="100%" stopColor="#ff0000" />
        </linearGradient>
        <filter id="pulsar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        {Object.entries(SYNERGY_EFFECTS).map(([key, value]) => (
            <filter key={`synergy-glow-${key}`} id={`synergy-glow-${key as SynergyType}`} x="-50%" y="-50%" width="200%" height="200%">
                 <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={value.color} floodOpacity="1" />
            </filter>
        ))}
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(0, 246, 255, 0.04)" strokeWidth="1"/>
        </pattern>
        <pattern id="goal-net-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="currentColor" strokeWidth="1" />
        </pattern>
        
        <mask id="aim-focus-mask">
            <rect x="-1" y="-1" width={BOARD_WIDTH+2} height={BOARD_HEIGHT+2} fill="white" />
            {focusPucks.map(puck => (
                <circle
                    key={`focus-mask-${puck.id}`}
                    cx={puck.position.x}
                    cy={puck.position.y}
                    r={puck.radius + 20}
                    fill="black"
                />
            ))}
        </mask>
      </defs>

      {/* Opaque board background */}
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="var(--color-bg-dark)" />
      {/* Board Background Texture */}
      <rect x="0" y={-GOAL_DEPTH} width={BOARD_WIDTH} height={BOARD_HEIGHT + GOAL_DEPTH * 2} fill="url(#grid)" opacity="0.5" />

      {/* Goals */}
      <g style={topGoalStyle}>
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill={UI_COLORS.BACKGROUND_MEDIUM} />
        <rect x={goalX} y={-GOAL_DEPTH} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="url(#goal-net-pattern)" style={{color: TEAM_COLORS.BLUE, opacity: 0.4}}/>
        <rect x={goalX-5} y={-GOAL_DEPTH} width={5} height={GOAL_DEPTH} fill={TEAM_COLORS.BLUE} style={{color: TEAM_COLORS.BLUE}} />
        <rect x={goalX+GOAL_WIDTH} y={-GOAL_DEPTH} width={5} height={GOAL_DEPTH} fill={TEAM_COLORS.BLUE} style={{color: TEAM_COLORS.BLUE}}/>
        <line x1={goalX} y1={0} x2={goalX+GOAL_WIDTH} y2={0} stroke={TEAM_COLORS.BLUE} strokeWidth="4" style={{color: TEAM_COLORS.BLUE}} />
      </g>
      <g style={bottomGoalStyle}>
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill={UI_COLORS.BACKGROUND_MEDIUM} />
        <rect x={goalX} y={BOARD_HEIGHT} width={GOAL_WIDTH} height={GOAL_DEPTH} fill="url(#goal-net-pattern)" style={{color: TEAM_COLORS.RED, opacity: 0.4}}/>
        <rect x={goalX-5} y={BOARD_HEIGHT} width={5} height={GOAL_DEPTH} fill={TEAM_COLORS.RED} style={{color: TEAM_COLORS.RED}} />
        <rect x={goalX+GOAL_WIDTH} y={BOARD_HEIGHT} width={5} height={GOAL_DEPTH} fill={TEAM_COLORS.RED} style={{color: TEAM_COLORS.RED}} />
        <line x1={goalX} y1={BOARD_HEIGHT} x2={goalX+GOAL_WIDTH} y2={BOARD_HEIGHT} stroke={TEAM_COLORS.RED} strokeWidth="4" style={{color: TEAM_COLORS.RED}} />
      </g>

      {/* Board Center Lines & Markings */}
      <line x1="0" y1={BOARD_HEIGHT / 2} x2={BOARD_WIDTH} y2={BOARD_HEIGHT / 2} stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="10 10" />
      <circle cx={BOARD_WIDTH/2} cy={BOARD_HEIGHT/2} r="100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <circle cx={BOARD_WIDTH/2} cy={BOARD_HEIGHT/2} r="5" fill="rgba(255,255,255,0.2)" />
      
       {/* Preview Trajectories */}
       <g className="preview-trajectories">
          {gameState.previewState?.trajectories.map(traj => (
            <path
              key={traj.puckId}
              d={`M ${traj.path.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
          {gameState.previewState && (
            <text
              x={BOARD_WIDTH / 2}
              y={BOARD_HEIGHT / 2 - 120}
              fill="rgba(255,255,255,0.8)"
              textAnchor="middle"
              className="preview-text"
            >
              Cruza {gameState.previewState.linesToCrossForBonus} líneas para cargar
            </text>
          )}
        </g>
      
      {/* Shot Preview */}
      <g className="shot-preview">
        {gameState.shotPreview && (() => {
            const { start, end, power, isCancelZone, specialShotType } = gameState.shotPreview;
            const puck = gameState.pucks.find(p => p.id === gameState.selectedPuckId);
            if (!puck) return null;

            const shotVector = subtractVectors(start, end);
            const distance = getVectorMagnitude(shotVector);
            
            // A smaller threshold than MIN_DRAG_DISTANCE to avoid flickering at the start of a drag
            if (distance < MIN_DRAG_DISTANCE / 2) return null;

            const cappedDistance = Math.min(distance, MAX_DRAG_FOR_POWER);
            const angle = Math.atan2(shotVector.y, shotVector.x);

            const beamStart = {
                x: start.x + Math.cos(angle) * puck.radius,
                y: start.y + Math.sin(angle) * puck.radius,
            };
            const beamEnd = {
                x: start.x + Math.cos(angle) * (puck.radius + cappedDistance * 0.95), // End slightly before tip for clean arrowhead
                y: start.y + Math.sin(angle) * (puck.radius + cappedDistance * 0.95),
            };
            const tipPosition = {
                x: start.x + Math.cos(angle) * (puck.radius + cappedDistance),
                y: start.y + Math.sin(angle) * (puck.radius + cappedDistance),
            };

            const pathD = `M ${beamStart.x} ${beamStart.y} L ${beamEnd.x} ${beamEnd.y}`;

            let color = TEAM_COLORS[gameState.currentTurn];
            let tipColor = 'white';
            
            if (specialShotType === 'ULTIMATE') {
                color = 'url(#rainbow-gradient)';
                tipColor = 'white';
            } else if (specialShotType === 'ROYAL') {
                color = UI_COLORS.GOLD;
                tipColor = '#fffadd';
            }

            if (isCancelZone) {
                color = 'rgba(100, 116, 139, 0.2)';
                tipColor = 'rgba(100, 116, 139, 0.4)';
            }

            const beamStrokeWidth = 4 + power * 10;
            const coreStrokeWidth = 1 + power * 2;
            
            const arrowheadPath = "M 12 0 L -6 -7 L -6 7 Z";

            return (
                <g style={{ pointerEvents: 'none', opacity: Math.min(1, power * 2) }}>
                    <defs>
                        <linearGradient id="aim-fade-gradient" gradientUnits="userSpaceOnUse" x1={beamStart.x} y1={beamStart.y} x2={beamEnd.x} y2={beamEnd.y}>
                            <stop offset="0%" stopColor="white" stopOpacity="0.05" />
                            <stop offset="30%" stopColor="white" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="white" stopOpacity="1" />
                        </linearGradient>
                        <mask id="aim-fade-mask">
                            <path
                                d={pathD}
                                stroke="url(#aim-fade-gradient)"
                                strokeWidth={beamStrokeWidth + 4}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </mask>
                    </defs>

                    <g mask="url(#aim-fade-mask)">
                        <path d={pathD} stroke={color} strokeWidth={beamStrokeWidth} strokeLinecap="round" fill="none" />
                        <path d={pathD} stroke={tipColor} strokeWidth={coreStrokeWidth} strokeLinecap="round" fill="none" />
                    </g>
                    
                    <path
                        d={arrowheadPath}
                        fill={tipColor}
                        transform={`translate(${tipPosition.x}, ${tipPosition.y}) rotate(${angle * 180 / Math.PI})`}
                        style={{ filter: isCancelZone ? 'none' : 'url(#pulsar-glow)' }}
                    />
                </g>
            );
        })()}
      </g>
      
      {/* Particles */}
      <g className="particles">
        {gameState.particles.map(p => {
            if (p.renderType === 'shockwave') {
                const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                const radius = p.radius + progress * 100;
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={p.isPerfect ? 6 : 4} style={{ opacity: p.opacity, strokeDasharray: p.isPerfect ? "none" : "2 8" }} />;
            }
            if (p.renderType === 'ring' || p.renderType === 'synergy_aura') {
                 const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                 const radius = p.radius + progress * 50;
                 return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={3} style={{ opacity: p.opacity, filter: p.renderType === 'synergy_aura' ? 'url(#pulsar-glow)' : 'none' }} />;
            }
            if (p.renderType === 'royal_aura') {
                const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                const radius = p.radius + progress * 60;
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={4} style={{ opacity: p.opacity, filter: 'url(#pulsar-glow)' }} />;
            }
            if (p.renderType === 'power_beam') {
                const angle = Math.atan2(p.velocity.y, p.velocity.x) * 180 / Math.PI;
                const length = 15 + getVectorMagnitude(p.velocity);
                 return (
                    <rect
                        key={p.id}
                        x={p.position.x - length / 2}
                        y={p.position.y - 2}
                        width={length}
                        height={4}
                        fill={p.color}
                        transform={`rotate(${angle} ${p.position.x} ${p.position.y})`}
                        style={{ opacity: p.opacity, filter: 'url(#pulsar-glow)' }}
                    />
                );
            }
            if (p.renderType === 'emp_burst') {
                 const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                 const radius = progress * EMP_BURST_RADIUS;
                 return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={4} style={{ opacity: p.opacity }} />;
            }
             if (p.renderType === 'heartbeat') {
                const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                const scale = Math.sin(progress * Math.PI); // Creates a pulse in/out effect
                const radius = p.radius + scale * 80; // Reduced max radius
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={5} style={{ opacity: p.opacity * scale }} />;
            }
             if (p.renderType === 'idle_pulse') {
                const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                const scaleAnim = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5; // Gentle pulse 0..1..0
                const radiusWithPulse = p.radius + scaleAnim * 6; // Reduced pulse size
                
                // Always render a circle for performance, instead of a complex path.
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radiusWithPulse} fill="none" stroke={p.color} strokeWidth={2} style={{ opacity: p.opacity * scaleAnim, pointerEvents: 'none' }} />;
            }
            if (p.renderType === 'goal_shard') {
                const speed = getVectorMagnitude(p.velocity);
                const length = 5 + speed * 1.5;
                const angle = Math.atan2(p.velocity.y, p.velocity.x) * 180 / Math.PI;
                return (
                    <rect
                        key={p.id}
                        x={p.position.x - length / 2}
                        y={p.position.y - 1}
                        width={length}
                        height={2}
                        fill={p.color}
                        transform={`rotate(${angle} ${p.position.x} ${p.position.y})`}
                        style={{ opacity: p.opacity, filter: `url(#pulsar-glow)` }}
                    />
                );
            }
            if (p.renderType === 'aim_streak') {
                const speed = getVectorMagnitude(p.velocity);
                const length = 2 + speed * 1.5;
                const angle = Math.atan2(p.velocity.y, p.velocity.x) * 180 / Math.PI;
                return (
                    <rect
                        key={p.id}
                        x={p.position.x - length / 2}
                        y={p.position.y - p.radius / 2}
                        width={length}
                        height={p.radius}
                        fill={p.color}
                        transform={`rotate(${angle} ${p.position.x} ${p.position.y})`}
                        style={{ opacity: p.opacity, filter: 'url(#pulsar-glow)' }}
                    />
                );
            }
            if (p.renderType === 'synergy_charge') {
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity, filter: 'url(#pulsar-glow)' }} />;
            }
            if (p.renderType === 'gravity_well') {
                const progress = 1 - (p.life / p.lifeSpan);
                const angle = progress * Math.PI * 6 + (p.id % 10) * 0.628; // Controls rotation and offset
                const radius = GRAVITY_WELL_RADIUS * (1 - progress); // Controls inward movement
                const px = p.position.x + Math.cos(angle) * radius;
                const py = p.position.y + Math.sin(angle) * radius;
                return <circle key={p.id} cx={px} cy={py} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />;
            }
            if (p.renderType === 'repulsor_aura') {
                const progress = (p.lifeSpan - p.life) / p.lifeSpan;
                const radius = p.radius + progress * (REPULSOR_ARMOR_RADIUS - p.radius);
                return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={radius} fill="none" stroke={p.color} strokeWidth={3} style={{ opacity: p.opacity }} />;
            }
            return <circle key={p.id} cx={p.position.x} cy={p.position.y} r={p.radius} fill={p.color} style={{ opacity: p.opacity }} />;
        })}
         {/* Orbiting Particles */}
        {gameState.orbitingParticles.map(orb => (
            <circle
                key={`orb-${orb.id}`}
                cx={orb.position.x}
                cy={orb.position.y}
                r={orb.radius}
                fill={orb.color}
                style={{ opacity: orb.opacity, filter: 'url(#pulsar-glow)' }}
            />
        ))}
      </g>
       
       {/* Special Aiming Puck Glows */}
        <g>
          {isAimingSpecialShot && gameState.pucks.map(p => {
              const isContributingPawn = gameState.shotPreview?.specialShotType === 'ULTIMATE' && p.puckType === 'PAWN';
              const isContributingSpecial = SPECIAL_PUCKS_FOR_ROYAL_SHOT.includes(p.puckType);

              if (p.team === gameState.currentTurn && p.isCharged && (isContributingPawn || isContributingSpecial)) {
                  return (
                      <circle
                          key={`glow-${p.id}`}
                          cx={p.position.x}
                          cy={p.position.y}
                          r={p.radius + 8}
                          fill="none"
                          stroke={UI_COLORS.GOLD}
                          strokeWidth="3"
                          className="line-breathe"
                          style={{ animationDuration: '1.5s', filter: 'url(#pulsar-glow)' }}
                      />
                  );
              }
              return null;
          })}
      </g>


      {/* Pucks */}
      <g className="pucks" filter="url(#shadow)">
        {gameState.pucks.map((puck) => {
          const isSelected = gameState.selectedPuckId === puck.id;
          const isShootable = gameState.canShoot && puck.team === gameState.currentTurn && !gameState.pucksShotThisTurn.includes(puck.id);
          const isSynergySource = synergyPuckIds.has(puck.id);
          const isPassiveGhost = passiveGhostPuckIds.has(puck.id);
          const isPhased = puck.temporaryEffects.some(e => e.type === 'PHASED');
          
          const kingSpecialStatus = (puck.puckType === 'KING' && isShootable) ? gameState.specialShotStatus[puck.team] : 'NONE';

          let glowFilter = "";
          if (puck.activeSynergy) {
             glowFilter = `url(#synergy-glow-${puck.activeSynergy.type})`;
          } else if (isSelected) {
            glowFilter = puck.team === 'BLUE' ? `url(#puck-glow-blue-active)` : `url(#puck-glow-red-active)`;
          } else if (kingSpecialStatus === 'ULTIMATE') {
            glowFilter = 'url(#puck-glow-ultimate-ready)';
          } else if (kingSpecialStatus === 'ROYAL') {
            glowFilter = 'url(#puck-glow-royal-ready)';
          } else if (isSynergySource || isPassiveGhost) {
            glowFilter = `url(#synergy-glow-${highlightedLine?.synergyType})`;
          } else if (puck.isCharged && !gameState.isSimulating) {
            glowFilter = "url(#puck-glow-charged)";
          } else if (isShootable) {
            glowFilter = puck.team === 'BLUE' ? `url(#puck-glow-blue)` : `url(#puck-glow-red)`;
          }
          
          let puckOpacity = 1;
          if (isPhased && puck.puckType !== 'GHOST') {
              puckOpacity = 0.7;
          }

          const svgData = PUCK_SVG_DATA[puck.puckType];
          const isPathBased = !!(svgData && svgData.path);
          const scale = isPathBased ? puck.radius / (svgData.designRadius || puck.radius) : 1;
          const pawnPathLength = svgData?.pathLength || 90;
          // Add a larger invisible hitbox, especially for smaller pucks.
          const hitboxRadius = puck.radius + (puck.radius < KING_PUCK_RADIUS ? 12 : 8);

          return (
            <g
              key={puck.id}
              transform={`translate(${puck.position.x}, ${puck.position.y})`}
              onMouseDown={(e) => handleLocalInteractionStart(e, puck.id)}
              onTouchStart={(e) => handleLocalInteractionStart(e, puck.id)}
              style={{ opacity: puckOpacity, willChange: 'transform' }}
              className={`${isShootable ? 'cursor-pointer' : ''} ${isPhased ? 'phased-puck' : ''}`}
            >
              {/* HITBOX - Invisible circle to make selection easier */}
              <circle r={hitboxRadius} fill="transparent" />
              
              <g filter={glowFilter}>
                <g transform={`rotate(${puck.rotation})`}>
                  <PuckShape puck={puck} />
                  
                  {/* Durability indicator for Pawns */}
                  {puck.puckType === 'PAWN' && puck.durability !== undefined && svgData && isPathBased && (
                      <g transform={`scale(${scale}) rotate(-90)`}>
                          <path d={svgData.path} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" />
                          <path
                              d={svgData.path}
                              fill="none"
                              stroke={getDurabilityColor(puck.durability / PAWN_DURABILITY)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray={pawnPathLength}
                              strokeDashoffset={pawnPathLength * (1 - Math.max(0, puck.durability / PAWN_DURABILITY))}
                              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
                          />
                      </g>
                  )}
                  
                  {/* Charged state indicator */}
                  {puck.isCharged && (
                      isPathBased && svgData ? (
                          <path
                              d={svgData.path}
                              transform={`scale(${scale})`}
                              fill="none"
                              stroke="#fde047"
                              strokeWidth="3"
                              className="line-breathe"
                              style={{ pointerEvents: 'none' }}
                          />
                      ) : (
                          <circle
                              r={puck.radius}
                              fill="none"
                              stroke="#fde047"
                              strokeWidth="3"
                              className="line-breathe"
                              style={{ pointerEvents: 'none' }}
                          />
                      )
                  )}
                  
                  {/* Active turn indicator */}
                  {isShootable && !isSelected && (
                     isPathBased && svgData ? (
                          <path
                              d={svgData.path}
                              transform={`scale(${scale})`}
                              fill="none"
                              stroke="white"
                              strokeWidth="1.5"
                              className="line-breathe"
                              style={{ animationDuration: '1.5s', pointerEvents: 'none' }}
                          />
                      ) : (
                         <circle
                            r={puck.radius}
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            className="line-breathe"
                            style={{ animationDuration: '1.5s', pointerEvents: 'none' }}
                          />
                      )
                  )}

                </g>
              </g>
            </g>
          );
        })}
      </g>
      
      {/* Aiming Focus Overlay */}
      <rect
          x={-1} y={-1} width={BOARD_WIDTH+2} height={BOARD_HEIGHT+2}
          fill="rgba(1, 4, 9, 0.6)"
          mask="url(#aim-focus-mask)"
          style={{
              opacity: isAiming ? 1 : 0,
              transition: 'opacity 0.3s ease-out',
              pointerEvents: 'none',
          }}
      />

      {/* Imaginary Lines */}
      <g className="imaginary-lines">
          {gameState.imaginaryLine && !gameState.imaginaryLine.isConfirmed && gameState.imaginaryLine.lines.map((line, index) => {
              const isHighlighted = index === gameState.imaginaryLine.highlightedLineIndex;
              const hasSynergy = !!line.synergyType;
              
              const shotPuck = gameState.pucks.find(p => p.id === gameState.imaginaryLine?.shotPuckId);

              let isPawnStyleLine = false;
              if (shotPuck?.puckType === 'PAWN') {
                  isPawnStyleLine = true;
              } else if (shotPuck?.puckType === 'KING') {
                  const sourcePuck1 = gameState.pucks.find(p => p.id === line.sourcePuckIds[0]);
                  const sourcePuck2 = gameState.pucks.find(p => p.id === line.sourcePuckIds[1]);
                  if (sourcePuck1?.puckType === 'PAWN' && sourcePuck2?.puckType === 'PAWN') {
                      isPawnStyleLine = true;
                  }
              }

              const baseStrokeWidth = isAiming ? (isPawnStyleLine ? 1.5 : 3) : (isPawnStyleLine ? 1 : 2);
              const highlightedStrokeWidth = isAiming ? (isPawnStyleLine ? 3 : 5) : (isPawnStyleLine ? 2.5 : 4);
              
              const strokeWidth = isHighlighted ? highlightedStrokeWidth : baseStrokeWidth;
              const strokeColor = isHighlighted
                  ? (hasSynergy ? SYNERGY_EFFECTS[line.synergyType].color : 'white')
                  : (isAiming ? (isPawnStyleLine ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)') : (isPawnStyleLine ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'));

              const strokeDasharray = isHighlighted ? "8 8" : (isPawnStyleLine ? "2 8" : "4 6");

              return (
                  <line
                      key={index}
                      x1={line.start.x} y1={line.start.y}
                      x2={line.end.x} y2={line.end.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      className={isHighlighted ? "line-flow" : ""}
                      style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease', pointerEvents: 'none' }}
                  />
              );
          })}
      </g>

      {/* Floating Texts */}
      <g className="floating-texts">
         {gameState.floatingTexts.map(ft => (
          <text
            key={ft.id}
            x={ft.position.x}
            y={ft.position.y}
            fill={ft.color}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              opacity: ft.opacity,
              transform: `translateY(${(FLOATING_TEXT_CONFIG.LIFE - ft.life) * -0.8}px)`,
            }}
            className="floating-text"
          >
            {ft.text}
          </text>
        ))}
      </g>
      
      {/* Info Panel needs to be a foreignObject to be rendered on top of SVG elements and receive DOM events */}
       <foreignObject x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} style={{ pointerEvents: 'none' }}>
            <div style={infoPanelContainerStyle}>
                {infoCardPuck && (
                    <InfoPanel
                        puck={infoCardPuck}
                        specialShotStatus={infoCardPuck.puckType === 'KING' ? gameState.specialShotStatus[infoCardPuck.team] : 'NONE'}
                        renderDirection={infoPanelProps.renderDirection}
                        pointerHorizontalOffset={infoPanelProps.pointerHorizontalOffset}
                    />
                )}
            </div>
      </foreignObject>
    </svg>
  );
});

export default React.memo(GameBoard);