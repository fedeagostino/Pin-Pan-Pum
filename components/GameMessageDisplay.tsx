import React from 'react';
import { UI_COLORS, SYNERGY_EFFECTS } from '../constants';
import { SynergyType } from '../types';

interface GameMessageDisplayProps {
    message: {
        text: string;
        type: 'royal' | 'ultimate' | 'synergy' | 'powerup';
        synergyType?: SynergyType;
        id: number;
    } | null;
}

const GameMessageDisplay: React.FC<GameMessageDisplayProps> = ({ message }) => {
    if (!message) {
        return null;
    }

    const { text, type, synergyType, id } = message;

    let bannerStyle: React.CSSProperties = {};

    switch(type) {
        case 'royal':
            bannerStyle = { backgroundColor: UI_COLORS.GOLD, color: UI_COLORS.TEXT_DARK };
            break;
        case 'ultimate':
             bannerStyle = { background: 'linear-gradient(90deg, #E53935, #FDD835, #43A047, #1E88E5, #E53935)', color: 'white', ['--animationName' as any]: 'rainbow-bg' };
            break;
        case 'synergy':
            if (synergyType) {
                const color = SYNERGY_EFFECTS[synergyType].color;
                bannerStyle = { backgroundColor: color, color: 'white' };
            }
            break;
        case 'powerup':
            bannerStyle = { backgroundColor: UI_COLORS.ACCENT_GREEN, color: 'white' };
            break;
    }
    
    // By keying the entire container with the message ID, we ensure the component
    // fully re-mounts for each new message, which guarantees the animation restarts correctly.
    return (
        <div key={id} className="game-message-overlay">
             <style>{`
                .game-message-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 110;
                    pointer-events: none;
                    overflow: hidden;
                }
                .game-message-banner {
                    font-family: var(--font-family-main);
                    padding: 1rem 3rem;
                    font-size: 2.5rem;
                    font-weight: 400;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    -webkit-text-stroke: 2px var(--color-shadow-main);
                    text-stroke: 2px var(--color-shadow-main);
                    border: 4px solid var(--color-shadow-main);
                    border-radius: 12px;
                    box-shadow: 0 6px 0 0 var(--color-shadow-main);
                    white-space: nowrap;
                    animation: message-pop-in 2.5s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards, var(--animationName, none) 4s linear infinite;
                    background-size: 200% 200%;
                }
                @keyframes message-pop-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    20% { transform: scale(1.1); opacity: 1; }
                    35% { transform: scale(1.0); }
                    80% { transform: scale(1.0); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                @keyframes rainbow-bg {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                 @media (max-width: 640px) {
                    .game-message-banner { font-size: 1.5rem; padding: 0.75rem 1.5rem; }
                 }
            `}</style>
             <div className="game-message-banner" style={bannerStyle}>
                <span>{text}</span>
            </div>
        </div>
    );
};

export default GameMessageDisplay;