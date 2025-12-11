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
            case 'GUARDIAN': // Pentagon
                return <path d="M 0 -20 L 19.02 -6.18 L 11.76 16.18 L -11.76 16.18 L -19.02 -6.18 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'PAWN':
                 return <path d="M 0 -15 L 14.25 -6.3 L 8.8 12.15 L -8.8 12.15 L -14.25 -6.3 Z" fill="#6b7280" stroke="#374151" {...pathProps} transform="scale(1.2)"/>;
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