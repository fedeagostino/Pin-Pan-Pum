import React from 'react';
import { PuckType } from '../types';
import { UI_COLORS } from '../constants';

interface PuckTypeIconProps {
    puckType: PuckType;
    teamColor?: string;
    className?: string;
}

const PuckTypeIcon: React.FC<PuckTypeIconProps> = ({ puckType, teamColor, className }) => {
    // Paths are designed to fit in a -20 to 20 viewbox.
    const pathProps = {
        strokeWidth: 2,
        strokeLinejoin: 'round' as const,
        vectorEffect: "non-scaling-stroke" as const,
    };

    const shape = (() => {
        switch (puckType) {
            case 'KING':
                return (
                    <g>
                        <path d="M 0 -20 L 14.1 -14.1 L 20 0 L 14.1 14.1 L 0 20 L -14.1 14.1 L -20 0 L -14.1 -14.1 Z" fill={UI_COLORS.GOLD} stroke="#4c2f00" {...pathProps} />
                        <g transform="scale(1.4)">
                           <path d="M -10 6 L -10 -4 L -5 -8 L 0 -4 L 5 -8 L 10 -4 L 10 6 Z" fill={teamColor || '#fffadd'} stroke={UI_COLORS.GOLD} strokeWidth="1.5" />
                        </g>
                    </g>
                );
            case 'HEAVY': // Hexagon
                return <path d="M 20 0 L 10 17.32 L -10 17.32 L -20 0 L -10 -17.32 L 10 -17.32 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'ANCHOR': // Square
                return <path d="M 0 -20 L 20 0 L 0 20 L -20 0 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'DAMPENER': // Pentagon
                return <path d="M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'FAST':
                return <path d="M 0 -20 L 17.32 10 L -17.32 10 Z" fill="#e5e7eb" stroke="#9ca3af" {...pathProps} />;
            case 'GHOST':
                return <path d="M 0 -20 C 14.4 -24.8, 24.8 0, 10 18 S -20 24.8, -15 -10 S 10 10, 0 -20 Z" fill="#dbeafe" stroke="#93c5fd" {...pathProps} />;
            case 'SWERVE':
                return <path d="M 0 -18 A 9 9 0 0 1 0 0 A 9 9 0 0 0 0 18 A 18 18 0 0 1 0 -18 Z" fill="#c084fc" stroke="#a855f7" {...pathProps} />;
            case 'BOUNCER': // Circle
                return <circle r="20" fill="#fde047" stroke="#facc15" strokeWidth="2" />;
            case 'PAWN':
                 return <path d="M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z" fill="#6b7280" stroke="#374151" {...pathProps} transform="scale(1.2)"/>;
            case 'STANDARD':
            default:
                return <circle r="20" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />;
        }
    })();

    return (
        <svg viewBox="-25 -25 50 50" className={className}>
            {shape}
        </svg>
    );
};

export default PuckTypeIcon;
