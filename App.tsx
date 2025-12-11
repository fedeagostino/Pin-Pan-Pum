import React, { useRef, useCallback, useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerUI from './components/PlayerUI';
import TurnChangeIndicator from './components/TurnChangeIndicator';
import { useGameEngine } from './hooks/useGameEngine';
import { useSoundManager } from './hooks/useSoundManager';
import { TEAM_COLORS, BOARD_WIDTH, BOARD_HEIGHT, PUCK_TYPE_INFO, UI_COLORS, GOAL_DEPTH } from './constants';
import { Team, Vector, PuckType, TurnLossReason } from './types';
import PuckTypeIcon from './components/PuckTypeIcon';
import HelpModal from './components/HelpModal';
import GameMessageDisplay from './components/GameMessageDisplay';
import BonusTurnIndicator from './components/BonusTurnIndicator';
import useGemini from './hooks/useGemini';
import GameCommentary from './components/GameCommentary';

const WinnerModal: React.FC<{ winner: Team; score: { RED: number; BLUE: number }; onRestart: () => void; playSound: (sound: string) => void; }> = ({ winner, score, onRestart, playSound }) => {
  const teamName = winner === 'BLUE' ? 'Equipo Azul' : 'Equipo Rojo';
  const teamColor = TEAM_COLORS[winner];

  const handleRestartClick = () => {
    playSound('UI_CLICK_1');
    onRestart();
  };

  return (
    <div className="modal-overlay">
      <div className="winner-modal-layout">
        <div className="winner-modal-rays" style={{'--team-color': teamColor} as React.CSSProperties}></div>
        <div 
            className="winner-info-panel"
            style={{ '--team-color': teamColor } as React.CSSProperties}
        >
            <h1 className="winner-title">VICTORIA</h1>
            <h2 className="winner-team">{teamName}</h2>
            <div className="final-score-box">
                <span style={{ color: TEAM_COLORS.BLUE }}>{score.BLUE}</span>
                <span>-</span>
                <span style={{ color: TEAM_COLORS.RED }}>{score.RED}</span>
            </div>
        </div>
        <button onClick={handleRestartClick} className="restart-button">Jugar de Nuevo</button>
      </div>
    </div>
  );
};

const GoalTransition: React.FC<{ info: { scoringTeam: Team; pointsScored: number; scoringPuckType: PuckType; } | null; }> = ({ info }) => {
  if (!info) return null;
  const { scoringTeam, pointsScored, scoringPuckType } = info;
  const teamColor = TEAM_COLORS[scoringTeam];
  const goalText = pointsScored > 1 ? '¡GOLAZO!' : '¡GOL!';

  const Content = () => (
     <div className="goal-transition-content">
        <div className="goal-rays-container" style={{'--ray-color': teamColor} as React.CSSProperties}></div>
        <PuckTypeIcon puckType={scoringPuckType} teamColor={teamColor} className="goal-puck-icon" />
       <h1 className="goal-transition-text" style={{'--text-color': teamColor} as React.CSSProperties}>
        <span>{goalText}</span>
       </h1>
       <p className="goal-transition-subtitle" style={{ color: teamColor }}>{`+${pointsScored} PUNTO${pointsScored > 1 ? 'S' : ''}`}</p>
   </div>
  );

  return (
    <div key={Date.now()} className="goal-transition-overlay">
       <Content />
    </div>
  );
};


function App() {
  const audioPlayer = useSoundManager();
  const playSound = audioPlayer ? audioPlayer.playSound : () => {};

  const { gameState, handleMouseDown, handleMouseMove, handleMouseUp, resetGame, handleBoardMouseDown, handleActivatePulsar, clearTurnLossReason, clearBonusTurn } = useGameEngine({ playSound });
  const svgRef = useRef<SVGSVGElement>(null);

  const [helpModalTeam, setHelpModalTeam] = useState<Team | null>(null);
  const [turnChangeInfo, setTurnChangeInfo] = useState<{ team: Team; previousTeam: Team | null; key: number; reason: TurnLossReason | null } | null>(null);
  const prevTurnRef = useRef<Team | null>(null);
  const [isGoalShaking, setIsGoalShaking] = useState(false);
  
  const { generateCommentaryStream } = useGemini();
  const [leftCommentary, setLeftCommentary] = useState({ text: '', team: 'BLUE' as Team, key: 0 });
  const [rightCommentary, setRightCommentary] = useState({ text: '', team: 'RED' as Team, key: 0 });
  const nextCommentarySide = useRef<'left' | 'right'>('left');
  const prevGameStateRef = useRef(gameState);
  const commentaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    if (!audioPlayer) return;
    const initAudio = () => audioPlayer.init();
    window.addEventListener('mousedown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, [audioPlayer]);

  useEffect(() => {
    const isFirstTurn = prevTurnRef.current === null;
    const hasTurnChanged = prevTurnRef.current !== null && prevTurnRef.current !== gameState.currentTurn;

    if ((isFirstTurn || hasTurnChanged) && !gameState.isSimulating && !gameState.goalScoredInfo) {
      if (hasTurnChanged) playSound('TURN_CHANGE');
      setTurnChangeInfo({ team: gameState.currentTurn, previousTeam: prevTurnRef.current, key: Date.now(), reason: gameState.turnLossReason });
      const timer = setTimeout(() => {
          setTurnChangeInfo(null);
          if (gameState.turnLossReason) clearTurnLossReason();
      }, 2500);
      return () => clearTimeout(timer);
    }
    prevTurnRef.current = gameState.currentTurn;
  }, [gameState.currentTurn, gameState.isSimulating, gameState.goalScoredInfo, gameState.turnLossReason, playSound, clearTurnLossReason]);

  useEffect(() => {
    if (gameState.goalScoredInfo) {
        setIsGoalShaking(true);
        const timer = setTimeout(() => setIsGoalShaking(false), 400);
        return () => clearTimeout(timer);
    }
  }, [gameState.goalScoredInfo]);

  useEffect(() => {
    const triggerCommentary = async (prompt: string, team: Team) => {
        const side = nextCommentarySide.current;
        const setCommentary = side === 'left' ? setLeftCommentary : setRightCommentary;
        nextCommentarySide.current = side === 'left' ? 'right' : 'left';
        if (commentaryTimeoutRef.current) clearTimeout(commentaryTimeoutRef.current);
        try {
            const stream = await generateCommentaryStream(prompt);
            if (!stream) return;
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
                setCommentary({ text: fullText, team, key: Date.now() });
            }
            commentaryTimeoutRef.current = setTimeout(() => setCommentary(prev => ({ ...prev, text: '' })), 4000);
        } catch (e) { console.error("Commentary stream failed:", e);
        }
    };
    
    // Simple state diffing to generate prompts for the commentator AI
    if (gameState.isSimulating && !prevGameStateRef.current.isSimulating) {
        // Start of shot
        const shotPuck = gameState.pucks.find(p => p.id === gameState.imaginaryLine?.shotPuckId);
        if(shotPuck) {
            let prompt = `El equipo ${shotPuck.team === 'BLUE' ? 'Azul' : 'Rojo'} dispara con su ficha ${shotPuck.puckType}.`;
            if (gameState.lastShotWasSpecial === 'ROYAL') prompt = `¡Tiro Real del equipo ${shotPuck.team === 'BLUE' ? 'Azul' : 'Rojo'}!`;
            if (gameState.lastShotWasSpecial === 'ULTIMATE') prompt = `¡EL LEGENDARIO TIRO DEFINITIVO DEL EQUIPO ${shotPuck.team === 'BLUE' ? 'Azul' : 'Rojo'}!`;
            triggerCommentary(prompt, shotPuck.team);
        }
    } else if (gameState.goalScoredInfo && !prevGameStateRef.current.goalScoredInfo) {
        // Goal scored
        const { scoringTeam, pointsScored, scoringPuckType } = gameState.goalScoredInfo;
        const prompt = `¡GOLAZO del equipo ${scoringTeam === 'BLUE' ? 'Azul' : 'Rojo'}! Anotan ${pointsScored} puntos con su ${scoringPuckType}.`;
        triggerCommentary(prompt, scoringTeam);
    }

    prevGameStateRef.current = gameState;
  }, [gameState, generateCommentaryStream]);


  const getBoardCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    
    let clientX, clientY;
    if ('touches' in e) { // TouchEvent
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else { // MouseEvent
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return { x: 0, y: 0 };
    return pt.matrixTransform(screenCTM.inverse());
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    handleMouseMove(getBoardCoordinates(e as any));
  }, [handleMouseMove, getBoardCoordinates]);

  const handleGlobalMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    handleMouseUp(getBoardCoordinates(e as any));
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
    window.removeEventListener('touchmove', handleGlobalMouseMove);
    window.removeEventListener('touchend', handleGlobalMouseUp);
  }, [handleMouseUp, getBoardCoordinates, handleGlobalMouseMove]);

  const handlePuckMouseDown = useCallback((puckId: number, pos: Vector) => {
    handleMouseDown(puckId, pos);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove);
    window.addEventListener('touchend', handleGlobalMouseUp);
  }, [handleMouseDown, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleHelpClick = (team: Team) => {
    playSound('UI_CLICK_1');
    setHelpModalTeam(team);
  };
  
  const handlePulsarActivate = () => {
    handleActivatePulsar();
  };

  return (
    <>
    <style>{`
        /* Reset margins to prevent scrolling */
        body { margin: 0; overflow: hidden; background-color: #010409; }

        .game-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100dvh; /* Dynamic viewport height */
            background-color: #010409;
            overflow: hidden;
            position: relative;
        }
        
        /* Flex Layout that preserves UI and flexes the board area */
        .game-content-layout {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            justify-content: space-between;
            align-items: center;
            position: relative;
        }

        /* Board Area - Grows to fill space between UI bars */
        .board-area {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            overflow: hidden;
            padding: 4px; /* Slight padding from edges */
            min-height: 0; /* Critical for correct flexbox scaling */
            position: relative;
        }
        
        /* Constrains the SVG to the correct aspect ratio */
        .board-aspect-ratio-box {
            aspect-ratio: ${BOARD_WIDTH} / ${BOARD_HEIGHT + GOAL_DEPTH * 2};
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 100%;
            
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
            border-radius: 20px;
            overflow: hidden;
            background-color: var(--color-bg-dark);
            position: relative;
        }
        
        .board-aspect-ratio-box svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        .board-aspect-ratio-box.goal-shake {
          animation: goal-shake-anim 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes goal-shake-anim {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* Prevent Player UI from shrinking */
        .player-ui-container {
            flex-shrink: 0;
            z-index: 20;
        }

        /* Winner Modal Styles */
        .winner-modal-layout {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            animation: modal-content-pop-in 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .winner-modal-rays {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 2px;
            background: transparent;
            box-shadow: 
                0 0 15px 5px var(--team-color),
                0 0 30px 15px var(--team-color),
                0 0 60px 30px #fff,
                0 0 120px 60px var(--team-color);
            border-radius: 50%;
            transform-origin: center;
            animation: rays-rotate 20s linear infinite, rays-pulse 2s ease-in-out infinite alternate;
        }
        @keyframes rays-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rays-pulse { from { opacity: 0.7; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .winner-info-panel {
            background: var(--color-bg-glass);
            border: 2px solid var(--team-color);
            box-shadow: 0 0 25px var(--team-color);
            border-radius: 1rem;
            padding: 2rem 3rem;
            text-align: center;
            position: relative;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        .winner-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin: 0;
        }
        .winner-team {
            font-size: 3.5rem;
            font-weight: 900;
            color: var(--team-color);
            text-shadow: 0 0 15px var(--team-color), 0 0 25px white;
            margin: 0.5rem 0;
            line-height: 1.1;
        }
        .final-score-box {
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 0.5rem 1.5rem;
            font-size: 2rem;
            font-weight: 800;
            display: inline-flex;
            gap: 1rem;
            align-items: center;
            margin-top: 1rem;
        }
        .final-score-box span:nth-child(2) { color: var(--color-text-medium); }
        .restart-button {
            background: var(--color-bg-medium);
            border: 2px solid var(--color-border);
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
            padding: 0.75rem 2.5rem;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            position: relative;
        }
        .restart-button:hover {
            background: var(--color-accent-green);
            border-color: white;
            transform: scale(1.05);
            box-shadow: 0 0 15px var(--color-accent-green);
        }

        /* Goal Transition Styles */
        .goal-transition-overlay {
            position: absolute;
            inset: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            animation: goal-overlay-fade-out 3s forwards;
        }
        @keyframes goal-overlay-fade-out { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
        .goal-transition-content {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            animation: goal-content-anim 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes goal-content-anim {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.1); opacity: 1; }
            30% { transform: scale(1); }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.2); opacity: 0; }
        }
        .goal-rays-container {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 2px;
            background: transparent;
            box-shadow: 0 0 20px 10px var(--ray-color);
            border-radius: 50%;
            transform-origin: center;
            animation: rays-rotate 10s linear infinite;
            z-index: -1;
        }
        .goal-puck-icon {
            width: 100px;
            height: 100px;
            filter: drop-shadow(0 0 20px var(--ray-color));
        }
        .goal-transition-text {
            font-size: 5rem;
            font-weight: 900;
            color: var(--text-color);
            text-shadow: 0 0 25px var(--text-color), 0 0 40px white;
            line-height: 1;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .goal-transition-subtitle {
            font-size: 1.5rem;
            font-weight: 700;
            text-shadow: 0 2px 5px rgba(0,0,0,0.5);
            margin: 0;
        }
    `}</style>
    <div className="game-container">
      <div className="game-content-layout">

        <PlayerUI 
            gameState={gameState} 
            team="BLUE" 
            onHelpClick={() => handleHelpClick('BLUE')} 
            onActivatePulsar={handlePulsarActivate}
            scoreShouldPop={!!(gameState.goalScoredInfo && gameState.goalScoredInfo.scoringTeam === 'BLUE')}
        />
        
        <div className="board-area">
             <div className={`board-aspect-ratio-box ${isGoalShaking ? 'goal-shake' : ''}`}>
                <GameBoard
                    ref={svgRef}
                    gameState={gameState}
                    onMouseDown={handlePuckMouseDown}
                    onBoardMouseDown={handleBoardMouseDown}
                />
             </div>
             {/* Commentary is positioned relative to the board area to sit neatly between UI bars */}
             <GameCommentary text={leftCommentary.text} team={leftCommentary.team} position="left" componentKey={leftCommentary.key} />
             <GameCommentary text={rightCommentary.text} team={rightCommentary.team} position="right" componentKey={rightCommentary.key} />
        </div>
        
         <PlayerUI 
            gameState={gameState} 
            team="RED" 
            onHelpClick={() => handleHelpClick('RED')} 
            onActivatePulsar={handlePulsarActivate}
            scoreShouldPop={!!(gameState.goalScoredInfo && gameState.goalScoredInfo.scoringTeam === 'RED')}
        />

      </div>

      {/* MODALS & OVERLAYS */}
      {gameState.winner && <WinnerModal winner={gameState.winner} score={gameState.score} onRestart={resetGame} playSound={playSound} />}
      <GoalTransition info={gameState.goalScoredInfo} />
      {turnChangeInfo && <TurnChangeIndicator team={turnChangeInfo.team} previousTeam={turnChangeInfo.previousTeam} reason={turnChangeInfo.reason} />}
      <GameMessageDisplay message={gameState.gameMessage} />
      <BonusTurnIndicator team={gameState.bonusTurnForTeam} />
      <HelpModal isOpen={helpModalTeam !== null} onClose={() => setHelpModalTeam(null)} playSound={playSound} team={helpModalTeam} />
    </div>
    </>
  );
}

// FIX: Add default export to resolve module loading error.
export default App;