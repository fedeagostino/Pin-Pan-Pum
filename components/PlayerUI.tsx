
import React from 'react';
import { GameState, SpecialShotStatus, Team } from '../types';
import { TEAM_COLORS, UI_COLORS, MAX_PULSAR_POWER, TRANSLATIONS, Language } from '../constants';

interface PlayerUIProps {
    gameState: GameState;
    team: Team;
    onHelpClick: () => void;
    onActivatePulsar: () => void;
    scoreShouldPop: boolean;
    lang: Language;
}

const PlayerUI: React.FC<PlayerUIProps> = ({ gameState, team, onHelpClick, onActivatePulsar, scoreShouldPop, lang }) => {
    const t = TRANSLATIONS[lang];
    const isReversed = team === 'BLUE';
    const teamColor = TEAM_COLORS[team];
    const score = gameState.score[team];
    const pulsarPower = gameState.pulsarPower[team];
    const isPulsarArmed = gameState.pulsarShotArmed === team;
    const canActivatePulsar = pulsarPower >= MAX_PULSAR_POWER;
    const isMyTurn = gameState.currentTurn === team && gameState.canShoot && !gameState.isSimulating;

    const pulsarPercent = Math.min(100, (pulsarPower / MAX_PULSAR_POWER) * 100);

    return (
        <header className={`player-ui-container ${isReversed ? 'reversed' : ''}`} style={{'--team-color': teamColor} as React.CSSProperties}>
             <style>{`
                .player-ui-container { display: flex; justify-content: center; align-items: center; height: 64px; width: 100%; z-index: 10; padding: 0 1rem; }
                .ui-content-wrapper { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 900px; height: 52px; padding: 0 1.5rem; background: rgba(5, 8, 10, 0.9); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 6px; position: relative; overflow: hidden; }
                .ui-content-wrapper.active-turn { border-color: var(--team-color); box-shadow: 0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 10px var(--team-color)44; }
                
                .score-display { font-size: 2.8rem; font-weight: 900; color: #fff; text-shadow: 0 0 15px var(--team-color); font-family: var(--font-family-title); }
                
                .pulsar-container { display: flex; align-items: center; gap: 1rem; flex: 1; justify-content: center; padding: 0 2rem; }
                
                .pulsar-bar-bg { width: 100%; max-width: 250px; height: 10px; background: #111; border-radius: 5px; overflow: hidden; border: 1px solid #222; position: relative; }
                .pulsar-bar-fill { height: 100%; transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); border-radius: 5px; position: relative; }
                .pulsar-bar-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: bar-shimmer 2s infinite linear; }
                
                @keyframes bar-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                
                .pulsar-btn { 
                    background: transparent; 
                    color: #fff; 
                    border: 2px solid #333; 
                    padding: 0.4rem 1.2rem; 
                    border-radius: 4px; 
                    font-family: var(--font-family-title); 
                    font-size: 0.9rem;
                    cursor: pointer; 
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .pulsar-btn.ready { border-color: #f1c40f; color: #f1c40f; box-shadow: 0 0 10px #f1c40f; animation: pulse-ready 1.5s infinite; }
                .pulsar-btn.armed { background: #f1c40f; color: #000; border-color: #fff; box-shadow: 0 0 20px #f1c40f; }
                
                @keyframes pulse-ready { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                
                .help-button { background: none; border: 1px solid #333; color: #666; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: all 0.2s; font-weight: bold; }
                .help-button:hover { border-color: #fff; color: #fff; }
                
                .player-label { font-family: var(--font-family-title); color: #fff; opacity: 0.5; font-size: 0.7rem; letter-spacing: 2px; position: absolute; top: 2px; }
            `}</style>
            
            <span className="player-label">{isReversed ? 'BLUE COMMANDER' : 'RED COMMANDER'}</span>
            
            <div className={`ui-content-wrapper ${isMyTurn ? 'active-turn' : ''}`}>
                <div className="score-display">{score}</div>
                
                <div className="pulsar-container">
                    <div className="pulsar-bar-bg">
                        <div 
                            className="pulsar-bar-fill" 
                            style={{ 
                                width: `${pulsarPercent}%`, 
                                backgroundColor: canActivatePulsar ? '#f1c40f' : teamColor,
                                boxShadow: `0 0 15px ${canActivatePulsar ? '#f1c40f' : teamColor}`
                            }} 
                        />
                    </div>
                    <button 
                        className={`pulsar-btn ${isPulsarArmed ? 'armed' : (canActivatePulsar && isMyTurn ? 'ready' : '')}`} 
                        onClick={onActivatePulsar} 
                        disabled={!canActivatePulsar || !isMyTurn}
                    >
                        {isPulsarArmed ? (lang === 'es' ? 'ARMADO' : 'ARMED') : (lang === 'es' ? 'PULSAR' : 'PULSAR')}
                    </button>
                </div>

                <button className="help-button" onClick={onHelpClick}>?</button>
            </div>
        </header>
    );
}

export default PlayerUI;
