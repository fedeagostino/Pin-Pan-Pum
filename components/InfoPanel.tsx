
import React from 'react';
import { Puck, SpecialShotStatus } from '../types';
import { TRANSLATIONS, PUCK_TYPE_PROPERTIES, TEAM_COLORS, PUCK_GOAL_POINTS, Language } from '../constants';

interface InfoPanelProps {
    puck: Puck;
    specialShotStatus: SpecialShotStatus;
    renderDirection?: 'up' | 'down';
    pointerHorizontalOffset?: number;
    lang: Language;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ puck, specialShotStatus = 'NONE', renderDirection = 'up', pointerHorizontalOffset = 0, lang }) => {
    const t = TRANSLATIONS[lang];
    const info = t.PUCK_INFO[puck.puckType];
    const props = PUCK_TYPE_PROPERTIES[puck.puckType];
    const teamColor = TEAM_COLORS[puck.team];

    const cardStyle = {
        '--team-color': teamColor,
        '--pointer-offset': `${pointerHorizontalOffset}px`,
    } as React.CSSProperties;

    return (
        <>
        <style>{`
            .puck-info-card {
                position: relative;
                width: 320px;
                background: #000;
                border: 2px solid var(--team-color);
                border-radius: 4px;
                box-shadow: 0 0 20px rgba(0,0,0,0.5), 0 0 10px var(--team-color);
                z-index: 20;
                color: #fff;
                padding: 1rem;
                animation: card-fade-in-up 0.3s ease-out;
            }
            .puck-name { 
                font-family: var(--font-family-title);
                font-size: 1.8rem;
                color: var(--team-color);
                text-shadow: 0 0 10px var(--team-color);
                margin-bottom: 0.5rem;
                border-bottom: 1px solid #333;
            }
            .puck-description {
                font-size: 0.9rem;
                line-height: 1.4;
                color: #ccc;
                margin-bottom: 1rem;
            }
            .stat-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }
            .stat-item { 
                background: #111; 
                border: 1px solid #222; 
                padding: 0.4rem; 
                border-radius: 2px;
                display: flex;
                flex-direction: column;
            }
            .stat-item .label { font-size: 0.65rem; color: #666; text-transform: uppercase; }
            .stat-item .value { font-weight: 700; color: #fff; font-size: 0.9rem; }
            
            .ability-box {
                border-top: 1px solid #333;
                padding-top: 0.5rem;
            }
            .ability-title {
                font-family: var(--font-family-title);
                color: var(--team-color);
                font-size: 0.9rem;
                margin-bottom: 0.2rem;
            }
            .ability-desc {
                font-size: 0.8rem;
                color: #888;
                line-height: 1.3;
            }
        `}</style>
        <div style={cardStyle} className="puck-info-card">
            <div className="card-content">
                <h3 className="puck-name">{info.name}</h3>
                <p className="puck-description">{info.desc}</p>
                <div className="stat-grid">
                    <div className="stat-item">
                        <span className="label">{lang === 'es' ? 'Puntos' : 'Points'}</span>
                        <span className="value">{PUCK_GOAL_POINTS[puck.puckType]}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">{lang === 'es' ? 'Peso' : 'Mass'}</span>
                        <span className="value">{props.mass}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">{lang === 'es' ? 'Fricción' : 'Friction'}</span>
                        <span className="value">{props.friction}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">{lang === 'es' ? 'Carga (Líneas)' : 'Charge (Lines)'}</span>
                        <span className="value">{props.linesToCrossForBonus}</span>
                    </div>
                </div>
                
                <div className="ability-box">
                    <h4 className="ability-title">{lang === 'es' ? 'ESPECIAL' : 'SPECIAL'}</h4>
                    <p className="ability-desc">{info.desc}</p>
                </div>
            </div>
        </div>
        </>
    );
};

export default InfoPanel;
