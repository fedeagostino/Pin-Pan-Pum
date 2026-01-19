
import React, { useState } from 'react';
import { Team, PuckType, SynergyType } from '../types';
import { TRANSLATIONS, Language, SCORE_TO_WIN, PUCK_TYPE_PROPERTIES, PUCK_GOAL_POINTS, SYNERGY_EFFECTS, UI_COLORS } from '../constants';
import PuckTypeIcon from './PuckTypeIcon';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    playSound: (sound: string) => void;
    team: Team | null;
    lang: Language;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, playSound, team, lang }) => {
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<keyof typeof t.TABS>('GOAL');

    if (!isOpen) return null;

    const handleClose = () => {
        playSound('UI_CLICK_2');
        onClose();
    };

    const handleTabClick = (tab: keyof typeof t.TABS) => {
        playSound('UI_CLICK_1');
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'GOAL':
                return (
                    <div className="tab-pane">
                        <p className="help-p">
                            {lang === 'es' 
                                ? `El objetivo principal es ser el primero en anotar ${SCORE_TO_WIN} puntos en la portería rival.` 
                                : `The main objective is to be the first to score ${SCORE_TO_WIN} points in the opponent's goal.`}
                        </p>
                        <div className="info-box">
                            <h4 style={{ color: UI_COLORS.GOLD }}>{lang === 'es' ? 'COMO MARCAR' : 'HOW TO SCORE'}</h4>
                            <p>{lang === 'es' 
                                ? 'Solo puedes marcar goles con fichas que estén CARGADAS (brillo amarillo). Las fichas se cargan al cruzar las líneas imaginarias entre tus otras piezas.' 
                                : 'You can only score goals with CHARGED pucks (yellow glow). Pucks are charged by crossing the imaginary lines between your other pieces.'}</p>
                        </div>
                        <div className="info-box" style={{ borderLeftColor: UI_COLORS.GOLD }}>
                            <h4 style={{ color: UI_COLORS.GOLD }}>{lang === 'es' ? 'VALOR DEL REY' : 'KING VALUE'}</h4>
                            <p>{lang === 'es'
                                ? '¡El Rey vale 2 PUNTOS! Úsalo con sabiduría para remontar o sentenciar la partida.'
                                : 'The King is worth 2 POINTS! Use it wisely to come back or end the match.'}</p>
                        </div>
                    </div>
                );
            case 'CONTROLS':
                return (
                    <div className="tab-pane">
                        <ul className="help-list">
                            <li><strong>{lang === 'es' ? 'Disparar:' : 'Shoot:'}</strong> {lang === 'es' ? 'Arrastra una ficha hacia atrás y suelta.' : 'Drag a puck backwards and release.'}</li>
                            <li><strong>{lang === 'es' ? 'Cancelar:' : 'Cancel:'}</strong> {lang === 'es' ? 'Suelta la ficha cerca de su posición original.' : 'Release the puck near its original position.'}</li>
                            <li><strong>{lang === 'es' ? 'Información:' : 'Info:'}</strong> {lang === 'es' ? 'Mantén pulsada una ficha para ver sus estadísticas.' : 'Hold a puck to see its statistics.'}</li>
                            <li><strong>{lang === 'es' ? 'Pulsar:' : 'Pulsar:'}</strong> {lang === 'es' ? 'Activa el botón de Pulsar cuando esté lleno para un tiro devastador.' : 'Activate the Pulsar button when full for a devastating shot.'}</li>
                        </ul>
                    </div>
                );
            case 'RULES':
                return (
                    <div className="tab-pane scrollable">
                        <div className="rules-list">
                            {(t as any).RULES_CONTENT.map((rule: any, index: number) => (
                                <div key={index} className="rule-item">
                                    <div className="rule-number">{index + 1}</div>
                                    <div className="rule-body">
                                        <h5 className="rule-title">{rule.title}</h5>
                                        <p className="rule-desc">{rule.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'PUCKS':
                return (
                    <div className="tab-pane scrollable">
                        <div className="puck-grid">
                            {(Object.keys(t.PUCK_INFO) as PuckType[]).map(type => (
                                <div key={type} className="puck-help-item">
                                    <div className="puck-help-icon">
                                        <PuckTypeIcon puckType={type} teamColor="#ff0000" />
                                    </div>
                                    <div className="puck-help-details">
                                        <h5>{t.PUCK_INFO[type].name}</h5>
                                        <p>{t.PUCK_INFO[type].desc}</p>
                                        <small>{lang === 'es' ? 'Puntos:' : 'Points:'} {PUCK_GOAL_POINTS[type]} | {lang === 'es' ? 'Masa:' : 'Mass:'} {PUCK_TYPE_PROPERTIES[type].mass}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'SYNERGIES':
                return (
                    <div className="tab-pane scrollable">
                        <p className="help-p" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {lang === 'es' 
                                ? 'Las sinergias se activan al apuntar a través de una línea formada por dos fichas específicas.' 
                                : 'Synergies are activated by aiming through a line formed by two specific pucks.'}
                        </p>
                        <div className="synergy-list">
                            {(Object.keys(t.SYNERGY_INFO) as SynergyType[]).map(type => (
                                <div key={type} className="synergy-help-item" style={{ borderColor: SYNERGY_EFFECTS[type].color }}>
                                    <h5 style={{ color: SYNERGY_EFFECTS[type].color }}>{t.SYNERGY_INFO[type].name}</h5>
                                    <p>{t.SYNERGY_INFO[type].desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={handleClose}>
            <style>{`
                .help-card {
                    background: #000;
                    border: 2px solid #ff0000;
                    padding: 0;
                    max-width: 650px;
                    width: 95%;
                    height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 0 40px rgba(255, 0, 0, 0.5);
                    color: white;
                    overflow: hidden;
                    animation: card-fade-in-up 0.4s ease-out;
                }
                .help-header {
                    padding: 1.5rem;
                    text-align: center;
                    border-bottom: 1px solid #333;
                }
                .help-title { 
                    font-family: var(--font-family-title); 
                    color: #ff0000; 
                    font-size: 2.2rem; 
                    margin: 0;
                    text-shadow: 0 0 10px #ff0000;
                }
                .tabs-nav {
                    display: flex;
                    background: #111;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .tab-btn {
                    flex: 1;
                    padding: 1rem;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #666;
                    font-family: var(--font-family-title);
                    font-size: 0.9rem;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s;
                }
                .tab-btn.active {
                    color: #ff0000;
                    border-bottom-color: #ff0000;
                    background: rgba(255,0,0,0.1);
                }
                .help-content-area {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                }
                .tab-pane.scrollable {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .help-p { line-height: 1.6; color: #ccc; margin-bottom: 1.5rem; }
                .info-box {
                    background: #0a0a0a;
                    border: 1px solid #333;
                    padding: 1rem;
                    border-left: 4px solid var(--color-red-neon);
                    margin-bottom: 1rem;
                }
                .help-list { list-style: none; padding: 0; }
                .help-list li { margin-bottom: 1rem; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.5rem; }
                .help-list strong { color: #ff0000; display: block; font-size: 0.8rem; text-transform: uppercase; }

                .rules-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .rule-item { display: flex; gap: 1.2rem; align-items: flex-start; }
                .rule-number { 
                    width: 32px; height: 32px; background: #ff0000; color: black; 
                    display: flex; align-items: center; justify-content: center; 
                    font-weight: 900; border-radius: 4px; flex-shrink: 0;
                    font-family: var(--font-family-title);
                }
                .rule-title { margin: 0 0 0.3rem 0; color: #ff0000; font-size: 1.1rem; text-transform: uppercase; }
                .rule-desc { margin: 0; font-size: 0.9rem; color: #ccc; line-height: 1.4; }

                .puck-grid { display: grid; gap: 1rem; }
                .puck-help-item {
                    display: flex;
                    gap: 1rem;
                    background: #0a0a0a;
                    padding: 0.75rem;
                    border: 1px solid #222;
                    align-items: center;
                }
                .puck-help-icon { width: 50px; height: 50px; flex-shrink: 0; }
                .puck-help-details h5 { margin: 0; color: #fff; font-size: 1.1rem; }
                .puck-help-details p { margin: 0.2rem 0; font-size: 0.8rem; color: #aaa; }
                .puck-help-details small { color: #ff0000; font-weight: bold; }

                .synergy-list { display: flex; flex-direction: column; gap: 1rem; }
                .synergy-help-item {
                    border-left: 4px solid;
                    background: #0a0a0a;
                    padding: 1rem;
                }
                .synergy-help-item h5 { margin: 0 0 0.5rem 0; font-size: 1.1rem; text-transform: uppercase; }
                .synergy-help-item p { margin: 0; font-size: 0.85rem; color: #ccc; }

                .help-footer {
                    padding: 1rem;
                    border-top: 1px solid #333;
                }
                .close-btn { 
                    width: 100%; padding: 0.8rem; background: #ff0000; color: black; 
                    border: none; font-family: var(--font-family-title); font-size: 1.2rem; cursor: pointer;
                    transition: transform 0.2s;
                }
                .close-btn:hover { transform: scale(1.02); }
            `}</style>
            <div className="help-card" onMouseDown={e => e.stopPropagation()}>
                <div className="help-header">
                    <h2 className="help-title">{t.HELP}</h2>
                </div>
                
                <nav className="tabs-nav">
                    {(Object.keys(t.TABS) as (keyof typeof t.TABS)[]).map(tabKey => (
                        <button 
                            key={tabKey}
                            className={`tab-btn ${activeTab === tabKey ? 'active' : ''}`}
                            onClick={() => handleTabClick(tabKey)}
                        >
                            {t.TABS[tabKey]}
                        </button>
                    ))}
                </nav>

                <div className="help-content-area">
                    {renderTabContent()}
                </div>

                <div className="help-footer">
                    <button className="close-btn" onClick={handleClose}>{t.BACK}</button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
