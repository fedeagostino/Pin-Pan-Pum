import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { TEAM_COLORS } from '../constants';

interface GameCommentaryProps {
    text: string;
    team: Team;
    position: 'left' | 'right';
    componentKey: number;
}

const GameCommentary: React.FC<GameCommentaryProps> = ({ text, team, position, componentKey }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (text) {
            setShow(true); // Fade in when text appears
        } else {
            setShow(false); // Fade out when text is cleared
        }
    }, [text, componentKey]);

    const teamColor = TEAM_COLORS[team];
    const isReversed = team === 'BLUE'; 

    const finalTransform = show ? 'translateY(0)' : 'translateY(20px)';
    const finalRotation = isReversed ? ' rotate(180deg)' : '';

    const containerStyle: React.CSSProperties = {
        transform: `${finalTransform}${finalRotation}`,
        opacity: show ? 1 : 0,
    };
    
    const commentaryBoxStyle: React.CSSProperties = {
        borderColor: teamColor,
        boxShadow: `0 0 15px ${teamColor}, inset 0 0 8px ${teamColor}33`,
    };

    if (!show && !text) {
      return null;
    }
    
    return (
        <div className={`commentary-container ${isReversed ? 'reversed' : ''} ${position}`} style={containerStyle}>
            <style>{`
                .commentary-container {
                    width: 200px;
                    z-index: 20;
                    transition: opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    position: absolute;
                    bottom: 1rem;
                    pointer-events: none;
                }
                .commentary-container.left { left: 1rem; }
                .commentary-container.right { right: 1rem; }

                .commentary-container.reversed { bottom: auto; top: 1rem; }

                .commentary-box {
                    background: rgba(var(--color-shadow-main-rgb), 0.75);
                    border: 2px solid;
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                    line-height: 1.4;
                    min-height: 70px;
                }
                .commentary-text::after {
                    content: '▋';
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    50% { opacity: 0; }
                }
                 @media (max-width: 1200px) {
                    .commentary-container {
                        display: none;
                    }
                }
            `}</style>
            <div className="commentary-box" style={commentaryBoxStyle}>
                <p className="commentary-text">{text}</p>
            </div>
        </div>
    );
};

export default GameCommentary;