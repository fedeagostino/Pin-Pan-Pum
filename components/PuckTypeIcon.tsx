
import React from 'react';
import { PuckType, Team } from '../types';
import { UI_COLORS, TEAM_COLORS } from '../constants';

interface PuckTypeIconProps {
    puckType: PuckType;
    teamColor?: string;
    team?: Team;
    className?: string;
}

const PuckTypeIcon: React.FC<PuckTypeIconProps> = ({ puckType, teamColor, team, className }) => {
    const effectiveTeam = team || (teamColor === TEAM_COLORS.RED ? 'RED' : 'BLUE');

    const pathProps = {
        strokeWidth: 2,
        strokeLinejoin: 'round' as const,
        vectorEffect: "non-scaling-stroke" as const,
    };

    const renderSteveHair = (scale: number = 1) => (
        <g transform={`scale(${scale}) translate(0, -5)`}>
            {/* The legendary Steve Harrington Pompadour */}
            <path 
                d="M -15 0 C -15 -15, -10 -22, 0 -22 C 10 -22, 15 -15, 15 0 C 15 5, 10 8, 0 8 C -10 8, -15 5, -15 0" 
                fill="#5d4037" 
                stroke="#3e2723" 
                strokeWidth="1"
            />
            {/* Highlights */}
            <path 
                d="M -8 -15 Q 0 -18 8 -15" 
                fill="none" 
                stroke="#8d6e63" 
                strokeWidth="2" 
                strokeLinecap="round"
                opacity="0.6"
            />
        </g>
    );

    const renderWalkieTalkie = (scale: number = 1) => (
        <g transform={`scale(${scale})`}>
            {/* Walkie Talkie Body */}
            <rect x="-10" y="-14" width="20" height="28" rx="2" fill="#2d3748" stroke="#1a202c" strokeWidth="1.5" />
            {/* Antenna */}
            <rect x="-7" y="-24" width="3" height="11" fill="#1a202c" rx="1" />
            {/* Speaker Grill */}
            <g transform="translate(0, 2)">
                <line x1="-6" y1="-6" x2="6" y2="-6" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-6" y1="-3" x2="6" y2="-3" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-6" y1="3" x2="6" y2="3" stroke="#1a202c" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            {/* Dial/Button */}
            <circle cx="6" cy="-14" r="2.5" fill="#111" />
            {/* Small LED (Active) */}
            <circle cx="6" cy="-8" r="1" fill="#ff0000" opacity="0.8" />
        </g>
    );

    const shape = (() => {
        const isSteveType = effectiveTeam === 'BLUE' && ['STANDARD', 'HEAVY', 'FAST'].includes(puckType);

        switch (puckType) {
            case 'KING':
                if (effectiveTeam === 'BLUE') {
                    return (
                        <g>
                            <circle r="20" fill="#fcd9cc" stroke="#d9b8ad" strokeWidth="2" />
                            <circle r="18" fill="#e0c2b8" opacity="0.3" />
                            <circle cx="-6" cy="-4" r="1.5" fill="#333" />
                            <circle cx="6" cy="-4" r="1.5" fill="#333" />
                            <path d="M 0 3 L 0 10" stroke="#ff0000" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="0" cy="11" r="1.5" fill="#ff0000" />
                        </g>
                    );
                } else {
                    return (
                        <g>
                            <path d="M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z" fill="#4a0000" stroke="#000" {...pathProps} />
                            <rect x="-8" y="-5" width="4" height="4" fill="#ff0000" />
                            <rect x="4" y="-5" width="4" height="4" fill="#ff0000" />
                            <path d="M -5 10 Q 0 15 5 10" fill="none" stroke="#000" strokeWidth="2" />
                        </g>
                    );
                }
            case 'HEAVY':
                return (
                    <g>
                        <path d="M 20 0 L 10 17.32 L -10 17.32 L -20 0 L -10 -17.32 L 10 -17.32 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />
                        {isSteveType && renderSteveHair(0.85)}
                    </g>
                );
            case 'ANCHOR':
                return <path d="M 0 -20 L 20 0 L 0 20 L -20 0 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'DAMPENER':
                return <path d="M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'FAST':
                if (effectiveTeam === 'RED') {
                    return (
                        <g>
                            <path d="M 0 -22 L 6 -12 L 20 -15 L 12 -4 L 18 10 L 0 5 L -18 10 L -12 -4 L -20 -15 L -6 -12 Z" fill="#5c0000" stroke="#2a0000" strokeWidth="2" />
                            <rect x="-4" y="-4" width="8" height="8" fill="#ff0000" opacity="0.8" />
                            <rect x="-1" y="-10" width="2" height="2" fill="white" />
                            <rect x="-1" y="8" width="2" height="2" fill="white" />
                            <rect x="-10" y="-1" width="2" height="2" fill="white" />
                            <rect x="8" y="-1" width="2" height="2" fill="white" />
                        </g>
                    );
                } else {
                    return (
                        <g>
                            <circle r="20" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />
                            {renderSteveHair(1)}
                        </g>
                    );
                }
            case 'GHOST':
                return <path d="M 0 -20 C 14.4 -24.8, 24.8 0, 10 18 S -20 24.8, -15 -10 S 10 10, 0 -20 Z" fill="#dbeafe" stroke="#93c5fd" {...pathProps} />;
            case 'SWERVE':
                return <path d="M 0 -18 A 9 9 0 0 1 0 0 A 9 9 0 0 0 0 18 A 18 18 0 0 1 0 -18 Z" fill="#c084fc" stroke="#a855f7" {...pathProps} />;
            case 'BOUNCER':
                return <circle r="20" fill="#fde047" stroke="#facc15" strokeWidth="2" />;
            case 'PAWN':
                 if (effectiveTeam === 'BLUE') {
                     return renderWalkieTalkie(1.2);
                 }
                 return <path d="M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z" fill="#6b7280" stroke="#374151" {...pathProps} transform="scale(1.2)"/>;
            case 'STANDARD':
            default:
                return (
                    <g>
                        <circle r="20" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />
                        {isSteveType && renderSteveHair(1)}
                    </g>
                );
        }
    })();

    return (
        <svg viewBox="-25 -25 50 50" className={className}>
            {shape}
        </svg>
    );
};

export default PuckTypeIcon;
