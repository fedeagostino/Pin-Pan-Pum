import React, { useState } from 'react';
import { PuckType, Team } from '../types';
import { PUCK_TYPE_INFO, SCORE_TO_WIN, PUCK_TYPE_PROPERTIES, PUCK_GOAL_POINTS, GUARDIAN_DURABILITY } from '../constants';
import PuckTypeIcon from './PuckTypeIcon';

type HelpTab = 'objetivo' | 'controles' | 'reglas' | 'fichas';

// --- SVG ICONS ---
const GoalIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>;
const LinesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M2 6h20M2 18h20" /></svg>;
const RoyalShotIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17.5 13.5l-3.5 3.5l-3.5 -3.5" /><path d="M17.5 8.5l-3.5 3.5l-3.5 -3.5" /><path d="M14 17h-4" /><path d="M14 5h-4" /><path d="M6 17v-10l-2 2" /></svg>;
const BonusTurnIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" /></svg>;
const PulsarIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3.634 19.366a9 9 0 1 1 11.366 -16.366l-2 15l-3 -6l-4 4l3 6z" /></svg>;
const OrbIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>;
const TurnLossIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M10 10l4 4m0 -4l-4 4" /></svg>;

// --- Tab Button Icons ---
const TabIconObjetivo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const TabIconControles = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.75a2 2 0 100 4 2 2 0 000-4zM4 3.75a2 2 0 100 4 2 2 0 000-4zM16 3.75a2 2 0 100 4 2 2 0 000-4zM10 9.75a2 2 0 100 4 2 2 0 000-4zM4 9.75a2 2 0 100 4 2 2 0 000-4zM16 9.75a2 2 0 100 4 2 2 0 000-4z" /></svg>;
const TabIconReglas = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm5.75 4a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0V6zM10 10.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM8.5 10.25a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0v-.01zM11.5 10.25a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0v-.01zM8.5 12.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM10 14a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0V14zM11.5 12.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const TabIconFichas = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 11a6 6 0 016 6H4a6 6 0 016-6z" /></svg>;


// --- TAB CONTENT COMPONENTS ---
const ObjetivoTab: React.FC = () => (
    <div className="help-section">
        <h3>Objetivo del Juego</h3>
        <p>El objetivo es ser el primer jugador en anotar <strong>{SCORE_TO_WIN}</strong> puntos. Para anotar un gol, una de tus fichas <strong>cargadas</strong> debe entrar completamente en la portería rival.</p>
        <p>Si el marcador llega a {SCORE_TO_WIN - 1}-{SCORE_TO_WIN - 1} (empate), se activa la regla de "muerte súbita": el primer jugador en conseguir una ventaja de 2 puntos gana la partida.</p>
    </div>
);

const ControlesTab: React.FC = () => (
    <>
        <div className="help-section">
            <h3>Arrastrar y Soltar</h3>
            <p>Selecciona una de tus fichas activas. Arrastra en la dirección opuesta a donde quieres disparar. ¡Cuanto más arrastres, más potente será el tiro!</p>
            <div className="animation-container">
                <svg viewBox="0 0 300 150">
                    <style>{`
                        @keyframes help-drag-anim { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-80px, 0); } }
                        @keyframes help-shoot-anim { 0%, 40% { transform: translate(0, 0); opacity: 1; } 90% { transform: translate(120px, 0); opacity: 1; } 100% { transform: translate(120px, 0); opacity: 0; } }
                        #help-drag-line, #help-arrow-tip { animation: help-drag-anim 4s infinite ease-in-out; }
                        #help-puck-shot { animation: help-shoot-anim 4s infinite ease-in-out; }
                    `}</style>
                    <g id="help-puck-shot"><circle cx="100" cy="75" r="20" fill="var(--color-blue-neon)" filter="url(#pulsar-glow)"/><circle cx="100" cy="75" r="20" fill="var(--color-blue-neon)" stroke="#010409" strokeWidth="2"/></g>
                    <line id="help-drag-line" x1="100" y1="75" x2="180" y2="75" stroke="white" strokeWidth="3" strokeDasharray="5 5" /><path id="help-arrow-tip" d="M180 75 l-10 -6 v12 z" fill="white" />
                </svg>
            </div>
        </div>
        <div className="help-section">
            <h3>Cargar Fichas</h3>
            <p>Una ficha debe estar <strong>cargada</strong> para poder marcar un gol. Para cargarla, dispárala de forma que su trayectoria cruce las "líneas imaginarias" que se forman entre tus otras fichas.</p>
            <div className="animation-container">
                 <svg viewBox="0 0 300 150">
                     <defs><filter id="help-charged-glow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fde047" floodOpacity="1" /></filter></defs>
                     <style>{`
                        @keyframes help-line-cross-anim { 0% { transform: translate(0, 40px); } 60% { transform: translate(0, -40px); } 100% { transform: translate(0, -40px); } }
                        @keyframes help-line-flash-anim { 0%, 100%, 45% { stroke: rgba(255,255,255,0.4); } 50% { stroke: var(--color-accent-yellow); stroke-width: 4px; } }
                        @keyframes help-puck-charge-anim { 0%, 49% { filter: none; } 50%, 100% { filter: url(#help-charged-glow); } }
                        @keyframes help-text-pop-in { 0%, 49% { opacity: 0; transform: scale(0.5) translateY(10px); } 50% { opacity: 1; transform: scale(1); } 70% { opacity: 1; transform: scale(1); } 80%, 100% { opacity: 0; transform: scale(1.2) translateY(0); } }
                        #help-crossing-puck { animation: help-line-cross-anim 4s infinite cubic-bezier(0.5, 0, 0.5, 1); }
                        #help-imaginary-line { animation: help-line-flash-anim 4s infinite ease-in-out; }
                        #help-crossing-puck-visuals { animation: help-puck-charge-anim 4s infinite ease-in-out; }
                        #help-charged-text { font-size: 1.2rem; font-weight: 800; fill: #fde047; text-anchor: middle; paint-order: stroke; stroke: black; stroke-width: 4px; animation: help-text-pop-in 4s infinite ease-in-out; }
                     `}</style>
                    <circle cx="80" cy="75" r="15" fill="#6b7280" /><circle cx="220" cy="75" r="15" fill="#6b7280" />
                    <line id="help-imaginary-line" x1="80" y1="75" x2="220" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 4" />
                    <g id="help-crossing-puck"><g id="help-crossing-puck-visuals"><circle cx="150" cy="75" r="18" fill="var(--color-blue-neon)" stroke="#010409" strokeWidth="2"/></g></g>
                    <text x="150" y="45" id="help-charged-text">¡CARGADO!</text>
                </svg>
            </div>
        </div>
    </>
);

const ReglasTab: React.FC = () => (
    <div className="help-section">
        <h3>Reglas Clave</h3>
        <div className="rules-list">
            <div className="rule-item"><div className="rule-icon"><RoyalShotIcon /></div><div className="rule-details"><h4>Tiro Real y Definitivo</h4><p>Cuando todas tus fichas Guardianas están cargadas, tu ficha Rey desbloquea un <strong>Tiro Real</strong>, un disparo superpotente. Si además cargas a todos tus peones, el Rey desata un <strong>Tiro Definitivo</strong>, aún más devastador y capaz de destruir fichas rivales.</p></div></div>
            <div className="rule-item"><div className="rule-icon"><BonusTurnIcon /></div><div className="rule-details"><h4>Turno Extra (Tiro en Cadena)</h4><p>Al cargar una ficha, obtienes un <strong>turno extra inmediato</strong>. Puedes seleccionar otra ficha y disparar de nuevo mientras las demás aún están en movimiento, permitiendo combos espectaculares.</p></div></div>
            <div className="rule-item"><div className="rule-icon"><PulsarIcon /></div><div className="rule-details"><h4>Poder Pulsar</h4><p>Ganas poder al cruzar líneas y golpear orbes. Cuando la barra de Poder Pulsar se llena, puedes activarla antes de tu disparo para lanzar un <strong>Tiro Pulsar</strong> con una potencia descomunal.</p></div></div>
            <div className="rule-item"><div className="rule-icon"><OrbIcon /></div><div className="rule-details"><h4>Orbes y Sobrecarga</h4><p>Periódicamente, aparecen orbes de poder en los bordes. Golpéalos para ganar mucho Poder Pulsar. Al recolectar 3 orbes, tu equipo entra en estado de <strong>Sobrecarga</strong> durante un turno, repeliendo a las fichas enemigas cercanas.</p></div></div>
            <div className="rule-item"><div className="rule-icon"><TurnLossIcon /></div><div className="rule-details"><h4>Pérdida de Turno</h4><p>Pierdes tu turno instantáneamente si cometes una de las siguientes faltas:</p><ul><li><strong>Autogol:</strong> Marcar en tu propia portería.</li><li><strong>Gol Ilegal:</strong> Marcar con una ficha que no estaba cargada.</li><li><strong>Fallo Especial:</strong> Realizar un Tiro Real o Definitivo sin marcar un gol.</li></ul></div></div>
        </div>
    </div>
);

const FichasTab: React.FC = () => (
    <div className="help-section">
        <h3>Tipos de Ficha</h3>
        <div className="puck-list">
            {Object.entries(PUCK_TYPE_INFO).map(([puckType, info]) => {
                const props = PUCK_TYPE_PROPERTIES[puckType as PuckType];
                return (
                    <div key={puckType} className="puck-info-item">
                        <PuckTypeIcon puckType={puckType as PuckType} className="puck-info-icon" />
                        <div className="puck-info-details">
                            <h4>{info.name}</h4>
                            <p>{info.description}</p>
                            <div className="puck-stats-icons">
                                <div className="stat-icon-item" title="Puntos de Gol"><GoalIcon /><span>{PUCK_GOAL_POINTS[puckType as PuckType]}</span></div>
                                <div className="stat-icon-item" title="Líneas para Cargar"><LinesIcon /><span>{props.linesToCrossForBonus}</span></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void; playSound: (sound: string) => void; team: Team | null; }> = ({ isOpen, onClose, playSound, team }) => {
    const [activeTab, setActiveTab] = useState<HelpTab>('objetivo');

    if (!isOpen) return null;

    const handleClose = () => { playSound('UI_CLICK_2'); onClose(); };
    const handleTabClick = (tab: HelpTab) => { playSound('UI_CLICK_1'); setActiveTab(tab); };

    const containerStyle: React.CSSProperties = team === 'BLUE' ? { transform: 'rotate(180deg)' } : {};
    const TABS: { id: HelpTab, label: string, icon: React.FC }[] = [
        { id: 'objetivo', label: 'Objetivo', icon: TabIconObjetivo },
        { id: 'controles', label: 'Controles', icon: TabIconControles },
        { id: 'reglas', label: 'Reglas', icon: TabIconReglas },
        { id: 'fichas', label: 'Fichas', icon: TabIconFichas },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'objetivo': return <ObjetivoTab />;
            case 'controles': return <ControlesTab />;
            case 'reglas': return <ReglasTab />;
            case 'fichas': return <FichasTab />;
            default: return null;
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={handleClose}>
            <style>{`
                .help-modal-container {
                    width: 90%; max-width: 800px;
                    height: 90vh; max-height: 850px;
                    animation: modal-content-pop-in 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }
                .help-modal {
                    background: var(--color-bg-glass);
                    border: 1px solid var(--color-border-glass);
                    border-radius: 16px; box-shadow: 0 0 40px rgba(0,0,0,0.7);
                    width: 100%; height: 100%; display: flex;
                    overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                }
                .help-modal-close-btn {
                    position: absolute; top: 12px; right: 12px;
                    background: var(--color-bg-dark); border: 1px solid var(--color-border);
                    color: var(--color-text-medium); font-size: 1.5rem; cursor: pointer;
                    line-height: 1; width: 36px; height: 36px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease; z-index: 20;
                }
                .help-modal-close-btn:hover { color: white; transform: scale(1.1); border-color: white; }
                
                .help-modal-sidebar {
                    width: 200px; background: rgba(0,0,0,0.2);
                    padding: 1rem; flex-shrink: 0;
                    border-right: 1px solid var(--color-border-glass);
                    display: flex; flex-direction: column; gap: 0.5rem;
                }
                .help-tab-btn {
                    width: 100%; padding: 0.75rem 1rem; background: transparent;
                    border: 1px solid transparent; border-radius: 8px;
                    color: var(--color-text-medium); font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s ease; text-align: left;
                    display: flex; align-items: center; gap: 0.75rem;
                }
                .help-tab-btn svg { width: 20px; height: 20px; }
                .help-tab-btn:hover { background: var(--color-bg-light); color: white; }
                .help-tab-btn.active { 
                    background: var(--color-bg-medium); color: var(--color-accent-green);
                    border-color: var(--color-border);
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
                }

                .help-modal-main { flex-grow: 1; display: flex; flex-direction: column; }
                .help-modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border-glass); flex-shrink: 0; }
                .help-modal-title { font-size: 1.75rem; font-weight: 800; color: white; }

                .help-modal-content { padding: 1.5rem; overflow-y: auto; }
                .help-modal-content::-webkit-scrollbar { width: 8px; }
                .help-modal-content::-webkit-scrollbar-track { background: transparent; }
                .help-modal-content::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

                .help-section { margin-bottom: 2rem; } .help-section:last-child { margin-bottom: 0; }
                .help-section h3 { font-size: 1.3rem; font-weight: 700; color: var(--color-accent-green); margin-bottom: 1rem; }
                .help-section p { font-size: 0.95rem; color: var(--color-text-light); line-height: 1.6; margin-bottom: 1rem; }
                .animation-container { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; margin-top: 1rem; border: 1px solid var(--color-border-glass); }
                
                .puck-list, .rules-list { display: flex; flex-direction: column; gap: 1rem; }
                .puck-info-item, .rule-item { background-color: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-border-glass); }
                .puck-info-item { display: grid; grid-template-columns: 48px 1fr; gap: 1rem; align-items: flex-start; }
                .puck-info-icon { flex-shrink: 0; width: 48px; height: 48px; }
                .puck-info-details h4, .rule-details h4 { font-size: 1.1rem; font-weight: 700; color: white; margin: 0 0 0.25rem 0; }
                .puck-info-details p, .rule-details p { font-size: 0.85rem; color: var(--color-text-medium); line-height: 1.5; margin: 0; }
                
                .puck-stats-icons { display: flex; gap: 1rem; margin-top: 0.5rem; }
                .stat-icon-item { display: flex; align-items: center; gap: 0.35rem; color: var(--color-text-medium); }
                .stat-icon-item svg { width: 16px; height: 16px; }
                .stat-icon-item span { font-size: 0.9rem; font-weight: 600; color: white; }

                .rule-item { display: grid; grid-template-columns: 32px 1fr; gap: 1rem; align-items: flex-start; }
                .rule-icon { width: 32px; height: 32px; color: var(--color-accent-purple); }
                .rule-details ul { list-style: none; padding-left: 1rem; margin-top: 0.5rem; }
                .rule-details li { position: relative; padding-left: 1rem; font-size: 0.9rem; margin-bottom: 0.25rem; color: var(--color-text-medium); }
                .rule-details li::before { content: '•'; position: absolute; left: 0; color: var(--color-accent-purple); }

                 @media (max-width: 768px) {
                    .help-modal-sidebar { display: none; }
                    .help-modal { flex-direction: column; }
                    .help-modal-header { display: none; }
                    .help-modal-main { border-top: 1px solid var(--color-border-glass); }
                 }
            `}</style>
            <div className="help-modal-container" onMouseDown={(e) => e.stopPropagation()} style={containerStyle}>
                <div className="help-modal">
                    <aside className="help-modal-sidebar">
                        <h2 className="help-modal-title" style={{padding: '0.75rem 0.5rem', marginBottom: '0.5rem', fontSize: '1.5rem'}}>AYUDA</h2>
                        {TABS.map(tab => (
                            <button key={tab.id} className={`help-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabClick(tab.id)}>
                                <tab.icon />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </aside>
                     <main className="help-modal-main">
                        <header className="help-modal-header">
                            <h2 className="help-modal-title">{TABS.find(t => t.id === activeTab)?.label}</h2>
                        </header>
                        <div className="help-modal-content">
                            {renderTabContent()}
                        </div>
                    </main>
                </div>
                <button className="help-modal-close-btn" onClick={handleClose} aria-label="Cerrar">&times;</button>
            </div>
        </div>
    );
};

export default HelpModal;