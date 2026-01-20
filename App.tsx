
import React, { useRef, useCallback, useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerUI from './components/PlayerUI';
import TurnChangeIndicator from './components/TurnChangeIndicator';
import MainMenu from './components/MainMenu';
import { useGameEngine } from './hooks/useGameEngine';
import { useSoundManager } from './hooks/useSoundManager';
import { TEAM_COLORS, BOARD_WIDTH, BOARD_HEIGHT, TRANSLATIONS, Language } from './constants';
import { Team, Vector, PuckType, TurnLossReason, FormationType } from './types';
import PuckTypeIcon from './components/PuckTypeIcon';
import HelpModal from './components/HelpModal';
import GameMessageDisplay from './components/GameMessageDisplay';
import BonusTurnIndicator from './components/BonusTurnIndicator';
import useGemini from './hooks/useGemini';

type Screen = 'MENU' | 'GAME';

const FormationSelector: React.FC<{ team: Team; current: FormationType; onSelect: (f: FormationType) => void; lang: Language; playSound: (s: string) => void }> = ({ team, current, onSelect, lang, playSound }) => {
    const formations: FormationType[] = ['BALANCED', 'DEFENSIVE', 'OFFENSIVE'];
    const teamColor = TEAM_COLORS[team];
    const currentIndex = formations.indexOf(current);

    const handlePrev = () => {
        playSound('UI_CLICK_1');
        const nextIdx = (currentIndex - 1 + formations.length) % formations.length;
        onSelect(formations[nextIdx]);
    };

    const handleNext = () => {
        playSound('UI_CLICK_1');
        const nextIdx = (currentIndex + 1) % formations.length;
        onSelect(formations[nextIdx]);
    };

    return (
        <div className="formation-carousel" style={{ '--team-color': teamColor } as any}>
            <style>{`
                .formation-carousel { 
                    display: flex; 
                    align-items: center; 
                    gap: 4rem; 
                    background: none;
                    padding: 1rem;
                }
                .arrow-btn { 
                    background: rgba(0,0,0,0.2); 
                    border: 1px solid rgba(255,255,255,0.1); 
                    color: var(--team-color); 
                    font-size: 3rem; 
                    width: 60px;
                    height: 60px;
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 0 10px var(--team-color));
                    border-radius: 50%;
                    line-height: 0;
                    padding-bottom: 8px; /* Offset visual center of ‹ and › */
                }
                .arrow-btn:hover { 
                    transform: scale(1.1); 
                    background: rgba(255,255,255,0.05);
                    filter: drop-shadow(0 0 20px var(--team-color)); 
                }
                .arrow-btn:active { transform: scale(0.9); }
            `}</style>
            <button className="arrow-btn" onClick={handlePrev}>‹</button>
            <button className="arrow-btn" onClick={handleNext}>›</button>
        </div>
    );
};

const PreGameOverlay: React.FC<{ gameState: any; setFormation: (t: Team, f: FormationType) => void; onReady: () => void; lang: Language; playSound: (s: string) => void }> = ({ gameState, setFormation, onReady, lang, playSound }) => {
    return (
        <div className="pre-game-overlay">
            <style>{`
                .pre-game-overlay { 
                    position: absolute; 
                    inset: 0; 
                    background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%);
                    display: flex; 
                    flex-direction: column; 
                    justify-content: space-between;
                    align-items: center; 
                    z-index: 200; 
                    padding: 6rem 0;
                    pointer-events: none;
                }
                .formation-control-top, .formation-control-bottom {
                    pointer-events: auto;
                }
                .countdown-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    pointer-events: none;
                }
                .countdown-display { 
                    font-family: var(--font-family-title); 
                    font-size: 14rem; 
                    color: white; 
                    text-shadow: 0 0 50px rgba(255,255,255,0.2); 
                    animation: pulse-countdown 1s infinite; 
                    line-height: 1;
                    margin: 0;
                    opacity: 0.6;
                }
                @keyframes pulse-countdown { 
                    0% { transform: scale(1); opacity: 0.4; } 
                    50% { transform: scale(1.1); opacity: 0.7; } 
                    100% { transform: scale(1); opacity: 0.4; }
                }
            `}</style>
            
            <div className="formation-control-top">
                <FormationSelector team="RED" current={gameState.formations.RED} onSelect={(f) => setFormation('RED', f)} lang={lang} playSound={playSound} />
            </div>

            <div className="countdown-container">
                <div className="countdown-display">{gameState.preGameCountdown}</div>
            </div>

            <div className="formation-control-bottom">
                <FormationSelector team="BLUE" current={gameState.formations.BLUE} onSelect={(f) => setFormation('BLUE', f)} lang={lang} playSound={playSound} />
            </div>
        </div>
    );
};

const WinnerModal: React.FC<{ winner: Team; score: { RED: number; BLUE: number }; onRestart: () => void; onGoMenu: () => void; playSound: (sound: string) => void; lang: Language }> = ({ winner, score, onRestart, onGoMenu, playSound, lang }) => {
  const t = TRANSLATIONS[lang];
  const teamName = winner === 'BLUE' ? (lang === 'es' ? 'Equipo Azul' : 'Blue Team') : (lang === 'es' ? 'Equipo Rojo' : 'Red Team');
  const teamColor = TEAM_COLORS[winner];

  return (
    <div className="modal-overlay">
      <div className="winner-modal-layout">
        <style>{`
            .winner-modal-layout { text-align: center; padding: 2rem; }
            .winner-title { font-size: 5rem; color: #ff0000; text-shadow: 0 0 20px #ff0000; margin: 0; }
            .winner-team { font-size: 2rem; color: var(--team-color); margin-bottom: 2rem; }
            .final-score-box { font-size: 3rem; display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; }
            .restart-button { padding: 1rem 2rem; font-family: var(--font-family-title); font-size: 1.5rem; background: #ff0000; color: black; border: none; cursor: pointer; border-radius: 4px; }
        `}</style>
        <div 
            className="winner-info-panel"
            style={{ '--team-color': teamColor } as React.CSSProperties}
        >
            <h1 className="winner-title">{t.VICTORY}</h1>
            <h2 className="winner-team">{teamName}</h2>
            <div className="final-score-box">
                <span style={{ color: TEAM_COLORS.BLUE }}>{score.BLUE}</span>
                <span>-</span>
                <span style={{ color: TEAM_COLORS.RED }}>{score.RED}</span>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => { playSound('UI_CLICK_1'); onRestart(); }} className="restart-button">{t.RESTART}</button>
            <button onClick={() => { playSound('UI_CLICK_2'); onGoMenu(); }} className="restart-button" style={{ background: '#333', color: 'white', boxShadow: 'none' }}>{t.MENU}</button>
        </div>
      </div>
    </div>
  );
};

const GoalTransition: React.FC<{ info: { scoringTeam: Team; pointsScored: number; scoringPuckType: PuckType; } | null; lang: Language }> = ({ info, lang }) => {
  if (!info) return null;
  const t = TRANSLATIONS[lang];
  const { scoringTeam, pointsScored, scoringPuckType } = info;
  const teamColor = TEAM_COLORS[scoringTeam];
  const goalText = pointsScored > 1 ? t.GOALAZO : t.GOAL;
  const pieceName = (t.PUCK_INFO as any)[scoringPuckType]?.name || scoringPuckType;
  const teamLabel = scoringTeam === 'RED' ? (lang === 'es' ? 'EQUIPO ROJO' : 'RED TEAM') : (lang === 'es' ? 'EQUIPO AZUL' : 'BLUE TEAM');

  return (
    <div key={Date.now()} className="goal-transition-overlay">
       <style>{`
          @keyframes goal-flicker { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
          .goal-transition-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 2000; pointer-events: none; }
          .goal-transition-content { text-align: center; position: relative; animation: goal-flicker 0.2s infinite; }
          .goal-puck-icon { width: 120px; height: 120px; margin: 0 auto 1rem; filter: drop-shadow(0 0 15px var(--ray-color)); }
          .goal-transition-text { font-family: var(--font-family-title); font-size: 6rem; color: #fff; margin: 0; text-shadow: 0 0 20px var(--text-color), 0 0 40px var(--text-color); }
          .goal-info-banner { background: rgba(0,0,0,0.9); border-top: 2px solid var(--text-color); border-bottom: 2px solid var(--text-color); padding: 1rem 3rem; margin-top: 1rem; }
          .goal-team-name { font-family: var(--font-family-title); font-size: 2rem; color: var(--text-color); margin: 0; }
          .goal-points-badge { display: inline-block; background: var(--text-color); color: #000; padding: 0.2rem 1rem; font-weight: 900; margin-top: 1rem; font-size: 1.4rem; }
       `}</style>
       <div className="goal-transition-content">
            <PuckTypeIcon puckType={scoringPuckType} teamColor={teamColor} className="goal-puck-icon" />
           <h1 className="goal-transition-text" style={{'--text-color': teamColor} as React.CSSProperties}>
            {goalText}
           </h1>
           <div className="goal-info-banner" style={{'--text-color': teamColor} as React.CSSProperties}>
              <h2 className="goal-team-name">{teamLabel}</h2>
              <div className="goal-points-badge">+{pointsScored} {t.POINTS}</div>
           </div>
       </div>
    </div>
  );
};

function App() {
  const audioPlayer = useSoundManager();
  const playSound = audioPlayer ? audioPlayer.playSound : () => {};

  const [currentScreen, setCurrentScreen] = useState<Screen>('MENU');
  const [lang, setLang] = useState<Language>('es'); 
  
  const { gameState, handleMouseDown, handleMouseMove, handleMouseUp, resetGame, handleBoardMouseDown, handleActivatePulsar, clearTurnLossReason, clearBonusTurn, startGame, setFormation } = useGameEngine({ playSound });
  const svgRef = useRef<SVGSVGElement>(null);

  const [helpModalTeam, setHelpModalTeam] = useState<Team | null>(null);
  const [turnChangeInfo, setTurnChangeInfo] = useState<{ team: Team; previousTeam: Team | null; key: number; reason: TurnLossReason | null } | null>(null);
  const prevTurnRef = useRef<Team | null>(null);

  useEffect(() => {
    if (currentScreen !== 'GAME' || gameState.status !== 'PLAYING') return;
    
    const isFirstTurn = prevTurnRef.current === null;
    const hasTurnChanged = prevTurnRef.current !== null && prevTurnRef.current !== gameState.currentTurn;

    if ((isFirstTurn || hasTurnChanged) && !gameState.isSimulating && !gameState.goalScoredInfo) {
      if (hasTurnChanged) playSound('TURN_CHANGE');
      
      const currentReason = gameState.turnLossReason;
      setTurnChangeInfo({ 
        team: gameState.currentTurn, 
        previousTeam: prevTurnRef.current, 
        key: Date.now(), 
        reason: currentReason 
      });

      const timer = setTimeout(() => {
          setTurnChangeInfo(null);
          if (currentReason) clearTurnLossReason();
      }, 2500);

      prevTurnRef.current = gameState.currentTurn;
      return () => clearTimeout(timer);
    }
    
    if (gameState.isSimulating && turnChangeInfo) {
      setTurnChangeInfo(null);
    }

  }, [gameState.currentTurn, gameState.isSimulating, gameState.goalScoredInfo, gameState.turnLossReason, playSound, clearTurnLossReason, currentScreen, turnChangeInfo, gameState.status]);

  const getSVGCoordinates = useCallback((clientX: number, clientY: number): Vector | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  useEffect(() => {
    if (currentScreen === 'MENU') return;
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
  }, [handleMouseMove, handleMouseUp, getSVGCoordinates, gameState.selectedPuckId, currentScreen]);

  if (currentScreen === 'MENU') {
      return (
          <MainMenu 
            onStartGame={() => {
                resetGame();
                prevTurnRef.current = null;
                setCurrentScreen('GAME');
            }} 
            onLanguageChange={setLang}
            currentLanguage={lang}
            playSound={playSound}
          />
      );
  }

  return (
    <div className={`app-container ${gameState.screenShake > 0 ? 'screen-shake' : ''}`}>
        <style>{`
            .app-container { display: flex; flex-direction: column; width: 100vw; height: 100vh; overflow: hidden; position: relative; background: #000; }
            .main-content-area { flex-grow: 1; display: flex; justify-content: center; align-items: center; padding: 0.5rem; position: relative; }
            .game-board-wrapper { height: 100%; aspect-ratio: ${BOARD_WIDTH} / ${BOARD_HEIGHT}; position: relative; }
        `}</style>

        <PlayerUI team="RED" gameState={gameState} onHelpClick={() => setHelpModalTeam('RED')} onActivatePulsar={handleActivatePulsar} scoreShouldPop={false} lang={lang} />
        
        <main className="main-content-area">
          <div className="game-board-wrapper">
            <GameBoard ref={svgRef} gameState={gameState} onMouseDown={handleMouseDown} onBoardMouseDown={handleBoardMouseDown} lang={lang} />
            
            {gameState.status === 'PRE_GAME' && <PreGameOverlay gameState={gameState} setFormation={setFormation} onReady={startGame} lang={lang} playSound={playSound} />}
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
