import React, { useRef, useCallback, useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import PlayerUI from './components/PlayerUI';
import TurnChangeIndicator from './components/TurnChangeIndicator';
import { useGameEngine } from './hooks/useGameEngine';
import { useSoundManager } from './hooks/useSoundManager';
import { TEAM_COLORS, PUCK_TYPE_INFO, SELECTABLE_PUCKS, SYNERGY_DESCRIPTIONS } from './constants';
import { Team, PuckType, TurnLossReason, TeamConfig, Vector } from './types';
import PuckTypeIcon from './components/PuckTypeIcon';
import HelpModal from './components/HelpModal';
import GameMessageDisplay from './components/GameMessageDisplay';
import BonusTurnIndicator from './components/BonusTurnIndicator';
import useGemini from './hooks/useGemini';
import GameCommentary from './components/GameCommentary';
import MainMenu from './components/MainMenu';
import SetupScreen from './components/SetupScreen';
import { STRATEGIC_PLANS } from './formations';

type GameStep = 'menu' | 'setupRed' | 'setupBlue' | 'playing';
type GameMode = 'pvp' | 'pve';


const WinnerModal: React.FC<{ winner: Team; score: { RED: number; BLUE: number }; onBackToMenu: () => void; playSound: (sound: string) => void; }> = ({ winner, score, onBackToMenu, playSound }) => {
  const teamName = winner === 'BLUE' ? 'Equipo Azul' : 'Equipo Rojo';
  const teamColor = TEAM_COLORS[winner];

  const handleBackToMenuClick = () => {
    playSound('UI_CLICK_1');
    onBackToMenu();
  };

  return (
    <div className="modal-overlay">
      <div className="winner-modal-layout">
        <div 
            className="winner-info-panel"
            style={{ '--team-color': teamColor, '--team-glow': `${teamColor}99` } as React.CSSProperties}
        >
            <h1 className="winner-title">¡VICTORIA!</h1>
            <h2 className="winner-team">{teamName}</h2>
            <div className="final-score-box">
                <span style={{ color: TEAM_COLORS.BLUE }}>{score.BLUE}</span>
                <span>-</span>
                <span style={{ color: TEAM_COLORS.RED }}>{score.RED}</span>
            </div>
        </div>
        <button onClick={handleBackToMenuClick} className="restart-button">Volver al Menú</button>
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
        <div className="goal-starburst-container" style={{'--ray-color': teamColor} as React.CSSProperties}>
             <div className="starburst"></div>
        </div>
        <PuckTypeIcon puckType={scoringPuckType} teamColor={teamColor} className="goal-puck-icon" />
       <h1 className="goal-transition-text" style={{'--text-color': teamColor} as React.CSSProperties}>
        {goalText}
       </h1>
       <p className="goal-transition-subtitle" style={{ color: teamColor }}>{`+${pointsScored}`}</p>
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

  const { gameState, startGame: engineStartGame, handleMouseDown, handleMouseMove, handleMouseUp, resetGame, handleBoardMouseDown, handleActivatePulsar, clearTurnLossReason, clearBonusTurn } = useGameEngine({ playSound });
  const svgRef = useRef<SVGSVGElement>(null);

  const [gameStep, setGameStep] = useState<GameStep>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [teamConfigs, setTeamConfigs] = useState<{ red: TeamConfig | null; blue: TeamConfig | null }>({ red: null, blue: null });

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

  const handleStartPvP = () => {
    playSound('UI_CLICK_1');
    setGameMode('pvp');
    setGameStep('setupRed');
  };

  const handleStartPvE = () => {
    playSound('UI_CLICK_1');
    setGameMode('pve');
    setGameStep('setupBlue'); // Player will always be Blue in PvE
  };

  const backToMenu = () => {
    setGameStep('menu');
    setTeamConfigs({ red: null, blue: null });
    resetGame();
  };

  const handleRedSetupComplete = (config: TeamConfig) => {
      playSound('UI_CLICK_1');
      setTeamConfigs(prev => ({ ...prev, red: config }));
      setGameStep('setupBlue');
  };

  const handleBlueSetupComplete = (config: TeamConfig) => {
    playSound('UI_CLICK_1');
    
    const blueConfig = config;
    let redConfig: TeamConfig | null = null;
    const currentRedConfig = teamConfigs.red;

    if (gameMode === 'pve') {
        // AI is Red team. Generate its config.
        const aiPucks: PuckType[] = [];
        const availablePucks = [...SELECTABLE_PUCKS];
        while(aiPucks.length < 7) {
            const randomIndex = Math.floor(Math.random() * availablePucks.length);
            const chosenPuck = availablePucks.splice(randomIndex, 1)[0];
            aiPucks.push(chosenPuck);
        }
        const aiPlan = STRATEGIC_PLANS.RED[Math.floor(Math.random() * STRATEGIC_PLANS.RED.length)];
        redConfig = {
            team: 'RED',
            pucks: aiPucks,
            strategicPlanName: aiPlan.name
        };
    } else { // pvp
        redConfig = currentRedConfig;
    }

    if (redConfig && blueConfig) {
        setTeamConfigs({ red: redConfig, blue: blueConfig });
        const aiTeam = gameMode === 'pve' ? 'RED' : undefined;
        engineStartGame([redConfig, blueConfig], aiTeam);
        setGameStep('playing');
        playSound('GOAL_SCORE');
    } else {
        console.error("Red team config missing. Returning to menu.");
        backToMenu();
    }
  };

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
    if (gameStep !== 'playing') return;

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
  }, [gameStep, gameState.currentTurn, gameState.isSimulating, gameState.goalScoredInfo, gameState.turnLossReason, playSound, clearTurnLossReason]);

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
    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return null;
    return pt.matrixTransform(screenCTM.inverse());
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
    if (turnChangeInfo) {
        setTurnChangeInfo(null);
        if (gameState.turnLossReason) {
            clearTurnLossReason();
        }
    }
    if (gameState.bonusTurnForTeam) {
        clearBonusTurn();
    }
  };
  
  const scoreShouldPop = isGoalShaking;
  
  const renderContent = () => {
      switch (gameStep) {
          case 'menu':
              return <MainMenu onPlay={handleStartPvP} onPlayAI={handleStartPvE} />;
          case 'setupRed':
              return <SetupScreen team="RED" onSetupComplete={handleRedSetupComplete} playSound={playSound} />;
          case 'setupBlue':
              return <SetupScreen team="BLUE" onSetupComplete={handleBlueSetupComplete} playSound={playSound} />;
          case 'playing':
              return (
                <>
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
                </>
              );
          default:
              return <MainMenu onPlay={handleStartPvP} onPlayAI={handleStartPvE} />;
      }
  }

  return (
    <div 
      className={`app-container ${gameState.screenShake > 0 ? 'screen-shake' : ''}`}
      onMouseDown={handleScreenInteraction}
      onTouchStart={handleScreenInteraction}
    >
        <style>{`
          .app-container { display: flex; flex-direction: column; width: 100vw; height: 100dvh; overflow: hidden; position: relative; background-color: var(--color-background-paper); }
          .main-content-area { flex-grow: 1; display: flex; justify-content: center; align-items: center; padding: 0.5rem; position: relative; min-height: 0; }
          .game-board-wrapper { height: 100%; max-width: 100%; aspect-ratio: 800 / 1200; position: relative; }
          
           @keyframes screen-shake-anim {
                0% { transform: translate(0, 0); }
                10% { transform: translate(-2px, -2px); }
                20% { transform: translate(2px, 2px); }
                30% { transform: translate(-2px, 2px); }
                40% { transform: translate(2px, -2px); }
                50% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                70% { transform: translate(0, 0); }
                100% { transform: translate(0, 0); }
            }
            .screen-shake {
                animation: screen-shake-anim 0.2s linear;
            }

            .modal-overlay {
                position: fixed;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                animation: modal-fade-in 0.3s ease;
            }
            @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modal-content-pop-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }

            .winner-modal-layout {
                animation: modal-content-pop-in 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                display: flex;
                flex-direction: column;
                gap: 2rem;
                align-items: center;
            }
            .winner-info-panel {
                width: 90%;
                max-width: 420px;
                background-color: var(--color-background-paper);
                border: 6px solid var(--color-shadow-main);
                border-radius: 16px;
                padding: 2rem;
                text-align: center;
                box-shadow: 0 10px 0 0 var(--color-shadow-main), 0 0 40px var(--team-glow);
                position: relative;
            }
            .winner-info-panel::before {
                content: '';
                position: absolute;
                inset: -10px;
                background: radial-gradient(circle, var(--team-color) 0%, transparent 70%);
                animation: winner-glow-rotate 10s linear infinite;
                z-index: -1;
            }
            @keyframes winner-glow-rotate { to { transform: rotate(360deg); } }
            .winner-title {
                font-family: var(--font-family-main);
                font-size: clamp(3rem, 10vw, 4.5rem);
                color: var(--color-text-dark);
                line-height: 1;
                margin: 0;
                text-shadow: 3px 3px 0 var(--color-wood-light);
            }
            .winner-team {
                font-family: var(--font-family-main);
                font-size: clamp(1.75rem, 6vw, 2.5rem);
                color: var(--team-color);
                margin: 0.5rem 0 1.5rem 0;
                -webkit-text-stroke: 3px var(--color-shadow-main);
                text-shadow: 0 0 15px var(--team-glow);
            }
            .final-score-box {
                background-color: var(--color-wood-dark);
                padding: 1rem;
                border-radius: 8px;
                font-size: clamp(2.5rem, 8vw, 3.5rem);
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1.5rem;
                color: white;
            }
            .restart-button {
                font-family: var(--font-family-main);
                padding: 1rem 2rem;
                background: var(--color-accent-green);
                color: white;
                font-size: clamp(1.2rem, 5vw, 1.5rem);
                border: 4px solid var(--color-shadow-main);
                border-radius: 12px;
                cursor: pointer;
                text-transform: uppercase;
                transition: all 0.1s ease-out;
                box-shadow: 0 8px 0 0 var(--color-shadow-main);
            }
            .restart-button:hover { transform: translateY(-4px); box-shadow: 0 12px 0 0 var(--color-shadow-main); }
            
            .goal-transition-overlay { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; z-index: 100; pointer-events: none; overflow: hidden; }
            .goal-transition-content { position: relative; display: flex; flex-direction: column; align-items: center; animation: goal-content-anim 3s forwards; }
            @keyframes goal-content-anim { 0% { transform: scale(0.5); opacity: 0; } 15% { transform: scale(1.1); opacity: 1; } 25% { transform: scale(1); } 85% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
            .goal-puck-icon { width: 120px; height: 120px; z-index: 2; margin-bottom: -1.5rem; }
            .goal-transition-text { font-family: var(--font-family-main); font-size: clamp(4rem, 18vw, 8rem); line-height: 1; color: var(--text-color); -webkit-text-stroke: 6px var(--color-shadow-main); text-stroke: 6px var(--color-shadow-main); text-shadow: 6px 6px 0px rgba(var(--color-shadow-main-rgb), 0.3); z-index: 1; }
            .goal-transition-subtitle { font-size: 3rem; font-weight: bold; color: white; -webkit-text-stroke: 3px var(--color-shadow-main); z-index: 2; margin-top: -1rem; }

            .goal-starburst-container { position: absolute; top: 50%; left: 50%; width: 1px; height: 1px; }
            .starburst { position: absolute; width: 800px; height: 800px; top: -400px; left: -400px; background: radial-gradient(circle, transparent 20%, var(--ray-color) 20.5%, var(--ray-color) 23%, transparent 23.5%), radial-gradient(circle, transparent 40%, var(--ray-color) 40.5%, var(--ray-color) 42%, transparent 42.5%); animation: starburst-anim 3s forwards; }
            @keyframes starburst-anim { 0% { transform: scale(0) rotate(0deg); opacity: 0; } 15% { opacity: 0.8; } 100% { transform: scale(2) rotate(180deg); opacity: 0; } }
        `}</style>

      {renderContent()}

      {gameState.winner && <WinnerModal winner={gameState.winner} score={gameState.score} onBackToMenu={backToMenu} playSound={playSound} />}
      {helpModalTeam && <HelpModal isOpen={!!helpModalTeam} onClose={() => setHelpModalTeam(null)} playSound={playSound} team={helpModalTeam}/>}
    </div>
  );
}

export default App;