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
        strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5rem', height: '1.5rem' }}>
        <path d="M2 13.177l2.039-7.543L8.01 2l3.978 3.634L15.966 2l3.97 3.634L22 5.634l2 7.543-11.012 3.823L2 13.177z" />
    </svg>
);

const PulsarBar: React.FC<{ power: number; team: Team; onActivate: () => void; isArmed: boolean; canActivate: boolean }> = ({ power, team, onActivate, isArmed, canActivate }) => {
    const percentage = Math.min(100, (power / MAX_PULSAR_POWER) * 100);
    const isFull = percentage >= 100;
    const showButton = isArmed || (isFull && canActivate);
    const isClickable = (isFull || isArmed) && canActivate;
    const teamColor = TEAM_COLORS[team];
    const NUM_SEGMENTS = 10;

    return (
        <div className="pulsar-bar-container">
            <div className="pulsar-bar-background" style={{'--team-color': teamColor} as React.CSSProperties}>
                <div className="pulsar-bar-segments">
                    {Array.from({ length: NUM_SEGMENTS }).map((_, i) => (
                        <div key={i} className={`segment ${((i + 1) / NUM_SEGMENTS) * 100 <= percentage ? 'active' : ''}`} />
                    ))}
                </div>
                 <div className={`pulsar-bar-text ${showButton ? 'hidden' : ''}`}>{Math.floor(power)}/{MAX_PULSAR_POWER}</div>
            </div>
            <button 
                className={`pulsar-activate-button ${isArmed ? 'armed' : ''} ${showButton ? 'visible' : ''}`} 
                onClick={onActivate} 
                disabled={!isClickable}
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>{isArmed ? 'ARMADO' : 'ACTIVAR'}</span>
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
        <header className={`player-ui-container ${isReversed ? 'reversed' : ''}`} style={{'--team-color': teamColor} as React.CSSProperties}>
             <style>{`
                @keyframes score-pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                .player-ui-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 64px;
                    width: 100%;
                    position: relative;
                    z-index: 10;
                    padding: 0 1rem;
                    flex-shrink: 0;
                    transition: height 0.3s ease;
                }
                
                .ui-content-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    max-width: 900px;
                    height: 48px;
                    padding: 0 1rem;
                    gap: 1rem;
                    background: var(--color-bg-glass);
                    border: 1px solid var(--color-border-glass);
                    border-radius: 12px;
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    transition: height 0.3s ease;
                }
                .player-ui-container.reversed .ui-content-wrapper {
                    flex-direction: row-reverse;
                }
                .ui-content-wrapper::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 12px;
                    border: 2px solid var(--team-color);
                    opacity: 0;
                    transition: opacity 0.4s ease-in-out;
                    box-shadow: 0 0 15px var(--team-color), inset 0 0 8px var(--team-color);
                    pointer-events: none;
                }
                .ui-content-wrapper.active-turn::before {
                    opacity: 1;
                    animation: strong-breathe 2s infinite ease-in-out;
                }
                
                .score-display { 
                    font-size: 2.5rem; 
                    font-weight: 900; 
                    line-height: 1; 
                    color: var(--team-color); 
                    text-shadow: 0 0 10px var(--team-color); 
                    width: 60px;
                    text-align: center;
                }
                .score-display.pop {
                    animation: score-pop 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }
                
                .center-hub {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .player-ui-container.reversed .center-hub {
                    flex-direction: row-reverse;
                }
                
                .team-identifier { display: flex; align-items: center; gap: 0.75rem; }
                .team-icon { width: 12px; height: 12px; background-color: var(--team-color); border-radius: 50%; box-shadow: 0 0 8px var(--team-color); }
                .special-shot-status { display: flex; align-items: center; gap: 0.5rem; opacity: 0.7; }
                .special-shot-status .crown-icon.none { color: var(--color-text-dark); }
                .special-shot-status .crown-icon.royal { color: ${UI_COLORS.GOLD}; filter: drop-shadow(0 0 5px ${UI_COLORS.GOLD}); animation: strong-breathe 2s infinite ease-in-out; }
                .special-shot-status .crown-icon.ultimate { color: white; animation: ultimate-glow-pulse 2s infinite; }
                @keyframes ultimate-glow-pulse { 50% { filter: drop-shadow(0 0 8px #00f6ff); color: #00f6ff; } }

                .pulsar-bar-container { position: relative; display: flex; align-items: center; height: 30px; }
                .pulsar-bar-background { width: 250px; height: 14px; background: rgba(0,0,0,0.4); border-radius: 7px; position: relative; border: 1px solid var(--color-border); }
                .pulsar-bar-text { position: absolute; inset: 0; text-align: center; font-size: 0.7rem; font-weight: 700; color: white; text-shadow: 0 1px 2px black; line-height: 14px; transition: opacity 0.2s ease; z-index: 2; }
                .pulsar-bar-text.hidden { opacity: 0; }

                .pulsar-bar-segments { display: flex; position: absolute; inset: 1px; gap: 1px; }
                .segment { flex: 1; background-color: transparent; transition: background-color 0.3s ease; }
                .segment.active { background-color: var(--team-color); }
                .pulsar-bar-background:has(.segment:last-child.active) .segment.active { animation: pulse-glow 1.5s infinite ease-in-out; }
                @keyframes pulse-glow { 50% { filter: brightness(1.7); box-shadow: 0 0 8px var(--team-color); } }

                .pulsar-activate-button {
                    position: absolute; left: 50%; top: 50%;
                    transform: translate(-50%, -50%) scale(0.8); opacity: 0; pointer-events: none;
                    transition: all 0.2s ease-out;
                    display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 1rem; 
                    font-size: 0.8rem; font-weight: 800; border-radius: 20px; cursor: pointer; 
                    background: var(--glow-green); color: white; border: 1px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px var(--glow-green);
                    white-space: nowrap;
                }
                .pulsar-activate-button.visible { transform: translate(-50%, -50%) scale(1); opacity: 1; pointer-events: auto; }
                .pulsar-activate-button.visible:not(:disabled):hover { transform: translate(-50%, -50%) scale(1.05); }
                .pulsar-activate-button.armed { background: var(--color-bg-light); border-color: var(--color-border); box-shadow: none; }
                .pulsar-activate-button:disabled { cursor: not-allowed; }

                .help-button { 
                    background: none; border: 1px solid var(--color-border-glass); 
                    color: var(--color-text-medium); width: 32px; height: 32px; 
                    border-radius: 50%; cursor: pointer; display: flex; 
                    align-items: center; justify-content: center; 
                    transition: all 0.2s ease; flex-shrink: 0;
                }
                .help-button svg { width: 18px; height: 18px; }
                .help-button:hover { background: var(--color-bg-light); color: white; transform: scale(1.1); }
                
                @media (max-width: 768px) {
                    .ui-content-wrapper { max-width: 100%; gap: 0.5rem; padding: 0 0.5rem; }
                    .score-display { font-size: 2rem; width: 40px;}
                    .center-hub { gap: 0.5rem; }
                    .pulsar-bar-background { width: 150px; }
                }
                 @media (max-width: 480px) {
                    .pulsar-bar-background { display: none; }
                    .pulsar-activate-button { position: static; transform: none; opacity: 1; pointer-events: auto; }
                    .pulsar-activate-button:not(.visible) { display: none; }
                    .team-identifier { display: none; }
                }
                
                /* Compact mode for short screens (landscape phones) */
                @media (max-height: 500px) {
                    .player-ui-container { height: 48px; padding: 0 0.5rem; }
                    .ui-content-wrapper { height: 36px; padding: 0 0.5rem; }
                    .score-display { font-size: 1.5rem; width: 30px; }
                    .pulsar-bar-container { height: 24px; }
                    .pulsar-bar-background { height: 10px; width: 120px; }
                    .pulsar-activate-button { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
                    .help-button { width: 24px; height: 24px; }
                    .help-button svg { width: 14px; height: 14px; }
                    .center-hub { gap: 0.5rem; }
                }
            `}</style>
            <div className={`ui-content-wrapper ${isMyTurn ? 'active-turn' : ''}`}>
                <div className={`score-display ${scoreShouldPop ? 'pop' : ''}`}>{score}</div>

                <div className="center-hub">
                    <PulsarBar 
                        power={pulsarPower} 
                        team={team} 
                        onActivate={onActivatePulsar} 
                        isArmed={isPulsarArmed} 
                        canActivate={canActivatePulsar} 
                    />
                    <div className="team-identifier">
                        <div className="special-shot-status">
                            <CrownIcon status={specialShotStatus} />
                        </div>
                    </div>
                </div>

                <button className="help-button" onClick={onHelpClick} aria-label="Ayuda e Información">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </button>
            </div>
        </header>
    );
}

export default PlayerUI;