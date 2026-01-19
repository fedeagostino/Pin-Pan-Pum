import React, { useRef, useCallback, useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerUI from './components/PlayerUI';
import TurnChangeIndicator from './components/TurnChangeIndicator';
import { useGameEngine } from './hooks/useGameEngine';
import { useSoundManager } from './hooks/useSoundManager';
import { TEAM_COLORS, BOARD_WIDTH, BOARD_HEIGHT, PUCK_TYPE_INFO, UI_COLORS, SYNERGY_DESCRIPTIONS } from './constants';
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
        } catch (e) { console.error("Commentary stream failed", e); }
    };

    const prev = prevGameStateRef.current;
    if (gameState.goalScoredInfo && !prev.goalScoredInfo) triggerCommentary(`The ${gameState.goalScoredInfo.scoringTeam} team scored a goal with the ${PUCK_TYPE_INFO[gameState.goalScoredInfo.scoringPuckType].name} puck for ${gameState.goalScoredInfo.pointsScored} points!`, gameState.goalScoredInfo.scoringTeam);
    else if (gameState.gameMessage?.type === 'synergy' && prev.gameMessage?.type !== 'synergy') triggerCommentary(`The ${gameState.currentTurn} team has just activated the powerful ${SYNERGY_DESCRIPTIONS[gameState.gameMessage.synergyType!].name} synergy!`, gameState.currentTurn);
    else if (gameState.specialShotStatus.RED !== prev.specialShotStatus.RED && gameState.specialShotStatus.RED !== 'NONE') triggerCommentary(`The RED team has unlocked their ${gameState.specialShotStatus.RED} SHOT!`, 'RED');
    else if (gameState.specialShotStatus.BLUE !== prev.specialShotStatus.BLUE && gameState.specialShotStatus.BLUE !== 'NONE') triggerCommentary(`The BLUE team has unlocked their ${gameState.specialShotStatus.BLUE} SHOT!`, 'BLUE');
    else if (gameState.turnLossReason && !prev.turnLossReason) triggerCommentary(`A costly mistake by the ${gameState.currentTurn} team results in a lost turn!`, gameState.currentTurn === 'BLUE' ? 'RED' : 'BLUE');
    else if (gameState.bonusTurnForTeam && !prev.bonusTurnForTeam) triggerCommentary(`A brilliant play from the ${gameState.bonusTurnForTeam} team earns them a bonus turn!`, gameState.bonusTurnForTeam);
    prevGameStateRef.current = gameState;
  }, [gameState, generateCommentaryStream]);


  const getSVGCoordinates = useCallback((clientX: number, clientY: number): Vector | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent && gameState.selectedPuckId !== null) e.preventDefault();
      const touch = e instanceof TouchEvent ? e.touches[0] : e;
      if (!touch) return;
      const coords = getSVGCoordinates(touch.clientX, touch.clientY);
      if (coords) handleMouseMove(coords);
    };
    const handleGlobalUp = (e: MouseEvent | TouchEvent) => {
      const touch = e instanceof TouchEvent ? e.changedTouches[0] : e;
      handleMouseUp(touch ? getSVGCoordinates(touch.clientX, touch.clientY) : null);
    };
    
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
    };
  }, [handleMouseMove, handleMouseUp, getSVGCoordinates, gameState.selectedPuckId]);
  
  const handleScreenInteraction = () => {
    // Dismiss the "Turn Change" indicator if it's visible.
    if (turnChangeInfo) {
        setTurnChangeInfo(null);
        // If the turn change was due to a penalty, we also clear that reason from the state.
        if (gameState.turnLossReason) {
            clearTurnLossReason();
        }
    }

    // Dismiss the "Bonus Turn" indicator if it's visible.
    if (gameState.bonusTurnForTeam) {
        clearBonusTurn();
    }
  };
  
  const scoreShouldPop = isGoalShaking;

  return (
    <div 
      className={`app-container ${gameState.screenShake > 0 ? 'screen-shake' : ''}`}
      onMouseDown={handleScreenInteraction}
      onTouchStart={handleScreenInteraction}
    >
        <style>
          {`
            .app-container {
              display: flex;
              flex-direction: column;
              width: 100vw;
              height: 100vh;
              height: 100dvh;
              overflow: hidden;
              position: relative;
            }

            .main-content-area {
              flex-grow: 1;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0.5rem;
              position: relative;
            }
            
            .game-board-wrapper {
              height: 100%;
              max-width: 100%;
              aspect-ratio: ${BOARD_WIDTH} / ${BOARD_HEIGHT};
              position: relative;
              background: var(--color-bg-dark);
              border-radius: 10px;
              box-shadow: 0 0 20px -5px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.5);
              transition: box-shadow 0.5s ease;
            }

            .winner-modal-layout {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 2rem;
                width: 90%; max-width: 450px;
                animation: modal-content-pop-in 0.5s 0.1s cubic-bezier(0.25, 1, 0.5, 1) both;
                position: relative;
            }
             .winner-modal-rays { 
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                width: 150%; padding-bottom: 150%; z-index: -1;
                background: conic-gradient(from 0deg, transparent 0%, var(--team-color) 10%, transparent 20%);
                opacity: 0.2;
                animation: goal-rays-spin 20s linear infinite;
            }
            .winner-info-panel {
                background: linear-gradient(180deg, var(--color-bg-light), var(--color-bg-medium));
                border: 2px solid var(--team-color);
                border-radius: 16px;
                box-shadow: 0 0 40px -10px var(--team-color), inset 0 0 10px rgba(255,255,255,0.05);
                padding: 2rem; text-align: center; width: 100%;
            }
            .winner-title {
                font-size: clamp(3rem, 10vw, 4.5rem); font-weight: 900;
                color: white; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
                -webkit-text-stroke: 2px var(--team-color);
            }
            .winner-team {
                font-size: clamp(1.5rem, 6vw, 2.5rem); font-weight: 700;
                color: var(--team-color); text-shadow: 0 0 15px currentColor; margin-bottom: 2rem;
            }
            .final-score-box { display: flex; align-items: baseline; justify-content: center; gap: 1.5rem; font-size: 4rem; font-weight: 900; line-height: 1; }
            .restart-button {
              padding: 1rem 2.5rem; background: var(--glow-green); color: white;
              font-weight: 700; font-size: 1.25rem; border-radius: 8px; border: none; cursor: pointer;
              box-shadow: 0 0 20px -5px var(--glow-green), inset 0 1px 0 rgba(255,255,255,0.2);
              transition: all 0.2s ease;
            }
            .restart-button:hover { transform: scale(1.05); box-shadow: 0 0 30px 0px var(--glow-green); }

            .goal-transition-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 40; pointer-events: none; animation: goal-fade-in-out 3s ease-in-out forwards; }
            @keyframes goal-fade-in-out { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
            .goal-transition-content { text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; }
            .goal-rays-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1px; height: 1px; z-index: -1; background: conic-gradient(from 0deg, transparent, var(--ray-color), transparent); width: 1000px; height: 1000px; mask: radial-gradient(circle, transparent 30%, black 70%); animation: goal-rays-spin 5s linear infinite, goal-rays-fade-in 1s ease-out; }
            @keyframes goal-rays-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
            @keyframes goal-rays-fade-in { from { opacity: 0; } to { opacity: 0.4; } }
            .goal-puck-icon { width: clamp(4rem, 15vw, 6rem); height: clamp(4rem, 15vw, 6rem); filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); animation: goal-icon-spin-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            @keyframes goal-icon-spin-in { from { transform: scale(0) rotate(-180deg); } to { transform: scale(1) rotate(0deg); } }
            .goal-transition-text { font-size: clamp(4rem, 15vw, 8rem); font-weight: 900; -webkit-text-stroke: 4px var(--text-color); color: transparent; animation: goal-text-slam 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .goal-transition-text > span { display: block; background: linear-gradient(180deg, #ffffff, #d1d5db); -webkit-background-clip: text; background-clip: text; }
            @keyframes goal-text-slam { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
            .goal-transition-subtitle { font-size: clamp(1.5rem, 5vw, 2.5rem); font-weight: 700; animation: goal-subtext-fade-in 0.5s ease-out 0.5s forwards; opacity: 0; }
            @keyframes goal-subtext-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}
        </style>

        <PlayerUI team="BLUE" gameState={gameState} onHelpClick={() => setHelpModalTeam('BLUE')} onActivatePulsar={handleActivatePulsar} scoreShouldPop={scoreShouldPop} />
        
        <main className="main-content-area">
          <GameCommentary text={leftCommentary.text} team={leftCommentary.team} position="left" componentKey={leftCommentary.key} />
          <div className="game-board-wrapper">
            <GameBoard ref={svgRef} gameState={gameState} onMouseDown={handleMouseDown} onBoardMouseDown={handleBoardMouseDown} />
            {gameState.goalScoredInfo && <GoalTransition info={gameState.goalScoredInfo} />}
            {turnChangeInfo && <TurnChangeIndicator key={turnChangeInfo.key} team={turnChangeInfo.team} previousTeam={turnChangeInfo.previousTeam} reason={turnChangeInfo.reason} />}
            <GameMessageDisplay message={gameState.gameMessage} />
            <BonusTurnIndicator team={gameState.bonusTurnForTeam} />
          </div>
          <GameCommentary text={rightCommentary.text} team={rightCommentary.team} position="right" componentKey={rightCommentary.key} />
        </main>

        <PlayerUI team="RED" gameState={gameState} onHelpClick={() => setHelpModalTeam('RED')} onActivatePulsar={handleActivatePulsar} scoreShouldPop={scoreShouldPop} />
        
        {gameState.winner && <WinnerModal winner={gameState.winner} score={gameState.score} onRestart={resetGame} playSound={playSound} />}
        <HelpModal 
            isOpen={helpModalTeam !== null} 
            onClose={() => setHelpModalTeam(null)} 
            team={helpModalTeam}
            playSound={playSound} 
        />
    </div>
  );
}

export default App;