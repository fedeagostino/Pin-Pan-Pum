
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
                border: 2px solid #ff0000;
                border-radius: 4px;
                box-shadow: 0 0 20px #ff0000, inset 0 0 10px rgba(255,0,0,0.3);
                z-index: 20;
                color: #fff;
                padding: 1rem;
            }
            .puck-name { 
                font-family: var(--font-family-title);
                font-size: 1.8rem;
                color: #ff0000;
                text-shadow: 0 0 10px #ff0000;
                margin-bottom: 0.5rem;
                border-bottom: 1px solid #333;
            }
            .puck-description {
                font-size: 0.9rem;
                line-height: 1.4;
                color: #ccc;
                margin-bottom: 1rem;
            }
            .stat-item { background: #111; border: 1px solid #222; padding: 0.4rem; border-radius: 2px; }
            .stat-item .label { font-size: 0.7rem; color: #666; text-transform: uppercase; }
            .stat-item .value { font-weight: 700; color: #fff; }
        `}</style>
        <div style={cardStyle} className="puck-info-card">
            <div className="card-content">
                <h3 className="puck-name">{info.name}</h3>
                <p className="puck-description">{info.desc}</p>
                <div className="puck-stats" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                    <div className="stat-item"><span className="label">{lang === 'es' ? 'Puntos' : 'Points'}</span><span className="value">{PUCK_GOAL_POINTS[puck.puckType]}</span></div>
                    <div className="stat-item"><span className="label">{lang === 'es' ? 'Peso' : 'Mass'}</span><span className="value">{props.mass}</span></div>
                </div>
            </div>
        </div>
        </>
    );
};

export default InfoPanel;
