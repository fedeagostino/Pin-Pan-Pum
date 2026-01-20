import React, { useRef, useCallback, useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerUI from './components/PlayerUI';
import TurnChangeIndicator from './components/TurnChangeIndicator';
import MainMenu from './components/MainMenu';
import { useGameEngine } from './hooks/useGameEngine';
import { useSoundManager } from './hooks/useSoundManager';
import { TEAM_COLORS, BOARD_WIDTH, BOARD_HEIGHT, TRANSLATIONS, Language, GOAL_DEPTH } from './constants';
import { Team, Vector, PuckType, TurnLossReason, FormationType } from './types';
import PuckTypeIcon from './components/PuckTypeIcon';
import HelpModal from './components/HelpModal';
import GameMessageDisplay from './components/GameMessageDisplay';
import BonusTurnIndicator from './components/BonusTurnIndicator';

type Screen = 'MENU' | 'GAME';

const GoalTransition: React.FC<{ info: { scoringTeam: Team; pointsScored: number; scoringPuckType: PuckType; } | null; lang: Language }> = ({ info, lang }) => {
  if (!info) return null;
  const t = TRANSLATIONS[lang];
  const { scoringTeam, pointsScored, scoringPuckType } = info;
  const teamColor = TEAM_COLORS[scoringTeam];
  const goalText = pointsScored > 1 ? t.GOALAZO : t.GOAL;

  return (
    <div key={Date.now()} className="goal-transition-overlay">
       <style>{`
          @keyframes glitch-shake {
            0% { transform: translate(0); }
            20% { transform: translate(-5px, 5px); }
            40% { transform: translate(-5px, -5px); }
            60% { transform: translate(5px, 5px); }
            80% { transform: translate(5px, -5px); }
            100% { transform: translate(0); }
          }
          @keyframes text-zoom {
            0% { transform: scale(0.5); opacity: 0; }
            30% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .goal-transition-overlay { 
            position: absolute; inset: 0; 
            background: rgba(0,0,0,0.8); 
            backdrop-filter: blur(15px); 
            display: flex; justify-content: center; align-items: center; 
            z-index: 2000; overflow: hidden;
          }
          .goal-impact-bg {
            position: absolute; width: 200%; height: 200%;
            background: radial-gradient(circle, ${teamColor}33 0%, transparent 60%);
            animation: glitch-shake 0.1s infinite;
          }
          .goal-transition-content { text-align: center; position: relative; animation: text-zoom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
          .goal-puck-icon { width: 140px; height: 140px; margin: 0 auto 1.5rem; filter: drop-shadow(0 0 20px ${teamColor}); }
          .goal-transition-text { 
            font-family: var(--font-family-title); font-size: 8rem; color: #fff; margin: 0; 
            text-shadow: 0 0 30px ${teamColor}, 0 0 60px ${teamColor};
            letter-spacing: 10px;
          }
          .goal-info-banner { 
            background: #000; border: 2px solid ${teamColor}; padding: 1rem 4rem; margin-top: 2rem;
            box-shadow: 0 0 20px ${teamColor}66;
          }
          .goal-team-name { font-family: var(--font-family-title); font-size: 2.5rem; color: ${teamColor}; margin: 0; }
       `}</style>
       <div className="goal-impact-bg" />
       <div className="goal-transition-content">
            <PuckTypeIcon puckType={scoringPuckType} team={scoringTeam} teamColor={teamColor} className="goal-puck-icon" />
           <h1 className="goal-transition-text">
            {goalText}
           </h1>
           <div className="goal-info-banner">
              <h2 className="goal-team-name">+{pointsScored} {t.POINTS}</h2>
           </div>
       </div>
    </div>
  );
};

const WinnerModal: React.FC<{
  winner: Team;
  score: { RED: number; BLUE: number };
  onRestart: () => void;
  onGoMenu: () => void;
  playSound: (s: string) => void;
  lang: Language;
}> = ({ winner, score, onRestart, onGoMenu, playSound, lang }) => {
  const t = TRANSLATIONS[lang];
  const teamColor = TEAM_COLORS[winner];
  
  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
       <style>{`
          .winner-modal {
            background: #000;
            border: 4px solid ${teamColor};
            padding: 3rem;
            text-align: center;
            box-shadow: 0 0 50px ${teamColor}88;
            max-width: 500px;
            width: 90%;
            animation: card-fade-in-up 0.5s ease-out;
            position: relative;
            z-index: 3001;
          }
          .winner-title {
            font-family: var(--font-family-title);
            font-size: 4rem;
            color: ${teamColor};
            text-shadow: 0 0 20px ${teamColor};
            margin-bottom: 1rem;
          }
          .final-score {
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 2rem;
            color: #fff;
          }
          .winner-actions {
            display: flex;
            gap: 1rem;
            flex-direction: column;
          }
          .winner-btn {
            background: transparent;
            border: 2px solid ${teamColor};
            color: #fff;
            padding: 1rem;
            font-family: var(--font-family-title);
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.3s;
          }
          .winner-btn:hover {
            background: ${teamColor};
            color: #000;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2500;
          }
       `}</style>
       <div className="winner-modal">
          <h1 className="winner-title">{t.VICTORY}</h1>
          <h2 style={{ color: teamColor, marginBottom: '2rem' }}>
            {winner === 'RED' ? (lang === 'es' ? 'EQUIPO ROJO' : 'RED TEAM') : (lang === 'es' ? 'EQUIPO AZUL' : 'BLUE TEAM')}
          </h2>
          <div className="final-score">
            {score.RED} - {score.BLUE}
          </div>
          <div className="winner-actions">
            <button className="winner-btn" onClick={() => { playSound('UI_CLICK_1'); onRestart(); }}>
              {t.RESTART}
            </button>
            <button className="winner-btn" style={{ opacity: 0.7, fontSize: '1.1rem' }} onClick={() => { playSound('UI_CLICK_2'); onGoMenu(); }}>
              {t.MENU}
            </button>
          </div>
       </div>
    </div>
  );
};

function App() {
  const audioPlayer = useSoundManager();
  const playSound = audioPlayer ? audioPlayer.playSound : () => {};

  const [currentScreen, setCurrentScreen] = useState<Screen>('MENU');
  const [lang, setLang] = useState<Language>('en'); 
  
  const { gameState, handleMouseDown, handleMouseMove, handleMouseUp, resetGame, handleBoardMouseDown, handleActivatePulsar, clearTurnLossReason, clearBonusTurn } = useGameEngine({ playSound, lang });
  const svgRef = useRef<SVGSVGElement>(null);

  const [helpModalTeam, setHelpModalTeam] = useState<Team | null>(null);
  const [turnChangeInfo, setTurnChangeInfo] = useState<{ team: Team; previousTeam: Team | null; key: number; reason: TurnLossReason | null } | null>(null);
  const prevTurnRef = useRef<Team | null>(null);

  useEffect(() => {
    if (currentScreen !== 'GAME' || gameState.status !== 'PLAYING') return;
    const hasTurnChanged = prevTurnRef.current !== null && prevTurnRef.current !== gameState.currentTurn;
    if ((prevTurnRef.current === null || hasTurnChanged) && !gameState.isSimulating && !gameState.goalScoredInfo) {
      if (hasTurnChanged) playSound('TURN_CHANGE');
      setTurnChangeInfo({ team: gameState.currentTurn, previousTeam: prevTurnRef.current, key: Date.now(), reason: gameState.turnLossReason });
      const timer = setTimeout(() => { setTurnChangeInfo(null); if (gameState.turnLossReason) clearTurnLossReason(); }, 2500);
      prevTurnRef.current = gameState.currentTurn;
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.isSimulating, gameState.goalScoredInfo, gameState.turnLossReason, playSound, clearTurnLossReason, currentScreen, gameState.status]);

  useEffect(() => {
    if (gameState.bonusTurnForTeam) {
      const timer = setTimeout(() => {
        clearBonusTurn();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [gameState.bonusTurnForTeam, clearBonusTurn]);

  const getSVGCoordinates = useCallback((clientX: number, clientY: number): Vector | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  useEffect(() => {
    if (currentScreen === 'MENU') return;
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
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
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [handleMouseMove, handleMouseUp, getSVGCoordinates, currentScreen]);

  // ViewBox total height used for aspect ratio: BOARD_HEIGHT + GOAL_DEPTH * 2 + padding
  const totalViewHeight = BOARD_HEIGHT + GOAL_DEPTH * 2 + 20;

  if (currentScreen === 'MENU') {
      return <MainMenu onStartGame={() => { resetGame(); prevTurnRef.current = null; setCurrentScreen('GAME'); }} onLanguageChange={setLang} currentLanguage={lang} playSound={playSound} />;
  }

  return (
    <div className={`app-container ${gameState.goalScoredInfo ? 'goal-flash-active' : ''}`}>
        <style>{`
            .app-container { display: flex; flex-direction: column; width: 100vw; height: 100vh; overflow: hidden; position: relative; background: #000; }
            .main-content-area { flex-grow: 1; display: flex; justify-content: center; align-items: center; padding: 0.5rem; position: relative; overflow: hidden; }
            .game-board-wrapper { 
                height: 100%; 
                max-height: calc(100vh - 128px); 
                aspect-ratio: ${BOARD_WIDTH} / ${totalViewHeight}; 
                position: relative; 
                box-shadow: 0 0 100px rgba(255,0,0,0.15); 
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.05);
            }
        `}</style>
        <PlayerUI team="RED" gameState={gameState} onHelpClick={() => setHelpModalTeam('RED')} onActivatePulsar={handleActivatePulsar} scoreShouldPop={false} lang={lang} />
        <main className="main-content-area">
          <div className="game-board-wrapper">
            <GameBoard ref={svgRef} gameState={gameState} onMouseDown={handleMouseDown} onBoardMouseDown={handleBoardMouseDown} lang={lang} />
            {gameState.goalScoredInfo && <GoalTransition info={gameState.goalScoredInfo} lang={lang} />}
            {turnChangeInfo && <TurnChangeIndicator key={turnChangeInfo.key} team={turnChangeInfo.team} previousTeam={turnChangeInfo.previousTeam} reason={turnChangeInfo.reason} lang={lang} />}
            <GameMessageDisplay message={gameState.gameMessage} lang={lang} />
            <BonusTurnIndicator team={gameState.bonusTurnForTeam} lang={lang} />
          </div>
        </main>
        <PlayerUI team="BLUE" gameState={gameState} onHelpClick={() => setHelpModalTeam('BLUE')} onActivatePulsar={handleActivatePulsar} scoreShouldPop={false} lang={lang} />
        {gameState.winner && <WinnerModal winner={gameState.winner} score={gameState.score} onRestart={resetGame} onGoMenu={() => setCurrentScreen('MENU')} playSound={playSound} lang={lang} />}
        <HelpModal isOpen={helpModalTeam !== null} onClose={() => setHelpModalTeam(null)} team={helpModalTeam} playSound={playSound} lang={lang} />
    </div>
  );
}

export default App;