
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
        if (puckType === 'KING') return '#3a0a0a'; 
        if (puckType === 'FAST' || puckType === 'PAWN') return '#2d1a1a'; 
        if (puckType === 'GHOST') return '#000000'; 
    } else {
        if (puckType === 'KING') return '#fce7f3'; // Eleven dress
        if (puckType === 'GHOST') return '#00d4ff'; // Max spirit blue
        if (puckType === 'FAST') return '#15803d'; // Dustin cap green
        if (puckType === 'HEAVY') return '#14532d'; // Lucas tactical camo
        if (['STANDARD', 'PAWN', 'DAMPENER'].includes(puckType)) return '#4e342e'; 
    }
    
    const rgb = hexToRgb(baseTeamColor);
    if (!rgb) return baseTeamColor;
    return `rgb(${Math.round(rgb.r * 0.3)}, ${Math.round(rgb.g * 0.3)}, ${Math.round(rgb.b * 0.3)})`;
};

const PuckShape: React.FC<{ puck: Puck }> = React.memo(({ puck }) => {
    const { id, puckType, radius, team, velocity, isCharged } = puck;
    const teamColor = TEAM_COLORS[team];
    const fillColor = getFillColorForPuck(puck);
    const svgData = PUCK_SVG_DATA[puckType];
    const scale = radius / (svgData?.designRadius || 20);

    const velocityMag = getVectorMagnitude(velocity);
    const gradientId = `grad-${id}`;
    const highlightColor = (team === 'RED') ? '#ff2222' : '#ffffff';
    const chargedGold = '#fde047';

    const renderEleven = (scale: number) => (
        <g transform={`scale(${scale})`}>
            {/* Psychic Ripples Aura */}
            <circle r="22" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="20;26;20" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
            </circle>
            
            {/* Dress and Skin */}
            <circle r="19" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1.5" />
            
            {/* Shaved Head Detail */}
            <circle r="16" fill="none" stroke="#4e342e" strokeWidth="4" strokeDasharray="1 4" opacity="0.3" transform="translate(0, -1)" />
            
            {/* Eyes */}
            <circle cx="-6" cy="1" r="2.8" fill="#111" />
            <circle cx="6" cy="1" r="2.8" fill="#111" />
            
            {/* The Iconic Nosebleed */}
            <g>
                <path d="M -1 7 L -1 15" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round">
                    <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                </path>
                <circle cx="-1" cy="15" r="2" fill="#7f1d1d">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                </circle>
            </g>
        </g>
    );

    const renderMax = (scale: number) => (
        <g transform={`scale(${scale})`}>
            {/* Levitating Oscillation Animation */}
            <g>
                <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" />
                
                {/* Spectral Shadow */}
                <ellipse cx="0" cy="18" rx="14" ry="4" fill="#000" opacity="0.2">
                    <animate attributeName="rx" values="14;10;14" dur="3s" repeatCount="indefinite" />
                </ellipse>

                {/* Hair and Face */}
                <circle r="19" fill="#d35400" stroke="#00d4ff" strokeWidth="1.5" />
                <path d="M -15 2 C -15 -16, 15 -16, 15 2 L 15 12 Q 0 18 -15 12 Z" fill="#fce7f3" />
                
                {/* Blue Walkman Headphones */}
                <path d="M -15 -8 A 15 15 0 0 1 15 -8" fill="none" stroke="#00d4ff" strokeWidth="4" />
                <rect x="-21" y="-12" width="8" height="16" rx="2" fill="#00d4ff" />
                <rect x="13" y="-12" width="8" height="16" rx="2" fill="#00d4ff" />
                
                {/* Eyes */}
                <circle cx="-5" cy="6" r="2.2" fill="#111" />
                <circle cx="5" cy="6" r="2.2" fill="#111" />
            </g>
        </g>
    );

    const renderDustin = (scale: number) => (
        <g transform={`scale(${scale})`}>
            <circle r="19" fill="#5d4037" stroke="#3e2723" strokeWidth="1" />
            {/* Thinking Cap */}
            <path d="M -19 0 Q 0 -32 19 0" fill="#15803d" />
            <rect x="-14" y="-22" width="28" height="10" fill="#fef08a" />
            <rect x="-14" y="-14" width="28" height="4" fill="#ffffff" />
            {/* Curls */}
            <path d="M -19 4 Q -23 16 -10 16" fill="none" stroke="#3e2723" strokeWidth="6" strokeLinecap="round" />
            <path d="M 19 4 Q 23 16 10 16" fill="none" stroke="#3e2723" strokeWidth="6" strokeLinecap="round" />
            {/* Happy Face */}
            <circle cx="-6" cy="8" r="2" fill="#111" />
            <circle cx="6" cy="8" r="2" fill="#111" />
            <path d="M -4 14 Q 0 18 4 14" fill="none" stroke="#111" strokeWidth="1.5" />
        </g>
    );

    const renderLucas = (scale: number) => (
        <g transform={`scale(${scale})`}>
            <circle r="19" fill="#3a251e" stroke="#1a0a0a" strokeWidth="1" />
            {/* Camo Bandana with pixels */}
            <rect x="-20" y="-14" width="40" height="9" fill="#166534" />
            <g opacity="0.4">
                <rect x="-15" y="-13" width="4" height="2" fill="#14532d" />
                <rect x="-5" y="-11" width="4" height="2" fill="#064e3b" />
                <rect x="8" y="-14" width="4" height="3" fill="#3f6212" />
            </g>
            <path d="M -20 -10 L 20 -10" stroke="#000" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Eyes */}
            <circle cx="-6" cy="6" r="2.5" fill="#111" />
            <circle cx="6" cy="6" r="2.5" fill="#111" />
        </g>
    );

    const renderMike = (scale: number) => (
        <g transform={`scale(${scale})`}>
            <circle r="19" fill="#5d4037" stroke="#2d1d19" strokeWidth="1" />
            {/* Classic 80s Bowl Cut Mike */}
            <path d="M -18 2 C -18 -22, 18 -22, 18 2 L 18 10 Q 0 14 -18 10 Z" fill="#1a1a1a" />
            <circle cx="-6" cy="10" r="2" fill="#111" />
            <circle cx="6" cy="10" r="2" fill="#111" />
        </g>
    );

    const renderWill = (scale: number) => (
        <g transform={`scale(${scale})`}>
            <circle r="18" fill="#8b5e3c" />
            {/* Will Byers Bowl Cut */}
            <path d="M -17 0 C -17 -19, 17 -19, 17 0 L 17 8 Q 0 12 -17 8 Z" fill="#4e342e" />
            {/* Subtle Upside Down connection glow */}
            <circle cx="-5" cy="7" r="2.5" fill="#111" />
            <circle cx="5" cy="7" r="2.5" fill="#111" />
            <circle r="20" fill="none" stroke="#9b59b6" strokeWidth="1" opacity="0.2">
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
            </circle>
        </g>
    );

    const renderUniqueFeatures = () => {
        if (team === 'RED') {
            // RED TEAM (VILLAINS)
            if (puckType === 'KING') return (
                <g transform={`scale(${scale})`}>
                    <circle r="19" fill="#3a0a0a" stroke="#000" strokeWidth="2" />
                    <path d="M -15 -5 Q 0 -25 15 -5 Q 0 15 -15 -5" fill="none" stroke="#7f1d1d" strokeWidth="1" opacity="0.6" />
                    <circle cx="-7" cy="-2" r="3.5" fill="#e2e8f0" />
                    <circle cx="7" cy="-2" r="3.5" fill="#e2e8f0" />
                    <path d="M -3 7 L -3 16" stroke="#991b1b" strokeWidth="2" />
                </g>
            );
            if (puckType === 'FAST' || puckType === 'PAWN') return (
                <g transform={`scale(${scale})`}>
                    <circle r="18" fill="#2d1a1a" stroke="#1a0a0a" strokeWidth="1" />
                    {[0, 72, 144, 216, 288].map(angle => (
                        <path key={angle} d="M 0 -4 Q 8 -18 0 -22 Q -8 -18 0 -4" fill="#6b1a1a" transform={`rotate(${angle})`} />
                    ))}
                    <circle r="5" fill="#000" />
                </g>
            );
            if (puckType === 'GHOST') return (
                <g transform={`scale(${scale})`}>
                    <circle r="10" fill="#000" />
                    {[0, 90, 180, 270].map(angle => (
                        <path key={angle} d="M 0 0 Q 15 -10 25 5" transform={`rotate(${angle})`} fill="none" stroke="#1a1a1a" strokeWidth="3" />
                    ))}
                    <circle r="4" fill="#ff0000" />
                </g>
            );
            return <circle r={radius - 4} fill="#1a0a0a" stroke="#ff0000" strokeWidth="1" />;
        } else {
            // BLUE TEAM (HEROES)
            if (puckType === 'KING') return renderEleven(scale);
            if (puckType === 'GHOST') return renderMax(scale);
            if (puckType === 'FAST') return renderDustin(scale);
            if (puckType === 'HEAVY') return renderLucas(scale);
            if (puckType === 'STANDARD') return renderMike(scale);
            if (puckType === 'PAWN' || puckType === 'DAMPENER') return renderWill(scale);
        }
        return null;
    };

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
                <circle 
                    r={radius} 
                    fill={`url(#${gradientId})`}
                    stroke={isCharged ? chargedGold : teamColor}
                    strokeWidth={isCharged ? 3.5 : 2}
                >
                    {isCharged && (
                        <animate 
                            attributeName="stroke" 
                            values={`${teamColor};${chargedGold};${teamColor}`} 
                            dur="0.8s" 
                            repeatCount="indefinite" 
                        />
                    )}
                </circle>
                {renderUniqueFeatures()}
            </g>
            <ellipse cx={-radius*0.3} cy={-radius*0.3} rx={radius*0.4} ry={radius*0.2} fill="white" opacity="0.1" transform={`rotate(-45)`} />
            
            {isCharged && (
                <g>
                    {/* Intermittent Outer Ring */}
                    <circle r={radius + 6} fill="none" stroke={chargedGold} strokeWidth="2" strokeDasharray="4 8">
                        <animate attributeName="stroke-opacity" values="0.8;0.1;0.8" dur="1s" repeatCount="indefinite" />
                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="stroke" values={`${chargedGold};${teamColor};${chargedGold}`} dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Core Pulse */}
                    <circle r={radius} fill="none" stroke={chargedGold} strokeWidth="10" opacity="0.3">
                        <animate attributeName="r" values={`${radius};${radius + 12}`} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="stroke" values={`${chargedGold};${teamColor}`} dur="1.5s" repeatCount="indefinite" />
                    </circle>
                </g>
            )}
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
