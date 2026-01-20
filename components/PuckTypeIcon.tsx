
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

    const renderSteveProfile = (scale: number = 1) => {
        const nailAngles = [0, 60, 120, 180, 240, 300];
        return (
            <g transform={`scale(${scale})`}>
                <circle r="19" fill="#5d4037" stroke="#3e2723" strokeWidth="2" />
                <g>
                    {nailAngles.map(a => (
                        <g key={a} transform={`rotate(${a})`}>
                            <line x1="0" y1="-18" x2="0" y2="-24" stroke="#94a3b8" strokeWidth="2.5" />
                            <circle cx="0" cy="-24" r="1.5" fill="#cbd5e1" />
                        </g>
                    ))}
                </g>
                <g transform="translate(0, -5)">
                    <path 
                        d="M -15 0 C -15 -15, -10 -22, 0 -22 C 10 -22, 15 -15, 15 0 C 15 5, 10 8, 0 8 C -10 8, -15 5, -15 0" 
                        fill="#4e342e" 
                        stroke="#2d1d19" 
                        strokeWidth="1"
                    />
                </g>
            </g>
        );
    };

    const renderMaxine = (scale: number = 1) => (
        <g transform={`scale(${scale})`}>
            <path 
                d="M -16 5 C -16 -15, -12 -22, 0 -22 C 12 -22, 16 -15, 16 5 C 16 12, 10 15, 0 15 C -10 15, -16 12, -16 5" 
                fill="#e67e22" 
                stroke="#d35400" 
                strokeWidth="1"
            />
            <path d="M -14 -5 A 14 14 0 0 1 14 -5" fill="none" stroke="#2c3e50" strokeWidth="3" />
            <rect x="-18" y="-8" width="6" height="12" rx="2" fill="#2c3e50" />
            <rect x="12" y="-8" width="6" height="12" rx="2" fill="#2c3e50" />
        </g>
    );

    const renderWalkieTalkie = (scale: number = 1) => (
        <g transform={`scale(${scale})`}>
            <rect x="-10" y="-14" width="20" height="28" rx="2" fill="#2d3748" stroke="#1a202c" strokeWidth="1.5" />
            <rect x="-7" y="-24" width="3" height="11" fill="#1a202c" rx="1" />
            <circle cx="6" cy="-14" r="2.5" fill="#111" />
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
                            {/* Cuerpo Tono Piel */}
                            <circle r="20" fill="#e0ac69" stroke="#b08d57" strokeWidth="2" />
                            {/* Cabello Rapado con Flequillo */}
                            <path d="M -19 0 A 19 19 0 0 1 19 0 L 19 -8 Q 0 -25 -19 -8 Z" fill="#4e342e" />
                            <path d="M -18 0 Q -14 3 -10 0 Q -5 3 0 0 Q 5 3 10 0 Q 14 3 18 0" fill="#4e342e" />
                            {/* Ojos */}
                            <circle cx="-6" cy="1" r="2.5" fill="#333" />
                            <circle cx="6" cy="1" r="2.5" fill="#333" />
                            {/* Sangre Nariz Descentrada */}
                            <path d="M -2.5 5 L -2.5 12" stroke="#ff0000" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="-2.5" cy="12.5" r="1.5" fill="#ff0000" />
                        </g>
                    );
                } else {
                    return (
                        <g>
                            <path d="M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z" fill="#2a0505" stroke="#000" {...pathProps} />
                            <circle cx="-7" cy="-5" r="3" fill="#ffffff" />
                            <circle cx="7" cy="-5" r="3" fill="#ffffff" />
                        </g>
                    );
                }
            case 'HEAVY':
                return isSteveType ? renderSteveProfile(0.9) : <path d="M 20 0 L 10 17.32 L -10 17.32 L -20 0 L -10 -17.32 L 10 -17.32 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'FAST':
                if (effectiveTeam === 'RED') {
                    return (
                        <g>
                            <path d="M 0 -22 L 6 -12 L 20 -15 L 12 -4 L 18 10 L 0 5 L -18 10 L -12 -4 L -20 -15 L -6 -12 Z" fill="#5c0000" stroke="#2a0000" strokeWidth="2" />
                        </g>
                    );
                } else {
                    return renderSteveProfile(0.9);
                }
            case 'GHOST':
                if (effectiveTeam === 'BLUE') return renderMaxine(1.1);
                return <path d="M 0 -20 C 14.4 -24.8, 24.8 0, 10 18 S -20 24.8, -15 -10 S 10 10, 0 -20 Z" fill="#dbeafe" stroke="#93c5fd" {...pathProps} />;
            case 'PAWN':
                 return effectiveTeam === 'BLUE' ? renderWalkieTalkie(1.2) : <path d="M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z" fill="#6b7280" stroke="#374151" {...pathProps} transform="scale(1.2)"/>;
            case 'STANDARD':
            default:
                return isSteveType ? renderSteveProfile(0.9) : <circle r="20" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />;
        }
    })();

    return (
        <svg viewBox="-28 -28 56 56" className={className}>
            {shape}
        </svg>
    );
};

export default PuckTypeIcon;
