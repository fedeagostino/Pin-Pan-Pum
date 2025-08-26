import React from 'react';
import { GameState, SpecialShotStatus, Team } from '../types';
import { TEAM_COLORS, UI_COLORS, MAX_PULSAR_POWER } from '../constants';

interface PlayerUIProps {
    gameState: GameState;
    team: Team;
    onHelpClick: () => void;
    onActivatePulsar: () => void;
    scoreShouldPop: boolean;
}

const CrownIcon: React.FC<{ status: SpecialShotStatus }> = ({ status }) => (
    <svg 
        className={`crown-icon ${status.toLowerCase()}`}
        viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13.177l2.039-7.543L8.01 2l3.978 3.634L15.966 2l3.97 3.634L22 5.634l2 7.543-11.012 3.823L2 13.177z" />
    </svg>
);

const PulsarBar: React.FC<{ power: number; team: Team; onActivate: () => void; isArmed: boolean; canActivate: boolean }> = ({ power, team, onActivate, isArmed, canActivate }) => {
    const percentage = Math.min(100, (power / MAX_PULSAR_POWER) * 100);
    const isFull = percentage >= 100;
    const isClickable = (isFull || isArmed) && canActivate;

    return (
        <div className="pulsar-pod">
            <div className={`pulsar-bar-background ${isFull ? 'full' : ''}`}>
                 <div className="pulsar-bar-fill" style={{ width: `${percentage}%` }}/>
                 <div className="pulsar-bar-text">{Math.floor(power)}/{MAX_PULSAR_POWER}</div>
            </div>
            <button 
                className={`pulsar-activate-button ${isArmed ? 'armed' : ''}`} 
                onClick={onActivate} 
                disabled={!isClickable}
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>{isArmed ? 'ARMADO' : 'PULSAR'}</span>
            </button>
        </div>
    );
};

const PlayerUI: React.FC<PlayerUIProps> = ({ gameState, team, onHelpClick, onActivatePulsar, scoreShouldPop }) => {
    const isReversed = team === 'BLUE';
    const teamColor = TEAM_COLORS[team];
    const score = gameState.score[team];
    const pulsarPower = gameState.pulsarPower[team];
    const specialShotStatus = gameState.specialShotStatus[team];
    const isPulsarArmed = gameState.pulsarShotArmed === team;
    const canActivatePulsar = !gameState.isSimulating && gameState.canShoot && gameState.currentTurn === team;

    const isMyTurn = gameState.currentTurn === team && gameState.canShoot && !gameState.isSimulating;

    return (
        <header className={`player-ui-container ${isReversed ? 'reversed' : ''}`} style={{'--team-color': teamColor, '--team-glow': `${teamColor}99`} as React.CSSProperties}>
             <style>{`
                @keyframes score-pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); filter: drop-shadow(0 0 10px var(--team-color)); } 100% { transform: scale(1); } }
                @keyframes active-turn-glow { 0%, 100% { box-shadow: 0 0 20px -5px var(--team-glow), inset 0 0 10px -4px var(--team-glow), 0 4px 0 0 var(--color-shadow-main), 0 8px 10px 0px var(--color-shadow-main); } 50% { box-shadow: 0 0 30px 0px var(--team-color), inset 0 0 14px 0px var(--team-color), 0 4px 0 0 var(--color-shadow-main), 0 8px 10px 0px var(--color-shadow-main); } }
                @keyframes special-ready-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 12px var(--glow-color); } 50% { transform: scale(1.05); box-shadow: 0 0 20px var(--glow-color); } }
                @keyframes ultimate-color-cycle { 0% { --glow-color: #ff00de; color: #ff00de; } 50% { --glow-color: #00f6ff; color: #00f6ff; } 100% { --glow-color: #ff00de; color: #ff00de; } }
                @keyframes pulsar-full-glow { 0%, 100% { background-color: var(--team-color); box-shadow: 0 0 10px var(--team-glow); } 50% { background-color: #fff; box-shadow: 0 0 20px #fff; } }

                .player-ui-container {
                    display: flex; justify-content: center; align-items: center;
                    height: clamp(64px, 10vh, 72px); width: 100%;
                    position: relative; z-index: 10; padding: 0 1rem;
                }
                .player-ui-container.reversed {
                    transform: rotate(180deg);
                }
                
                .ui-content-wrapper {
                    display: flex; align-items: stretch; justify-content: space-between;
                    width: 100%; max-width: 900px; height: 56px; gap: 0.5rem;
                }
                .player-ui-container.reversed .ui-content-wrapper { flex-direction: row-reverse; }
                
                .score-pod {
                    background: var(--color-wood-dark); border: 3px solid var(--color-shadow-main);
                    box-shadow: 0 4px 0 0 var(--color-shadow-main);
                    border-radius: 12px 0 0 12px;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 1.5rem;
                    transition: box-shadow 0.3s ease;
                }
                .player-ui-container.reversed .score-pod { border-radius: 0 12px 12px 0; }
                .score-pod.active-turn { animation: active-turn-glow 2s infinite ease-in-out; }
                
                .score-display { 
                    font-family: var(--font-family-main); font-size: 2.8rem; line-height: 1; 
                    color: var(--team-color); -webkit-text-stroke: 2px var(--color-shadow-main);
                    text-stroke: 2px var(--color-shadow-main);
                    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .score-display.pop { animation: score-pop 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
                
                .center-hub {
                    flex-grow: 1; display: flex; align-items: stretch; gap: 0.5rem;
                }
                .player-ui-container.reversed .center-hub { flex-direction: row-reverse; }

                .special-shot-pod {
                    background: var(--color-wood-dark); border: 3px solid var(--color-shadow-main);
                    box-shadow: 0 4px 0 0 var(--color-shadow-main);
                    padding: 0 1rem; display: flex; align-items: center;
                    border-radius: 8px; transition: all 0.3s ease;
                }
                .special-shot-pod .crown-icon { font-size: 2rem; color: #00000033; transition: all 0.3s ease; }
                .special-shot-pod.royal { --glow-color: ${UI_COLORS.GOLD}; animation: special-ready-pulse 2s infinite ease-in-out; }
                .special-shot-pod.ultimate { animation: special-ready-pulse 2s infinite ease-in-out, ultimate-color-cycle 3s linear infinite; }
                .special-shot-pod.royal .crown-icon, .special-shot-pod.ultimate .crown-icon { color: var(--glow-color); filter: drop-shadow(0 0 5px var(--glow-color)); }
                
                .pulsar-pod { display: flex; align-items: stretch; background: var(--color-wood-dark); border: 3px solid var(--color-shadow-main); box-shadow: 0 4px 0 0 var(--color-shadow-main); border-radius: 8px; flex-grow: 1; padding: 4px; gap: 4px; }
                .pulsar-bar-background { flex-grow: 1; height: 100%; background: var(--color-wood-medium); border-radius: 5px; position: relative; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4); }
                .pulsar-bar-background.full .pulsar-bar-fill { animation: pulsar-full-glow 1.5s infinite ease-in-out; }
                .pulsar-bar-fill { height: 100%; background-color: var(--team-color); border-radius: 5px; transition: width 0.3s ease; }
                .pulsar-bar-text { position: absolute; inset: 0; text-align: center; font-size: 1rem; font-weight: 400; font-family: var(--font-family-main); color: white; text-shadow: 1px 1px 2px black; line-height: 2.2; z-index: 2; }

                .pulsar-activate-button {
                    font-family: var(--font-family-main);
                    display: flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0 1rem; 
                    font-size: 1rem; border-radius: 5px; cursor: pointer; color: white;
                    border: 2px solid var(--color-shadow-main);
                    background: var(--color-wood-light); color: var(--color-text-dark);
                    transition: all 0.2s ease-out; opacity: 0.6;
                }
                .pulsar-activate-button:disabled:not(.armed) { cursor: not-allowed; }
                .pulsar-activate-button:not(:disabled) { opacity: 1; background: var(--color-accent-green); color: white; }
                .pulsar-activate-button:not(:disabled):hover { transform: scale(1.05); }
                .pulsar-activate-button.armed { opacity: 1; background: var(--color-team-color); }

                .help-button-pod {
                     background: var(--color-wood-dark); border: 3px solid var(--color-shadow-main);
                    box-shadow: 0 4px 0 0 var(--color-shadow-main);
                    border-radius: 0 12px 12px 0;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 1rem;
                }
                .player-ui-container.reversed .help-button-pod { border-radius: 12px 0 0 12px; }
                .help-button { 
                    background: var(--color-wood-light); border: 2px solid var(--color-shadow-main); 
                    color: var(--color-text-dark); width: 36px; height: 36px; 
                    border-radius: 50%; cursor: pointer; display: flex; 
                    align-items: center; justify-content: center; 
                    transition: all 0.2s ease; flex-shrink: 0;
                }
                .help-button:hover { transform: scale(1.1); }
                .help-button svg { width: 18px; height: 18px; }

                @media (max-width: 640px) {
                    .player-ui-container { height: clamp(56px, 8vh, 60px); }
                    .ui-content-wrapper { height: 48px; }
                    .score-pod { padding: 0 1rem; }
                    .score-display { font-size: 2.2rem; }
                    .special-shot-pod { display: none; }
                    .pulsar-bar-text { font-size: 0.9rem; line-height: 2.4; }
                }
            `}</style>
            <div className={`ui-content-wrapper`}>
                <div className={`score-pod ${isMyTurn ? 'active-turn' : ''}`}>
                    <div className={`score-display ${scoreShouldPop ? 'pop' : ''}`}>{score}</div>
                </div>

                <div className="center-hub">
                    <div className={`special-shot-pod ${specialShotStatus.toLowerCase()}`}>
                        <CrownIcon status={specialShotStatus} />
                    </div>
                    <PulsarBar 
                        power={pulsarPower} 
                        team={team} 
                        onActivate={onActivatePulsar} 
                        isArmed={isPulsarArmed} 
                        canActivate={canActivatePulsar} 
                    />
                </div>

                <div className="help-button-pod">
                    <button className="help-button" onClick={onHelpClick} aria-label="Ayuda e Información">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default PlayerUI;