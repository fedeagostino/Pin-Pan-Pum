import React, { useState, useEffect } from 'react';
import { UI_COLORS, SYNERGY_EFFECTS } from '../constants';
import { SynergyType } from '../types';

interface GameMessageDisplayProps {
    message: {
        text: string;
        type: 'royal' | 'ultimate' | 'synergy' | 'powerup';
        synergyType?: SynergyType;
    } | null;
}

const GameMessageDisplay: React.FC<GameMessageDisplayProps> = ({ message }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentMessage, setCurrentMessage] = useState(message);

    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [message]);

    if (!currentMessage) return null;

    const { text, type, synergyType } = currentMessage;

    let bannerClass = 'game-message-banner';
    let bannerStyle: React.CSSProperties = {};
    let textStyle: React.CSSProperties = {};

    switch(type) {
        case 'royal':
            bannerStyle = { backgroundColor: UI_COLORS.GOLD, borderColor: '#fffadd' };
            textStyle = { color: 'black' };
            break;
        case 'ultimate':
            bannerClass += ' ultimate';
            textStyle = { color: 'white' };
            break;
        case 'synergy':
            if (synergyType) {
                const color = SYNERGY_EFFECTS[synergyType].color;
                bannerStyle = { 
                    backgroundColor: color,
                    borderColor: 'white',
                    boxShadow: `0 0 25px ${color}, 0 0 40px ${color}`
                };
                textStyle = { color: 'white' };
            }
            break;
        case 'powerup':
            bannerStyle = {
                backgroundColor: UI_COLORS.ACCENT_GREEN,
                borderColor: 'white',
                boxShadow: `0 0 25px ${UI_COLORS.ACCENT_GREEN}, 0 0 40px ${UI_COLORS.ACCENT_GREEN}`
            };
            textStyle = { color: 'white' };
            break;
    }
    
    const BannerContent = () => (
        <div className={bannerClass} style={bannerStyle}>
            <span style={textStyle}>{text}</span>
        </div>
    );


    return (
        <div className={`game-message-overlay ${isVisible ? 'visible' : ''}`}>
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
                    opacity: 0;
                    transition: opacity 0.3s ease-out;
                }
                .game-message-overlay.visible {
                    opacity: 1;
                }
                .game-message-banner {
                    padding: 0.75rem 3rem;
                    color: white;
                    font-size: 2.5rem;
                    font-weight: 900;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-shadow: 2px 2px 5px rgba(0,0,0,0.6);
                    box-shadow: 0 0 25px rgba(0,0,0,0.5);
                    border: 3px solid;
                    white-space: nowrap;
                    animation: message-pop-in 2.5s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards;
                }
                 .game-message-banner.ultimate {
                    background: linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #ff00ff, #ff0000);
                    background-size: 200% 200%;
                    border-color: white;
                    animation: message-pop-in 2.5s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards, rainbow-bg 4s linear infinite;
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
             `}</style>
             <BannerContent />
        </div>
    );
};

export default GameMessageDisplay;