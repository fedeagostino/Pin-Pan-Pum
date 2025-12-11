import React from 'react';
import { Puck, SpecialShotStatus } from '../types';
import { PUCK_TYPE_INFO, PUCK_TYPE_PROPERTIES, TEAM_COLORS, PAWN_DURABILITY, PUCK_GOAL_POINTS, UI_COLORS, GUARDIAN_DURABILITY } from '../constants';
import PuckTypeIcon from './PuckTypeIcon';

interface InfoPanelProps {
    puck: Puck;
    specialShotStatus: SpecialShotStatus;
    renderDirection?: 'up' | 'down';
    pointerHorizontalOffset?: number;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ puck, specialShotStatus = 'NONE', renderDirection = 'up', pointerHorizontalOffset = 0 }) => {
    const info = PUCK_TYPE_INFO[puck.puckType];
    const props = PUCK_TYPE_PROPERTIES[puck.puckType];
    const teamColor = TEAM_COLORS[puck.team];

    let borderColor = teamColor;
    let specialClass = '';
    let statusBadge = null;

    if (puck.puckType === 'KING' && specialShotStatus !== 'NONE') {
        if (specialShotStatus === 'ROYAL') {
            borderColor = UI_COLORS.GOLD;
            statusBadge = <div className="status-badge royal">TIRO REAL LISTO</div>;
        } else if (specialShotStatus === 'ULTIMATE') {
            specialClass = 'ultimate-border';
            borderColor = 'transparent';
            statusBadge = <div className="status-badge ultimate">TIRO DEFINITIVO</div>;
        }
    } else if (puck.isCharged) {
        statusBadge = <div className="status-badge charged">CARGADO</div>;
    }

    const cardStyle = {
        '--team-color': borderColor,
        '--pointer-offset': `${pointerHorizontalOffset}px`,
    } as React.CSSProperties;
    
    const cardClass = `puck-info-card ${renderDirection === 'down' ? 'render-down' : ''} ${specialClass}`;

    const maxDurability = puck.puckType === 'PAWN' ? PAWN_DURABILITY : GUARDIAN_DURABILITY;

    return (
        <>
        <style>{`
            @keyframes hologram-materialize { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes ultimate-border-flow { to { background-position: -200% 0; } }
            @keyframes scanline { to { background-position: 0 50px; } }
            
            .puck-info-card {
                position: relative;
                width: 320px;
                background: rgba(13, 17, 23, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 2px solid transparent;
                border-radius: 16px;
                z-index: 20;
                pointer-events: none;
                user-select: none;
                animation: hologram-materialize 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                overflow: hidden;
            }
            .puck-info-card.render-down { animation-name: hologram-materialize-down; }
            @keyframes hologram-materialize-down { from { opacity: 0; transform: scale(0.95) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

            .puck-info-card::before, .puck-info-card::after { content: ''; position: absolute; z-index: -1; }
            .puck-info-card::before {
                inset: -2px; border-radius: inherit;
                background: var(--team-color);
                box-shadow: 0 0 12px var(--team-color), inset 0 0 8px var(--team-color);
            }
            .puck-info-card::after { /* Scanlines */
                inset: 0;
                background: linear-gradient(to bottom, rgba(0, 246, 255, 0.05) 50%, transparent 50%);
                background-size: 100% 4px;
                animation: scanline 1s linear infinite;
            }

            .puck-info-card.ultimate-border::before {
                background: linear-gradient(90deg, #ff00de, #00f6ff, #ff00de);
                background-size: 200% auto;
                animation: ultimate-border-flow 3s linear infinite;
            }
            
            .card-pointer {
                position: absolute; bottom: -12px; left: calc(50% + var(--pointer-offset));
                transform: translateX(-50%); width: 0; height: 0;
                border-left: 12px solid transparent; border-right: 12px solid transparent;
                border-top: 12px solid var(--team-color); filter: drop-shadow(0 4px 6px var(--team-color));
            }
            .puck-info-card.render-down .card-pointer {
                bottom: auto; top: -12px; border-top: none;
                border-bottom: 12px solid var(--team-color); filter: drop-shadow(0 -4px 6px var(--team-color));
            }

            .card-content { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
            .card-header { display: flex; align-items: center; gap: 1rem; margin-top: ${statusBadge ? '0.75rem' : '0'}; }
            .card-puck-icon { flex-shrink: 0; width: 60px; height: 60px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); }
            .puck-name { font-size: 2rem; font-weight: 900; color: white; line-height: 1.1; }
            .puck-description { font-size: 0.9rem; color: var(--color-text-medium); line-height: 1.5; border-left: 3px solid var(--team-color); padding-left: 0.75rem; opacity: 0.9; }
            .puck-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
            .stat-item { background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 6px; font-size: 0.9rem; }
            .stat-item .label { color: var(--color-text-dark); font-size: 0.75rem; display: block; margin-bottom: 0.125rem; }
            .stat-item .value { color: var(--color-text-light); font-weight: 700; }
            .status-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); padding: 0.3rem 1rem; font-size: 0.8rem; font-weight: 800; border-radius: 20px; text-transform: uppercase; animation: badge-pop-in 0.3s 0.2s ease-out backwards; white-space: nowrap; }
            @keyframes badge-pop-in { from { transform: translateX(-50%) scale(0.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
            .status-badge.charged { background-color: #fde047; color: #422006; box-shadow: 0 0 10px #fde047; }
            .status-badge.royal { background-color: var(--glow-gold); color: #4c2f00; box-shadow: 0 0 12px var(--glow-gold); }
            .status-badge.ultimate { background: linear-gradient(90deg, #ff00de, #00f6ff, #ff00de); background-size: 200% 100%; animation: badge-pop-in 0.3s 0.1s ease-out backwards, ultimate-border-flow 3s linear infinite; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5); border: 1px solid white; }
        `}</style>
        <div style={cardStyle} className={cardClass}>
            {statusBadge}
            <div className="card-content">
                <div className="card-header">
                    <PuckTypeIcon puckType={puck.puckType} teamColor={teamColor} className="card-puck-icon" />
                    <h3 className="puck-name">{info.name}</h3>
                </div>
                <p className="puck-description">{info.description}</p>
                <div className="puck-stats">
                    <div className="stat-item"><span className="label">Puntos de Gol</span><span className="value">{PUCK_GOAL_POINTS[puck.puckType]}</span></div>
                    <div className="stat-item"><span className="label">Peso (Masa)</span><span className="value">{props.mass}</span></div>
                    <div className="stat-item"><span className="label">Líneas para Cargar</span><span className="value">{props.linesToCrossForBonus}</span></div>
                    {(puck.puckType === 'PAWN' || puck.puckType === 'GUARDIAN') && puck.durability !== undefined && (
                        <div className="stat-item"><span className="label">Durabilidad</span><span className="value">{puck.durability} / {maxDurability}</span></div>
                    )}
                </div>
            </div>
            <div className="card-pointer"></div>
        </div>
        </>
    );
};

export default InfoPanel;