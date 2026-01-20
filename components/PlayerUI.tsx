
import React from 'react';
import { GameState, Team } from '../types';
import { TEAM_COLORS, MAX_PULSAR_POWER, TRANSLATIONS, Language } from '../constants';

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
                .player-ui-container { 
                    display: flex; 
                    flex-direction: column;
                    justify-content: center; 
                    align-items: center; 
                    height: 55px; 
                    width: 100%; 
                    z-index: 10; 
                    padding: 0 0.5rem; 
                    position: relative;
                }
                @media (min-width: 768px) { .player-ui-container { height: 64px; } }

                .ui-content-wrapper { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    width: 100%; 
                    max-width: 900px; 
                    height: 42px; 
                    padding: 0 0.75rem; 
                    background: rgba(5, 8, 10, 0.95); 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                    border-radius: 4px; 
                    position: relative; 
                }
                @media (min-width: 768px) { 
                    .ui-content-wrapper { height: 52px; padding: 0 1.5rem; border-width: 2px; border-radius: 6px; } 
                }

                .ui-content-wrapper.active-turn { 
                    border-color: var(--team-color); 
                    box-shadow: 0 0 15px var(--team-color)44, inset 0 0 5px var(--team-color)22; 
                }
                
                .score-display { 
                    font-size: clamp(1.8rem, 8vw, 2.5rem); 
                    font-weight: 900; 
                    color: #fff; 
                    text-shadow: 0 0 10px var(--team-color); 
                    font-family: var(--font-family-title); 
                    line-height: 1;
                    min-width: 1.5ch;
                    text-align: center;
                }
                
                .pulsar-container { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    flex: 1; 
                    justify-content: center; 
                    padding: 0 0.5rem; 
                }
                @media (min-width: 768px) { .pulsar-container { gap: 1rem; padding: 0 2rem; } }
                
                .pulsar-bar-bg { 
                    flex: 1;
                    max-width: 200px; 
                    height: 8px; 
                    background: #111; 
                    border-radius: 4px; 
                    overflow: hidden; 
                    border: 1px solid #222; 
                    position: relative; 
                }
                @media (min-width: 768px) { .pulsar-bar-bg { height: 10px; max-width: 250px; } }

                .pulsar-bar-fill { 
                    height: 100%; 
                    transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); 
                    border-radius: 4px; 
                    position: relative; 
                }
                .pulsar-bar-fill::after { 
                    content: ''; position: absolute; inset: 0; 
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); 
                    animation: bar-shimmer 2s infinite linear; 
                }
                
                @keyframes bar-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                
                .pulsar-btn { 
                    background: transparent; 
                    color: #fff; 
                    border: 1.5px solid #333; 
                    padding: 0.3rem 0.6rem; 
                    border-radius: 3px; 
                    font-family: var(--font-family-title); 
                    font-size: 0.75rem;
                    cursor: pointer; 
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                }
                @media (min-width: 768px) { 
                    .pulsar-btn { font-size: 0.9rem; padding: 0.4rem 1.2rem; border-width: 2px; } 
                }

                .pulsar-btn.ready { border-color: #f1c40f; color: #f1c40f; box-shadow: 0 0 10px #f1c40f66; animation: pulse-ready 1.5s infinite; }
                .pulsar-btn.armed { background: #f1c40f; color: #000; border-color: #fff; box-shadow: 0 0 15px #f1c40f88; }
                
                @keyframes pulse-ready { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                
                .help-button { 
                    background: none; 
                    border: 1px solid #333; 
                    color: #555; 
                    width: 28px; 
                    height: 28px; 
                    border-radius: 50%; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                }
                @media (min-width: 768px) { .help-button { width: 32px; height: 32px; font-size: 1rem; } }
                .help-button:hover { border-color: #fff; color: #fff; }
                
                .player-label { 
                    font-family: var(--font-family-title); 
                    color: #fff; opacity: 0.3; 
                    font-size: 0.6rem; 
                    letter-spacing: 1px; 
                    position: absolute; 
                    top: 1px;
                }
                @media (max-width: 400px) { .player-label { display: none; } }
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
                                boxShadow: `0 0 10px ${canActivatePulsar ? '#f1c40f' : teamColor}`
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
