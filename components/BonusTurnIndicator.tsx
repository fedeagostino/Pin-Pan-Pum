
import React from 'react';
import { Team } from '../types';
import { Language, TRANSLATIONS, TEAM_COLORS } from '../constants';

interface BonusTurnIndicatorProps {
    team: Team | null;
    lang: Language;
}

const BonusTurnIndicator: React.FC<BonusTurnIndicatorProps> = ({ team, lang }) => {
    if (!team) return null;
    const t = TRANSLATIONS[lang];
    const color = TEAM_COLORS[team];

    return (
        <div className={`bonus-turn-indicator-wrapper ${team === 'BLUE' ? 'blue-team' : 'red-team'}`}>
            <style>{`
                @keyframes bonus-pop-sequence {
                    0% { transform: translate(-50%, 20px) scale(0.5); opacity: 0; }
                    15% { transform: translate(-50%, 0) scale(1.1); opacity: 1; }
                    25% { transform: translate(-50%, 0) scale(1); }
                    80% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -30px) scale(0.8); opacity: 0; }
                }

                .bonus-turn-indicator-wrapper { 
                    position: absolute; 
                    left: 50%; 
                    z-index: 1500; 
                    pointer-events: none; 
                    animation: bonus-pop-sequence 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .bonus-turn-indicator-wrapper.blue-team { top: 100px; }
                .bonus-turn-indicator-wrapper.red-team { bottom: 100px; }

                .bonus-turn-bar { 
                    background: #000; 
                    color: ${color}; 
                    padding: 0.8rem 2.5rem; 
                    font-family: var(--font-family-title); 
                    font-size: 2rem;
                    border: 3px solid ${color};
                    box-shadow: 0 0 25px ${color}, inset 0 0 10px ${color}66;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    white-space: nowrap;
                }
            `}</style>
            <div className="bonus-turn-bar">
                {t.EXTRA_TURN}
            </div>
        </div>
    );
};

export default BonusTurnIndicator;
