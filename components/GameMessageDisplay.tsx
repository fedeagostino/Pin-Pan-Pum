
import React from 'react';
import { TRANSLATIONS, Language, SYNERGY_EFFECTS } from '../constants';
import { SynergyType } from '../types';

interface GameMessageDisplayProps {
    message: {
        text: string;
        type: 'royal' | 'ultimate' | 'synergy' | 'powerup';
        synergyType?: SynergyType;
    } | null;
    lang: Language;
}

const GameMessageDisplay: React.FC<GameMessageDisplayProps> = ({ message, lang }) => {
    if (!message) return null;
    const t = TRANSLATIONS[lang];

    let localizedText = message.text;
    if (message.type === 'royal') localizedText = t.ROYAL_UNLOCKED;
    if (message.type === 'ultimate') localizedText = t.ULTIMATE_UNLOCKED;
    if (message.type === 'powerup' && message.text.includes('SOBRECARGA')) localizedText = t.OVERCHARGE;
    if (message.type === 'synergy' && message.synergyType) localizedText = `${t.SYNERGY_INFO[message.synergyType].name} ${t.SYNERGY_ACT}`;

    const color = message.synergyType ? SYNERGY_EFFECTS[message.synergyType].color : '#ff0000';

    return (
        <div className="game-message-overlay visible">
             <style>{`
                .game-message-overlay {
                    position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 110; pointer-events: none;
                }
                .game-message-banner {
                    padding: 1rem 3rem; background: black; border: 2px solid ${color};
                    font-family: var(--font-family-title); font-size: 2.5rem; color: ${color};
                    text-shadow: 0 0 15px ${color}; box-shadow: 0 0 30px rgba(0,0,0,0.8);
                    animation: message-pop-in 2.5s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards;
                }
             `}</style>
             <div className="game-message-banner">
                <span>{localizedText}</span>
             </div>
        </div>
    );
};

export default GameMessageDisplay;
