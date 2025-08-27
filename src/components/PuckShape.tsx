
import React from 'react';
import { Puck } from '../types';
import { TEAM_COLORS, UI_COLORS, PUCK_SVG_DATA, PUCK_TYPE_PROPERTIES } from '../constants';

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getFillColorForPuck = (puck: Puck): string => {
    const { puckType, team, mass } = puck;
    const baseTeamColor = TEAM_COLORS[team];
    if (puckType === 'KING') return UI_COLORS.GOLD;
    
    const minMass = PUCK_TYPE_PROPERTIES.PAWN.mass;
    const maxMass = PUCK_TYPE_PROPERTIES.ANCHOR.mass;
    const normalizedMass = (Math.max(minMass, Math.min(mass, maxMass)) - minMass) / (maxMass - minMass);

    const rgb = hexToRgb(baseTeamColor);
    if (!rgb) return baseTeamColor;
    
    const darkenFactor = 1 - (normalizedMass * 0.4);
    const r = Math.round(rgb.r * darkenFactor);
    const g = Math.round(rgb.g * darkenFactor);
    const b = Math.round(rgb.b * darkenFactor);
    
    return `rgb(${r}, ${g}, ${b})`;
};

const PuckShape: React.FC<{ puck: Puck }> = React.memo(({ puck }) => {
    const { puckType, radius, team } = puck;
    const teamColor = TEAM_COLORS[team];
    const fillColor = getFillColorForPuck(puck);
    const svgData = PUCK_SVG_DATA[puckType];
    const uniqueId = `grad-${puck.id}-${puck.team}`;

    const pathProps = {
        fill: `url(#${uniqueId})`,
        stroke: "rgba(0,0,0,0.6)",
        strokeWidth: 2,
        vectorEffect: "non-scaling-stroke",
    } as const;
    
    const ShapeContent = () => {
        if (svgData && svgData.path) {
            const scale = radius / svgData.designRadius;
            return (
                 <g>
                    <path transform={`scale(${scale})`} d={svgData.path} {...pathProps} />
                    {puckType === 'KING' && (
                         <g transform={`scale(${scale * 1.4})`}>
                            <path d="M -10 6 L -10 -4 L -5 -8 L 0 -4 L 5 -8 L 10 -4 L 10 6 Z" fill={teamColor} stroke={UI_COLORS.GOLD} strokeWidth="1.5" />
                        </g>
                    )}
                </g>
            );
        }
        return <circle r={radius} {...pathProps} />;
    };

    return (
        <g>
           <defs>
                <radialGradient id={uniqueId} cx="0.3" cy="0.3" r="0.7">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor={fillColor} />
                </radialGradient>
            </defs>
           <ShapeContent />
        </g>
    );
}, (prevProps, nextProps) => {
    const p1 = prevProps.puck;
    const p2 = nextProps.puck;
    return p1.id === p2.id &&
           p1.puckType === p2.puckType &&
           p1.team === p2.team &&
           p1.mass === p2.mass &&
           p1.radius === p2.radius &&
           p1.isCharged === p2.isCharged &&
           p1.activeSynergy?.type === p2.activeSynergy?.type;
}));

export default PuckShape;
