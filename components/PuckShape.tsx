
import React from 'react';
import { Puck, Vector } from '../types';
import { TEAM_COLORS, UI_COLORS, PUCK_SVG_DATA, PUCK_TYPE_PROPERTIES } from '../constants';

const getVectorMagnitude = (v: Vector) => Math.sqrt(v.x * v.x + v.y * v.y);

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getFillColorForPuck = (puck: Puck): string => {
    const { puckType, team } = puck;
    const baseTeamColor = TEAM_COLORS[team];
    
    if (team === 'RED') {
        if (puckType === 'KING') return '#2a0505'; 
        if (puckType === 'FAST') return '#5c0000'; 
        if (puckType === 'GHOST') return '#110022'; 
        if (puckType === 'PAWN') return '#1a1a1a'; 
    } else {
        if (puckType === 'KING') return '#e0ac69'; // Tono de piel más cálido para Eleven
        if (['STANDARD', 'HEAVY', 'FAST'].includes(puckType)) return '#5d4037'; // Tono Madera para el bate de Steve
        if (puckType === 'PAWN') return '#1e293b'; 
        if (puckType === 'GHOST') return '#fcd9cc'; 
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
    const gradientId = `grad-${puck.id}`;
    const highlightColor = (team === 'RED') ? '#ff2222' : '#ffffff';

    const renderSteveNailBatFeatures = (scale: number = 1) => {
        const nailIndices = [0, 45, 135, 180, 225, 315]; // Ángulos para los clavos
        return (
            <g transform={`scale(${scale})`}>
                <g className="nail-spikes">
                    {nailIndices.map((angle, i) => (
                        <g key={i} transform={`rotate(${angle})`}>
                            <line x1="0" y1="-20" x2="0" y2="-28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="0" cy="-28" r="1.8" fill="#cbd5e1" />
                        </g>
                    ))}
                </g>
                <g transform="translate(0, -6)">
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
                <circle r="12" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeDasharray="1 2" />
            </g>
        );
    };

    const renderMaxine = (scale: number = 1) => (
        <g transform={`scale(${scale})`}>
            <path 
                d="M -16 5 C -16 -15, -12 -22, 0 -22 C 12 -22, 16 -15, 16 5 C 16 12, 10 15, 0 15 C -10 15, -16 12, -16 5" 
                fill="#e67e22" 
                stroke="#d35400" 
                strokeWidth="1.5"
            />
            <path d="M -14 -6 A 14 14 0 0 1 14 -6" fill="none" stroke="#2c3e50" strokeWidth="4" />
            <rect x="-19" y="-9" width="7" height="14" rx="2" fill="#2c3e50" stroke="#1a202c" />
            <rect x="12" y="-9" width="7" height="14" rx="2" fill="#2c3e50" stroke="#1a202c" />
            <circle cx="0" cy="0" r="10" fill="#fcd9cc" opacity="0.6" />
        </g>
    );

    const renderUniqueFeatures = () => {
        const scale = radius / (svgData?.designRadius || 20);

        if (team === 'RED') {
            switch (puckType) {
                case 'KING':
                    return (
                        <g transform={`scale(${scale})`}>
                            <circle r="18" fill="none" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5" strokeDasharray="1 4" />
                            <path d="M 0 0 L -12 -15 M 0 0 L 12 -15 M 0 0 L -15 12 M 0 0 L 15 12 M 0 0 L 0 -18 M 0 0 L 0 18" stroke="#450a0a" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                            <circle cx="-7" cy="-5" r="3" fill="#ffffff">
                                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="7" cy="-5" r="3" fill="#ffffff">
                                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <path d="M -5 10 Q 0 14 5 10" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    );
                case 'FAST':
                    return (
                        <g transform={`scale(${scale})`}>
                            <rect x="-4" y="-4" width="8" height="8" fill="#300" rx="1" />
                            <g>
                                <path d="M -2 -14 L 0 -11 L 2 -14" fill="white" />
                                <path d="M -2 14 L 0 11 L 2 14" fill="white" />
                                <path d="M -14 -2 L -11 0 L -14 2" fill="white" />
                                <path d="M 14 -2 L 11 0 L 14 2" fill="white" />
                            </g>
                        </g>
                    );
                default:
                    return null;
            }
        } else {
            if (puckType === 'KING') {
                return (
                    <g transform={`scale(${scale})`}>
                        {/* Cabello de Eleven con flequillo corto y texturizado */}
                        <path d="M -19 0 A 19 19 0 0 1 19 0 L 19 -8 Q 0 -25 -19 -8 Z" fill="#4e342e" />
                        <path d="M -18 0 Q -14 3 -10 0 Q -5 3 0 0 Q 5 3 10 0 Q 14 3 18 0" fill="#4e342e" /> 
                        {/* Ojos */}
                        <circle cx="-6" cy="1" r="2" fill="#333" />
                        <circle cx="6" cy="1" r="2" fill="#333" />
                        {/* Gota de sangre descentrada (fosa nasal derecha de ella, izquierda nuestra) */}
                        <path d="M -2.5 5 L -2.5 13" stroke="#ff0000" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="-2.5" cy="13" r="1.5" fill="#ff0000" />
                        {/* Mejillas sonrosadas sutiles */}
                        <circle cx="-10" cy="5" r="3" fill="#d47c6a" opacity="0.25" />
                        <circle cx="10" cy="5" r="3" fill="#d47c6a" opacity="0.25" />
                    </g>
                );
            } else if (puckType === 'GHOST') {
                return renderMaxine(scale);
            } else if (['STANDARD', 'HEAVY', 'FAST'].includes(puckType)) {
                return renderSteveNailBatFeatures(scale);
            }
        }
        return null;
    };

    const isUniqueSkin = (team === 'RED' && ['KING', 'GHOST', 'PAWN', 'FAST'].includes(puckType)) || (team === 'BLUE' && ['KING', 'GHOST', 'STANDARD', 'HEAVY', 'FAST', 'PAWN'].includes(puckType));

    return (
        <g className={isCharged ? 'charged-puck-group' : ''}>
            <defs>
                <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={isCharged ? "#fffde7" : highlightColor} />
                    <stop offset="40%" stopColor={fillColor} />
                    <stop offset="100%" stopColor="#000000" />
                </radialGradient>
            </defs>

            <circle r={radius - 2} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            <g>
                {svgData && svgData.path && puckType !== 'GHOST' && team === 'RED' ? (
                    <path 
                        transform={`scale(${radius / svgData.designRadius})`} 
                        d={svgData.path} 
                        fill={`url(#${gradientId})`}
                        stroke={isCharged ? '#fde047' : teamColor}
                        strokeWidth={isCharged ? 3.5 : 2}
                    />
                ) : (
                    <circle 
                        r={radius} 
                        fill={`url(#${gradientId})`}
                        stroke={isCharged ? '#fde047' : teamColor}
                        strokeWidth={isCharged ? 3.5 : 2}
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
           getVectorMagnitude(prevProps.puck.velocity) === getVectorMagnitude(nextProps.puck.velocity);
});

export default PuckShape;
