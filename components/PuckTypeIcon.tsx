
import React from 'react';
import { PuckType, Team } from '../types';
import { TEAM_COLORS } from '../constants';

interface PuckTypeIconProps {
    puckType: PuckType;
    teamColor?: string;
    team?: Team;
    className?: string;
}

const PuckTypeIcon: React.FC<PuckTypeIconProps> = ({ puckType, teamColor, team, className }) => {
    const effectiveTeam = team || (teamColor === TEAM_COLORS.RED ? 'RED' : 'BLUE');

    // RED TEAM (VILLAINS)
    const renderRedDemogorgon = () => (
        <g>
            <circle r="18" fill="#2d1a1a" />
            {[0, 72, 144, 216, 288].map(angle => (
                <path 
                    key={angle}
                    d="M 0 -4 Q 8 -18 0 -22 Q -8 -18 0 -4" 
                    fill="#6b1a1a" 
                    transform={`rotate(${angle})`}
                />
            ))}
            <circle r="4" fill="#000" />
        </g>
    );

    const renderRedVecna = () => (
        <g>
            <circle r="19" fill="#3a0a0a" stroke="#7f1d1d" strokeWidth="2" />
            <circle cx="-6" cy="-2" r="3" fill="#e2e8f0" />
            <circle cx="6" cy="-2" r="3" fill="#e2e8f0" />
            <path d="M -10 10 L 10 10" stroke="#000" strokeWidth="1" opacity="0.4" />
        </g>
    );

    const renderRedMindFlayer = () => (
        <g>
            <circle r="8" fill="#000" />
            {[0, 90, 180, 270].map(angle => (
                <path 
                    key={angle}
                    d="M 0 0 Q 15 -10 20 5" 
                    transform={`rotate(${angle})`} 
                    fill="none" 
                    stroke="#1a1a1a" 
                    strokeWidth="2" 
                />
            ))}
            <circle r="3" fill="#ff0000" />
        </g>
    );

    // BLUE TEAM (HEROES) - SKIN IMPROVEMENTS
    const renderEleven = () => (
        <g>
            {/* Aura Background */}
            <circle r="22" fill="rgba(0, 212, 255, 0.15)" />
            {/* Face/Skin */}
            <circle r="19" fill="#fce7f3" stroke="#f472b6" strokeWidth="1" />
            {/* Shaved Head Texture */}
            <path d="M -15 -5 Q 0 -22 15 -5" fill="none" stroke="#4e342e" strokeWidth="4" strokeDasharray="1 3" opacity="0.5" />
            {/* Eyes */}
            <circle cx="-6" cy="2" r="2.5" fill="#111" />
            <circle cx="6" cy="2" r="2.5" fill="#111" />
            {/* Nosebleed */}
            <path d="M -1 8 L -1 16" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" />
        </g>
    );

    const renderMax = () => (
        <g>
            {/* Red Hair */}
            <circle r="19" fill="#d35400" />
            {/* Face */}
            <path d="M -14 0 C -14 -18, 14 -18, 14 0 L 14 10 Q 0 15 -14 10 Z" fill="#fce7f3" />
            {/* Blue Headphones */}
            <rect x="-21" y="-8" width="8" height="15" rx="2" fill="#00d4ff" stroke="#00a3cc" strokeWidth="1" />
            <rect x="13" y="-8" width="8" height="15" rx="2" fill="#00d4ff" stroke="#00a3cc" strokeWidth="1" />
            <path d="M -15 -8 A 15 15 0 0 1 15 -8" fill="none" stroke="#00a3cc" strokeWidth="3" />
        </g>
    );

    const renderDustin = () => (
        <g>
            <circle r="19" fill="#5d4037" />
            {/* Hat - 4 Colors */}
            <path d="M -18 -2 Q 0 -26 18 -2" fill="#15803d" /> {/* Green */}
            <rect x="-13" y="-20" width="26" height="8" fill="#fef08a" /> {/* Yellow */}
            <rect x="-13" y="-12" width="26" height="4" fill="#ffffff" /> {/* White */}
            <path d="M -18 0 Q -22 15 -5 15" fill="none" stroke="#3e2723" strokeWidth="5" strokeLinecap="round" />
            <path d="M 18 0 Q 22 15 5 15" fill="none" stroke="#3e2723" strokeWidth="5" strokeLinecap="round" />
        </g>
    );

    const renderLucas = () => (
        <g>
            <circle r="19" fill="#3a251e" />
            {/* Camo Bandana */}
            <rect x="-20" y="-13" width="40" height="9" fill="#14532d" />
            <path d="M -20 -9 L 20 -9" stroke="#000" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="-6" cy="4" r="2" fill="#111" />
            <circle cx="6" cy="4" r="2" fill="#111" />
        </g>
    );

    const shape = (() => {
        if (effectiveTeam === 'RED') {
            switch (puckType) {
                case 'KING': return renderRedVecna();
                case 'FAST': 
                case 'PAWN': return renderRedDemogorgon();
                case 'GHOST': return renderRedMindFlayer();
                default: return <circle r="18" fill="#1a0a0a" stroke="#ff0000" strokeWidth="2" />;
            }
        }

        switch (puckType) {
            case 'KING': return renderEleven();
            case 'GHOST': return renderMax();
            case 'FAST': return renderDustin();
            case 'HEAVY': return renderLucas();
            case 'STANDARD':
                return (
                    <g>
                        <circle r="19" fill="#2d1d19" />
                        <path d="M -16 2 C -16 -20, 16 -20, 16 2 L 16 10 Q 0 14 -16 10 Z" fill="#111" />
                        <circle cx="-6" cy="8" r="2" fill="#111" />
                        <circle cx="6" cy="8" r="2" fill="#111" />
                    </g>
                );
            case 'PAWN':
            case 'DAMPENER':
                return (
                    <g>
                        <circle r="17" fill="#4e342e" />
                        <path d="M -14 0 C -14 -18, 14 -18, 14 0 L 14 8 Q 0 12 -14 8 Z" fill="#2d1d19" opacity="0.9" />
                        <circle cx="-5" cy="5" r="2" fill="#111" />
                        <circle cx="5" cy="5" r="2" fill="#111" />
                    </g>
                );
            default:
                return <circle r="20" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />;
        }
    })();

    return (
        <svg viewBox="-28 -28 56 56" className={className}>
            {shape}
        </svg>
    );
};

export default PuckTypeIcon;
