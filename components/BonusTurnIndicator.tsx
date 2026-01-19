
import React from 'react';
import { Team } from '../types';
import { Language, TRANSLATIONS } from '../constants';

interface BonusTurnIndicatorProps {
    team: Team | null;
    lang: Language;
}

const BonusTurnIndicator: React.FC<BonusTurnIndicatorProps> = ({ team, lang }) => {
    if (!team) return null;
    const t = TRANSLATIONS[lang];

    return (
        <div className={`bonus-turn-indicator-wrapper active ${team === 'BLUE' ? 'blue-team' : 'red-team'}`}>
            <style>{`
                .bonus-turn-indicator-wrapper { position: absolute; left: 50%; z-index: 5; pointer-events: none; }
                .bonus-turn-indicator-wrapper.blue-team { top: 70px; transform: translateX(-50%); }
                .bonus-turn-indicator-wrapper.red-team { bottom: 70px; transform: translateX(-50%); }
                .bonus-turn-bar { 
                    background: #ff0000; color: black; padding: 0.5rem 2rem; 
                    font-family: var(--font-family-title); font-size: 1.2rem;
                    box-shadow: 0 0 15px #ff0000;
                }
            `}</style>
            <div className="bonus-turn-bar">
                {t.EXTRA_TURN}
            </div>
        </div>
    );
};

export default BonusTurnIndicator;
