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
            case 'GUARD':
                return <path d="M 0 -20 L 20 -10 L 20 10 L 0 20 L -20 10 L -20 -10 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'INFILTRATOR':
                return <path d="M 0 -20 L 5 -5 L 20 -5 L 10 5 L 15 20 L 0 10 L -15 20 L -10 5 L -20 -5 L -5 -5 Z" fill="#e5e7eb" stroke="#9ca3af" {...pathProps} />;
            case 'WIZARD':
                return <path d="M 0 -20 L 20 20 M -20 20 L 20 -20 M -15 -15 L 15 15 M -15 15 L 15 -15" fill="none" stroke="#a855f7" {...pathProps} strokeWidth="3" />;
            // 10 NEW PUCKS
            case 'BASTION':
                return <path d="M 0 -20 C 18 -20, 18 -4, 18 0 L 18 12 C 18 18, 10 20, 0 20 S -18 18, -18 12 L -18 0 C -18 -4, -18 -20, 0 -20 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'REAPER':
                return <path d="M 0 -20 C 15 -20, 20 -15, 20 0 C 20 15, 10 20, -5 20 C -10 10, -10 0, 0 -20 Z M 5 -15 C 0 -10, -5 -5, -5 5" fill="none" stroke="#e5e7eb" {...pathProps} strokeWidth="3" />;
            case 'PHANTOM':
                return <path d="M 0 -20 C 20 -15, 15 10, 0 20 C -15 10, -20 -15, 0 -20 Z M 0 -15 C 10 -12, 8 5, 0 15 C -8 5, -10 -12, 0 -15 Z" fill="#dbeafe" stroke="#93c5fd" {...pathProps} opacity="0.8" />;
            case 'MENDER':
                return <path d="M 0 -18 L 0 18 M -18 0 L 18 0 M -13 -13 L 13 13 M -13 13 L 13 -13" fill="none" stroke="#4ade80" {...pathProps} strokeWidth="3" />;
            case 'DISRUPTOR':
                return <g><path d="M 0 -20 A 20 20 0 1 1 0 20 A 20 20 0 1 1 0 -20" fill="#9ca3af" stroke="#4b5563" {...pathProps} /><path d="M 15 5 L -5 -15" stroke="#ef4444" strokeWidth="4" /></g>;
            case 'JUGGERNAUT':
                return <path d="M 0 -20 L 15 -20 L 20 0 L 15 20 L -15 20 L -20 0 L -15 -20 Z M -10 -15 L -5 -5 L 5 -5 L 10 -15 Z" fill="#4b5563" stroke="#1f2937" {...pathProps} />;
            case 'SEER':
                return <g><path d="M -20 0 C -10 -15, 10 -15, 20 0 C 10 15, -10 15, -20 0 Z" fill="#e5e7eb" stroke="#9ca3af" {...pathProps} /><circle cx="0" cy="0" r="8" fill="#a855f7" stroke="#6b21a8" {...pathProps} /></g>;
            case 'PULVERIZER':
                return <path d="M 0 -15 L 5 -5 L 15 0 L 5 5 L 0 15 L -5 5 L -15 0 L -5 -5 Z" fill="#f97316" stroke="#c2410c" {...pathProps} />;
            case 'ORBITER':
                return <g><circle cx="0" cy="0" r="12" fill="#4b5563" stroke="#1f2937" {...pathProps} /><circle cx="0" cy="-20" r="4" fill="#9ca3af" stroke="#4b5563" {...pathProps} /><circle cx="20" cy="0" r="4" fill="#9ca3af" stroke="#4b5563" {...pathProps} transform="rotate(45)" /></g>;
            case 'TRAPPER':
                return <path d="M 0 0 L 0 -20 M 0 0 L 0 20 M 0 0 L 20 0 M 0 0 L -20 0 M 0 0 L 14.1 -14.1 M 0 0 L -14.1 14.1 M 0 0 L -14.1 -14.1 M 0 0 L 14.1 14.1 M -10 -10 A 14.1 14.1 0 1 1 -10.1 -10" fill="none" stroke="#a16207" {...pathProps} strokeWidth="2.5" />;
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