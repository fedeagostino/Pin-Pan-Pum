
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
    const canActivatePulsar = !gameState.isSimulating && gameState.canShoot && gameState.currentTurn === team;
    const isMyTurn = gameState.currentTurn === team && gameState.canShoot && !gameState.isSimulating;

    return (
        <header className={`player-ui-container ${isReversed ? 'reversed' : ''}`} style={{'--team-color': teamColor} as React.CSSProperties}>
             <style>{`
                .player-ui-container { display: flex; justify-content: center; align-items: center; height: 64px; width: 100%; z-index: 10; padding: 0 1rem; }
                .ui-content-wrapper { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 900px; height: 48px; padding: 0 1rem; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,0,0,0.3); border-radius: 4px; position: relative; }
                .ui-content-wrapper.active-turn { border-color: #ff0000; box-shadow: 0 0 15px #ff0000; }
                .score-display { font-size: 2.5rem; font-weight: 900; color: var(--team-color); text-shadow: 0 0 10px var(--team-color); }
                .pulsar-btn { background: #ff0000; color: black; border: none; padding: 0.4rem 1rem; border-radius: 2px; font-family: var(--font-family-title); cursor: pointer; }
                .pulsar-btn:disabled { opacity: 0.3; }
                .help-button { background: none; border: 1px solid #333; color: #666; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; }
            `}</style>
            <div className={`ui-content-wrapper ${isMyTurn ? 'active-turn' : ''}`}>
                <div className="score-display">{score}</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{Math.floor(pulsarPower)}/{MAX_PULSAR_POWER}</span>
                    <button 
                        className="pulsar-btn" 
                        onClick={onActivatePulsar} 
                        disabled={!canActivatePulsar && !isPulsarArmed}
                    >
                        {isPulsarArmed ? (lang === 'es' ? 'ARMADO' : 'ARMED') : (lang === 'es' ? 'ACTIVAR' : 'ACTIVATE')}
                    </button>
                </div>
                <button className="help-button" onClick={onHelpClick}>?</button>
            </div>
        </header>
    );
}

export default PlayerUI;
