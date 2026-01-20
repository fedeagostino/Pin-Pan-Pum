
import React from 'react';
import { Puck, Vector } from '../types';
import { TEAM_COLORS, UI_COLORS, PUCK_SVG_DATA, PUCK_TYPE_PROPERTIES } from '../constants';

const getVectorMagnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getFillColorForPuck = (puck: Puck): string => {
    const { puckType, team, mass } = puck;
    const baseTeamColor = TEAM_COLORS[team];
    
    if (team === 'RED') {
        if (puckType === 'KING') return '#4a0000'; // Vecna Flesh
        if (puckType === 'FAST') return '#5c0000'; // Demogorgon
        if (puckType === 'GHOST') return '#1a0033'; // Mind Flayer shadow
        if (puckType === 'PAWN') return '#333333'; // Demobat
    } else {
        if (puckType === 'KING') return '#fcd9cc'; // Eleven Skin Tone
        if (puckType === 'PAWN') return '#2d3748'; // Walkie Talkie Body
    }
    
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
    const { puckType, radius, team, velocity } = puck;
    const teamColor = TEAM_COLORS[team];
    const fillColor = getFillColorForPuck(puck);
    const svgData = PUCK_SVG_DATA[puckType];

    const velocityMag = getVectorMagnitude(velocity);
    const animSpeed = Math.max(0.1, 0.8 - (velocityMag * 0.05));
    const jitterSpeed = Math.max(0.05, 0.2 - (velocityMag * 0.02));

    const gradientId = `grad-${puck.id}`;
    const highlightColor = (team === 'RED') ? '#800000' : (puckType === 'KING' ? '#ffffff' : (puckType === 'PAWN' ? '#4a5568' : 'rgba(255,255,255,0.7)'));

    const pathProps = {
        fill: `url(#${gradientId})`,
        stroke: (team === 'RED') ? teamColor : (puckType === 'PAWN' ? '#1a202c' : "rgba(0,0,0,0.6)"),
        strokeWidth: (team === 'RED') ? 3 : 2,
        vectorEffect: "non-scaling-stroke",
    } as const;

    const renderSteveHair = (scale: number = 1) => (
        <g transform={`scale(${scale}) translate(0, -6)`}>
            <path 
                d="M -15 0 C -15 -15, -10 -22, 0 -22 C 10 -22, 15 -15, 15 0 C 15 5, 10 8, 0 8 C -10 8, -15 5, -15 0" 
                fill="#5d4037" 
                stroke="#3e2723" 
                strokeWidth="1.5"
            />
            <path 
                d="M -8 -15 Q 0 -18 8 -15" 
                fill="none" 
                stroke="#8d6e63" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                opacity="0.6"
            />
        </g>
    );

    const renderWalkieTalkie = (scale: number = 1) => (
        <g transform={`scale(${scale})`}>
            {/* Walkie Talkie Body (The base path/circle handled by the outer component) */}
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
            <circle cx="6" cy="-8" r="1.5" fill="#ff0000" className="demo-mouth-core" />
        </g>
    );

    const renderUniqueFeatures = () => {
        const scale = radius / svgData.designRadius;

        if (team === 'RED') {
            switch (puckType) {
                case 'KING': // VECNA
                    return (
                        <g transform={`scale(${scale})`}>
                            <path d="M 0 -20 L 14 -14 L 18 0 L 14 14 L 0 20 L -14 14 L -18 0 L -14 -14 Z" fill="#4a0000" stroke="#000" strokeWidth="1" />
                            <path d="M -10 -10 L -15 -15 M 10 -10 L 15 -15 M -12 10 L -18 15 M 12 10 L 18 15" stroke="#220000" strokeWidth="2" />
                            <rect x="-8" y="-5" width="4" height="4" fill="#ff0000" className="demo-mouth-core" />
                            <rect x="4" y="-5" width="4" height="4" fill="#ff0000" className="demo-mouth-core" />
                            <rect x="-2" y="5" width="4" height="2" fill="#000" />
                        </g>
                    );
                case 'GHOST': // MIND FLAYER
                    return (
                        <g transform={`scale(${scale})`}>
                            <path d="M 0 -10 L 15 -25 M 0 -10 L -15 -25 M 0 0 L 25 -5 M 0 0 L -25 -5 M 0 10 L 20 20 M 0 10 L -20 20" stroke="#1a0033" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="0" cy="0" r="10" fill="#1a0033" />
                            <circle cx="0" cy="0" r="4" fill="#ff0000" className="demo-mouth-core" />
                        </g>
                    );
                case 'PAWN': // DEMOBAT
                    return (
                        <g transform={`scale(${scale * 1.5})`}>
                            <path d="M -10 -5 L -20 -10 L -15 0 L -10 2 Z" fill="#222" />
                            <path d="M 10 -5 L 20 -10 L 15 0 L 10 2 Z" fill="#222" />
                            <circle cx="0" cy="0" r="6" fill="#333" />
                            <rect x="-1" y="-1" width="2" height="2" fill="red" />
                        </g>
                    );
                case 'FAST': // DEMOGORGON
                    return (
                        <g transform={`scale(${scale})`}>
                            <rect x="-4" y="-4" width="8" height="8" className="demo-mouth-core" rx="1" />
                            <g className="demo-tooth">
                                <rect x="-1" y="-12" width="2" height="3" fill="white" />
                                <rect x="-1" y="9" width="2" height="3" fill="white" />
                                <rect x="-12" y="-1" width="3" height="2" fill="white" />
                                <rect x="9" y="-1" width="3" height="2" fill="white" />
                                <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.4" />
                            </g>
                        </g>
                    );
                default:
                    return null;
            }
        } else {
            // BLUE TEAM UNIQUE
            if (puckType === 'KING') { // ELEVEN
                return (
                    <g transform={`scale(${scale})`}>
                        <circle r="18" fill="#e0c2b8" opacity="0.4" />
                        <circle cx="-6" cy="-4" r="1.5" fill="#333" />
                        <circle cx="6" cy="-4" r="1.5" fill="#333" />
                        <rect x="-1" y="2" width="2" height="1" fill="#d9b8ad" />
                        <path d="M 0 3 L 0 8" stroke="#ff0000" strokeWidth="2.5" strokeLinecap="round" className="demo-mouth-core" />
                        <circle cx="0" cy="9" r="1.5" fill="#ff0000" className="demo-mouth-core" />
                    </g>
                );
            } else if (puckType === 'PAWN') {
                return renderWalkieTalkie(scale);
            } else if (['STANDARD', 'HEAVY', 'FAST'].includes(puckType)) {
                return renderSteveHair(scale);
            }
        }
        return null;
    };

    const isUniqueSkin = (team === 'RED' && ['KING', 'GHOST', 'PAWN', 'FAST'].includes(puckType)) || (team === 'BLUE' && ['KING', 'STANDARD', 'HEAVY', 'FAST', 'PAWN'].includes(puckType));

    return (
        <g>
            <style>{`
                @keyframes demogorgon-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                    100% { transform: scale(1); }
                }
                @keyframes tooth-jitter {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(0.5px, -0.5px); }
                    50% { transform: translate(-0.5px, 0.5px); }
                    75% { transform: translate(0.5px, 0.5px); }
                    100% { transform: translate(0, 0); }
                }
                @keyframes mouth-glow {
                    0% { opacity: 0.5; fill: #ff0000; }
                    50% { opacity: 1; fill: #ff0000; }
                    100% { opacity: 0.5; fill: #ff0000; }
                }
                .demo-puck-body {
                    animation: demogorgon-pulse ${animSpeed}s infinite ease-in-out;
                }
                .demo-tooth {
                    animation: tooth-jitter ${jitterSpeed}s infinite linear;
                }
                .demo-mouth-core {
                    animation: mouth-glow ${animSpeed}s infinite ease-in-out;
                }
            `}</style>
            <defs>
                <radialGradient id={gradientId} cx="0.25" cy="0.25" r="0.75">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="100%" stopColor={fillColor} />
                </radialGradient>
            </defs>

            {/* Special case: Walkie Talkie uses a rect body instead of the default pawn path if we want strictly rectangular look */}
            {(team === 'BLUE' && puckType === 'PAWN') ? (
                <g className="demo-puck-body">
                    <rect x="-11" y="-15" width="22" height="30" rx="3" {...pathProps} />
                    {renderWalkieTalkie(1)}
                </g>
            ) : svgData && svgData.path ? (
                <g className={isUniqueSkin ? 'demo-puck-body' : ''}>
                    <path transform={`scale(${radius / svgData.designRadius})`} d={svgData.path} {...pathProps} />
                    {isUniqueSkin && renderUniqueFeatures()}
                </g>
            ) : (
                <g className={isUniqueSkin ? 'demo-puck-body' : ''}>
                    <circle r={radius} {...pathProps} />
                    {isUniqueSkin && renderUniqueFeatures()}
                </g>
            )}
        </g>
    );
}, (prevProps, nextProps) => {
    const p1 = prevProps.puck;
    const p2 = nextProps.puck;
    const v1 = getVectorMagnitude(p1.velocity);
    const v2 = getVectorMagnitude(p2.velocity);

    return p1.id === p2.id &&
           p1.puckType === p2.puckType &&
           p1.team === p2.team &&
           p1.mass === p2.mass &&
           p1.radius === p2.radius &&
           p1.isCharged === p2.isCharged &&
           p1.durability === p2.durability &&
           Math.abs(v1 - v2) < 0.1;
});

export default PuckShape;
