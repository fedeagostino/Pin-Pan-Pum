import React, { useState, useEffect } from 'react';
import { Team } from '../types';

interface BonusTurnIndicatorProps {
    team: Team | null;
}

const BonusTurnIndicator: React.FC<BonusTurnIndicatorProps> = ({ team }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        if (team) {
            // A new bonus turn is active. Update the team and schedule the fade-in.
            setActiveTeam(team);
            timer = setTimeout(() => {
                setIsVisible(true);
            }, 150); // 150ms delay
        } else {
            // The bonus turn is over. Just hide the indicator.
            // activeTeam persists to ensure the fade-out happens from the correct position.
            setIsVisible(false);
        }

        return () => {
            // Cleanup: if the component unmounts or `team` changes before the timer fires,
            // clear the timer to prevent the indicator from appearing incorrectly.
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [team]);
    
    // Don't render anything until a bonus turn has been triggered at least once.
    if (!activeTeam) {
        return null;
    }

    // The wrapper class now uses `activeTeam` for positioning and `isVisible` for the animation trigger.
    const wrapperClass = `bonus-turn-indicator-wrapper ${isVisible ? 'active' : ''} ${activeTeam === 'BLUE' ? 'blue-team' : 'red-team'}`;

    return (
        <div className={wrapperClass}>
            <style>{`
                .bonus-turn-indicator-wrapper {
                    position: absolute;
                    left: 50%;
                    z-index: 5;
                    pointer-events: none;
                    opacity: 0;
                    /* Separate transitions for opacity (fade) and transform (slide) */
                    transition: opacity 0.3s ease-out, transform 0.4s cubic-bezier(0.2, 1, 0.4, 1);
                }
                
                /* Blue team (top player) is positioned at the top */
                .bonus-turn-indicator-wrapper.blue-team {
                    top: 52px; /* Height of PlayerUI */
                    transform: translateX(-50%) translateY(-100%); /* Start hidden above UI */
                }
                
                /* Red team (bottom player) is positioned at the bottom */
                .bonus-turn-indicator-wrapper.red-team {
                    bottom: 52px; /* Height of PlayerUI */
                    transform: translateX(-50%) translateY(100%); /* Start hidden below UI */
                }

                /* When active, slide into view and become visible */
                .bonus-turn-indicator-wrapper.active {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                
                .bonus-turn-indicator-bar {
                    position: relative;
                    background: linear-gradient(to top, #31c448, var(--color-accent-green));
                    color: white;
                    padding: 0.35rem 2rem;
                    font-size: 1rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
                    box-shadow: 0 4px 20px rgba(57, 211, 83, 0.5), inset 0 1px 1px rgba(255,255,255,0.2);
                    white-space: nowrap;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                .bonus-turn-indicator-wrapper.red-team .bonus-turn-indicator-bar {
                    border-radius: 0 0 12px 12px;
                    border-top: none;
                }
                 .bonus-turn-indicator-wrapper.blue-team .bonus-turn-indicator-bar {
                    border-radius: 12px 12px 0 0;
                    border-bottom: none;
                }

                .bonus-turn-indicator-bar::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 20px solid transparent;
                    border-right: 20px solid transparent;
                }
                 .bonus-turn-indicator-wrapper.red-team .bonus-turn-indicator-bar::after {
                    bottom: -15px; /* Height of the chevron */
                    border-top: 15px solid var(--color-accent-green);
                    filter: brightness(0.9);
                }
                .bonus-turn-indicator-wrapper.blue-team .bonus-turn-indicator-bar::after {
                    top: -15px; /* Height of the chevron */
                    border-bottom: 15px solid var(--color-accent-green);
                    filter: brightness(0.9);
                }

            `}</style>
            <div className="bonus-turn-indicator-bar">
                ¡TURNO EXTRA!
            </div>
        </div>
    );
};

export default BonusTurnIndicator;