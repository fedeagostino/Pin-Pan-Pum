import React from 'react';
import { Puck, SpecialShotStatus } from '../types';
import { PUCK_TYPE_INFO, PUCK_TYPE_PROPERTIES, TEAM_COLORS, PAWN_DURABILITY, PUCK_GOAL_POINTS, UI_COLORS } from '../constants';
import PuckTypeIcon from './PuckTypeIcon';
import PuckShape from './PuckShape';

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

    let specialClass = '';
    let statusBadge = null;

    if (puck.puckType === 'KING' && specialShotStatus !== 'NONE') {
        if (specialShotStatus === 'ROYAL') {
            statusBadge = <div className="status-badge royal">TIRO REAL LISTO</div>;
        } else if (specialShotStatus === 'ULTIMATE') {
            specialClass = 'ultimate-border';
            statusBadge = <div className="status-badge ultimate">TIRO DEFINITIVO</div>;
        }
    } else if (puck.isCharged) {
        statusBadge = <div className="status-badge charged">CARGADO</div>;
    }

    const cardStyle = {
        '--team-color': teamColor,
        '--pointer-offset': `${pointerHorizontalOffset}px`,
    } as React.CSSProperties;
    
    const cardClass = `puck-info-card ${renderDirection === 'down' ? 'render-down' : ''} ${specialClass}`;

    return (
        <>
        <style>{`
            @keyframes card-fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes card-fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes ultimate-border-flow { to { --border-angle: 360deg; } }
            @property --border-angle { syntax: "<angle>"; inherits: true; initial-value: 0deg; }
            
            .puck-info-card {
                position: relative;
                width: 320px;
                background-color: var(--color-wood-dark);
                background-image: url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cfilter id='n'%3e%3cfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3e%3c/filter%3e%3c/defs%3e%3crect width='100%25' height='100%25' filter='url(%23n)' opacity='.07'/%3e%3c/svg%3e");
                border: 3px solid var(--color-wood-light);
                border-radius: 8px;
                z-index: 20;
                pointer-events: none;
                user-select: none;
                animation: card-fade-in-up 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                box-shadow: 4px 4px 0 var(--color-shadow-main);
                color: var(--color-text-dark);
            }
            .puck-info-card.render-down { animation-name: card-fade-in-down; }

            .puck-info-card.ultimate-border {
                --border-angle: 0deg;
                border: 3px solid;
                border-image: conic-gradient(from var(--border-angle), #ff00de, #00f6ff, #ff00de) 1;
                animation: card-fade-in-up 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards, ultimate-border-flow 3s linear infinite;
            }
            
            .card-pointer {
                position: absolute; bottom: -12px; left: calc(50% + var(--pointer-offset));
                transform: translateX(-50%); width: 20px; height: 12px;
                background-color: var(--color-wood-light);
                clip-path: polygon(0 0, 100% 0, 50% 100%);
            }
            .puck-info-card.ultimate-border .card-pointer {
                background-color: #00f6ff;
            }
            .puck-info-card.render-down .card-pointer {
                bottom: auto; top: -12px;
                transform: translateX(-50%) rotate(180deg);
            }

            .card-content { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
            .card-header { display: flex; align-items: center; gap: 1rem; margin-top: ${statusBadge ? '0.75rem' : '0'}; }
            .card-puck-icon { flex-shrink: 0; width: 60px; height: 60px; }
            .puck-name { font-family: var(--font-family-main); font-size: 2rem; color: var(--color-text-dark); line-height: 1.1; }
            .puck-description { font-size: 0.9rem; color: #c9d1d9; line-height: 1.5; border-left: 3px solid var(--team-color); padding-left: 0.75rem; opacity: 0.9; }
            .puck-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
            .stat-item { background: var(--color-background-paper); padding: 0.5rem; border-radius: 6px; font-size: 0.9rem; border: 1px solid var(--color-wood-medium); }
            .stat-item .label { color: #8b949e; font-size: 0.75rem; display: block; margin-bottom: 0.125rem; }
            .stat-item .value { color: var(--color-text-dark); font-weight: 700; }
            .status-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); padding: 0.3rem 1rem; font-size: 0.8rem; font-weight: 800; border-radius: 20px; text-transform: uppercase; animation: badge-pop-in 0.3s 0.2s ease-out backwards; white-space: nowrap; border: 3px solid var(--color-shadow-main); box-shadow: 0 4px 0 var(--color-shadow-main); }
            @keyframes badge-pop-in { from { transform: translateX(-50%) scale(0.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }
            .status-badge.charged { background-color: var(--color-accent-yellow); color: #161b22; }
            .status-badge.royal { background-color: ${UI_COLORS.GOLD}; color: #161b22; }
            .status-badge.ultimate { background: linear-gradient(90deg, #ff00de, #00f6ff, #ff00de); background-size: 200% 100%; animation: badge-pop-in 0.3s 0.1s ease-out backwards, ultimate-border-flow 3s linear infinite; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
        `}</style>
        <div style={cardStyle} className={cardClass}>
            {statusBadge}
            <div className="card-content">
                <div className="card-header">
                    <div className="card-puck-icon">
                         <svg viewBox="-25 -25 50 50" style={{width: '100%', height: '100%'}}>
                            <PuckShape puck={puck} />
                        </svg>
                    </div>
                    <h3 className="puck-name">{info.name}</h3>
                </div>
                <p className="puck-description">{info.description}</p>
                <div className="puck-stats">
                    <div className="stat-item"><span className="label">Puntos de Gol</span><span className="value">{PUCK_GOAL_POINTS[puck.puckType]}</span></div>
                    <div className="stat-item"><span className="label">Peso (Masa)</span><span className="value">{props.mass}</span></div>
                    <div className="stat-item"><span className="label">Líneas para Cargar</span><span className="value">{props.linesToCrossForBonus}</span></div>
                    {puck.puckType === 'PAWN' && puck.durability !== undefined && (
                        <div className="stat-item"><span className="label">Durabilidad</span><span className="value">{puck.durability} / {PAWN_DURABILITY}</span></div>
                    )}
                </div>
            </div>
            <div className="card-pointer"></div>
        </div>
        </>
    );
};

export default InfoPanel;
