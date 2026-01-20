
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
        if (puckType === 'KING') return '#3a0101'; // Deep Vecna
        if (puckType === 'FAST') return '#5c0000'; // Demogorgon
        if (puckType === 'GHOST') return '#110022'; // Mind Flayer shadow
        if (puckType === 'PAWN') return '#1a1a1a'; // Demobat
    } else {
        if (puckType === 'KING') return '#ffe5db'; // Eleven Skin Tone
        if (puckType === 'PAWN') return '#1e293b'; // Walkie Talkie Body
    }
    
    const rgb = hexToRgb(baseTeamColor);
    if (!rgb) return baseTeamColor;
    return `rgb(${Math.round(rgb.r * 0.3)}, ${Math.round(rgb.g * 0.3)}, ${Math.round(rgb.b * 0.3)})`;
};

const PuckShape: React.FC<{ puck: Puck }> = React.memo(({ puck }) => {
    const { puckType, radius, team, velocity, isCharged } = puck;
    const teamColor = TEAM_COLORS[team];
    const fillColor = getFillColorForPuck(puck);
    const svgData = PUCK_SVG_DATA[puckType];

    const velocityMag = getVectorMagnitude(velocity);
    const animSpeed = Math.max(0.1, 0.8 - (velocityMag * 0.05));

    const gradientId = `grad-${puck.id}`;
    const highlightColor = (team === 'RED') ? '#ff2222' : '#ffffff';

    const renderSteveHair = (scale: number = 1) => (
        <g transform={`scale(${scale}) translate(0, -6)`}>
            <path 
                d="M -15 0 C -15 -15, -10 -22, 0 -22 C 10 -22, 15 -15, 15 0 C 15 5, 10 8, 0 8 C -10 8, -15 5, -15 0" 
                fill="#4e342e" 
                stroke="#2d1d19" 
                strokeWidth="1.5"
            />
            <path 
                d="M -9 -14 Q 0 -19 9 -14" 
                fill="none" 
                stroke="#a1887f" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                opacity="0.5"
            />
        </g>
    );

    const renderUniqueFeatures = () => {
        const scale = radius / (svgData?.designRadius || 20);

        if (team === 'RED') {
            switch (puckType) {
                case 'KING':
                    return (
                        <g transform={`scale(${scale})`}>
                            <path d="M -10 -10 L -18 -18 M 10 -10 L 18 -18 M -12 12 L -20 20 M 12 12 L 20 20" stroke="#ff0000" strokeWidth="1" opacity="0.6" />
                            <circle cx="-6" cy="-4" r="2.5" fill="#ff0000" className="demo-mouth-core" />
                            <circle cx="6" cy="-4" r="2.5" fill="#ff0000" className="demo-mouth-core" />
                            <path d="M -4 8 Q 0 12 4 8" fill="none" stroke="#000" strokeWidth="2" />
                        </g>
                    );
                case 'FAST':
                    return (
                        <g transform={`scale(${scale})`}>
                            <rect x="-4" y="-4" width="8" height="8" className="demo-mouth-core" rx="1" />
                            <g className="demo-tooth">
                                <path d="M -2 -14 L 0 -11 L 2 -14" fill="white" />
                                <path d="M -2 14 L 0 11 L 2 14" fill="white" />
                                <path d="M -14 -2 L -11 0 L -14 2" fill="white" />
                                <path d="M 14 -2 L 11 0 L 14 2" fill="white" />
                            </g>
                        </g>
                    );
                case 'GHOST':
                    return (
                        <g transform={`scale(${scale})`}>
                            <circle cx="0" cy="0" r="5" fill="#ff0000" className="demo-mouth-core" />
                        </g>
                    );
                default:
                    return null;
            }
        } else {
            if (puckType === 'KING') {
                return (
                    <g transform={`scale(${scale})`}>
                        <circle cx="-6" cy="-4" r="1.5" fill="#333" />
                        <circle cx="6" cy="-4" r="1.5" fill="#333" />
                        <path d="M 0 4 L 0 10" stroke="#ff0000" strokeWidth="3" strokeLinecap="round" className="demo-mouth-core" />
                    </g>
                );
            } else if (['STANDARD', 'HEAVY', 'FAST'].includes(puckType)) {
                return renderSteveHair(scale);
            }
        }
        return null;
    };

    const isUniqueSkin = (team === 'RED' && ['KING', 'GHOST', 'PAWN', 'FAST'].includes(puckType)) || (team === 'BLUE' && ['KING', 'STANDARD', 'HEAVY', 'FAST', 'PAWN'].includes(puckType));

    return (
        <g className={isCharged ? 'charged-puck-group' : ''}>
            <defs>
                <style>{`
                    @keyframes charged-stroke-shimmer-${puck.id} {
                        0% { stroke: #fde047; stroke-width: 3.5; }
                        50% { stroke: ${teamColor}; stroke-width: 2.5; }
                        100% { stroke: #fde047; stroke-width: 3.5; }
                    }
                    .charged-shimmer-${puck.id} {
                        animation: charged-stroke-shimmer-${puck.id} 0.8s infinite ease-in-out;
                    }
                `}</style>
                <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={isCharged ? "#fffde7" : highlightColor} />
                    <stop offset="40%" stopColor={fillColor} />
                    <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <filter id="soft-glow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle r={radius - 2} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            <g className={isUniqueSkin ? 'demo-puck-body' : ''} filter="url(#soft-glow)">
                {svgData && svgData.path ? (
                    <path 
                        transform={`scale(${radius / svgData.designRadius})`} 
                        d={svgData.path} 
                        fill={`url(#${gradientId})`}
                        stroke={isCharged ? '#fde047' : teamColor}
                        strokeWidth={isCharged ? 3.5 : 2}
                        className={isCharged ? `charged-shimmer-${puck.id}` : ''}
                        vectorEffect="non-scaling-stroke"
                    />
                ) : (
                    <circle 
                        r={radius} 
                        fill={`url(#${gradientId})`}
                        stroke={isCharged ? '#fde047' : teamColor}
                        strokeWidth={isCharged ? 3.5 : 2}
                        className={isCharged ? `charged-shimmer-${puck.id}` : ''}
                        vectorEffect="non-scaling-stroke"
                    />
                )}
                {isUniqueSkin && renderUniqueFeatures()}
            </g>

            <ellipse cx={-radius*0.3} cy={-radius*0.3} rx={radius*0.4} ry={radius*0.2} fill="white" opacity="0.1" transform={`rotate(-45)`} />
        </g>
    );
}, (prevProps, nextProps) => {
    return prevProps.puck.id === nextProps.puck.id &&
           prevProps.puck.puckType === nextProps.puck.puckType &&
           prevProps.puck.isCharged === nextProps.puck.isCharged &&
           prevProps.puck.team === nextProps.puck.team &&
           prevProps.puck.durability === nextProps.puck.durability &&
           getVectorMagnitude(prevProps.puck.velocity) === getVectorMagnitude(nextProps.puck.velocity);
});

export default PuckShape;
