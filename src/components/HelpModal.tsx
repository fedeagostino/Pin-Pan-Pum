import React, { useState } from 'react';
import { PuckType, SynergyType, Team } from '../types';
import { PUCK_TYPE_INFO, SYNERGY_DESCRIPTIONS, SYNERGY_COMBOS, SCORE_TO_WIN, PUCK_TYPE_PROPERTIES, PUCK_GOAL_POINTS } from '../constants';
import PuckTypeIcon from './PuckTypeIcon';

type HelpTab = 'objetivo' | 'controles' | 'reglas' | 'fichas' | 'sinergias';

// --- STYLIZED SVG ICONS ---
const GoalIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>;
const LinesIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 18l16 0" /><path d="M4 12l16 0" /><path d="M4 6l16 0" /></svg>;
const RoyalShotIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 18h-12a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 3l0 3" /><path d="M12 18l0 3" /></svg>;
const BonusTurnIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-2.5 -4l0 6l6 0" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m2.5 4l0 -6l-6 0" /></svg>;
const PulsarIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3l0 2" /><path d="M12 19l0 2" /><path d="M3 12l2 0" /><path d="M19 12l2 0" /><path d="M5.6 5.6l1.4 1.4" /><path d="M17 17l1.4 1.4" /><path d="M5.6 18.4l1.4 -1.4" /><path d="M17 7l1.4 -1.4" /><path d="M9 12l6 0" /></svg>;
const OrbIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17.112 10.151c.32 .322 .623 .656 .912 .999" /><path d="M18.024 11.15c.29 .343 .57 .697 .836 1.058" /><path d="M18.86 12.208c.267 .36 .517 .727 .75 1.1" /><path d="M19.61 13.308c.233 .373 .447 .753 .64 1.138" /><path d="M12 21c-3.187 0 -6.56-1.683 -9-5.143c2.44 -3.46 5.813 -5.143 9 -5.143" /><path d="M12 10.714c3.187 0 6.56 1.683 9 5.143c-2.44 3.46 -5.813 5.143 -9 5.143" /><path d="M3 15.857c2.44 -3.46 5.813 -5.143 9 -5.143" /><path d="M14.888 15.7c.32 -.322 .623 -.656 .912 -.999" /><path d="M15.8 14.701c.29 -.343 .57 -.697 .836 -1.058" /><path d="M16.636 13.643c.267 -.36 .517 -.727 .75 -1.1" /><path d="M17.385 12.543c.233 -.373 .447 -.753 .64 -1.138" /><path d="M3 15.857c2.44 3.46 5.813 5.143 9 5.143" /></svg>;
const TurnLossIcon = () => <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3l18 18" /><path d="M15 21h-9a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3" /><path d="M18 14v4h4" /><path d="M14 18h-4v-4" /></svg>;

const TabIconObjetivo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const TabIconControles = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.75a2 2 0 100 4 2 2 0 000-4zM4 3.75a2 2 0 100 4 2 2 0 000-4zM16 3.75a2 2 0 100 4 2 2 0 000-4zM10 9.75a2 2 0 100 4 2 2 0 000-4zM4 9.75a2 2 0 100 4 2 2 0 000-4zM16 9.75a2 2 0 100 4 2 2 0 000-4z" /></svg>;
const TabIconReglas = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm5.75 4a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0V6zM10 10.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM8.5 10.25a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0v-.01zM11.5 10.25a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0v-.01zM8.5 12.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75zM10 14a.75.75 0 00-1.5 0v.01a.75.75 0 001.5 0V14zM11.5 12.25a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const TabIconFichas = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 11a6 6 0 016 6H4a6 6 0 016-6z" /></svg>;
const TabIconSinergias = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.216 2.457l-1.128 1.127a.75.75 0 01-1.06-1.06l1.127-1.128a5.5 5.5 0 018.472-8.472l1.128-1.127a.75.75 0 011.061 1.06l-1.127 1.128a5.501 5.501 0 01-.228 6.453z" clipRule="evenodd" /><path fillRule="evenodd" d="M4.688 8.576a5.5 5.5 0 019.216-2.457l1.128-1.127a.75.75 0 011.06 1.06l-1.127 1.128a5.5 5.5 0 01-8.472 8.472l-1.128 1.127a.75.75 0 01-1.06-1.06l1.127-1.128a5.501 5.501 0 01.228-6.453z" clipRule="evenodd" /></svg>;


// --- TAB CONTENT COMPONENTS ---
const ObjetivoTab: React.FC = () => (
    <div className="help-section">
        <h3>Objetivo del Juego</h3>
        <p>El objetivo es ser el primer jugador en anotar <strong className="text-yellow">{SCORE_TO_WIN}</strong> puntos. Para anotar un gol, una de tus fichas <strong className="text-yellow">cargadas</strong> debe entrar completamente en la portería rival.</p>
        <p>Si el marcador llega a <strong className="text-purple">{SCORE_TO_WIN - 1}-{SCORE_TO_WIN - 1}</strong> (empate), se activa la regla de "muerte súbita": el primer jugador en conseguir una ventaja de 2 puntos gana la partida.</p>
    </div>
);

const ControlesTab: React.FC = () => (
    <>
        <div className="help-section">
            <h3>Arrastrar y Soltar</h3>
            <p>Selecciona una de tus fichas activas. Arrastra en la dirección opuesta a donde quieres disparar. ¡Cuanto más arrastres, más potente será el tiro!</p>
            <div className="animation-container">
                <svg viewBox="0 0 300 150">
                    <defs><filter id="help-neon-glow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--color-primary-blue)" floodOpacity="0.8" /></filter></defs>
                    <style>{`
                        @keyframes help-drag-anim { 0%, 100% { transform: translate(0, 0); opacity: 1; } 50% { transform: translate(-80px, 0); opacity: 1;} 60% { opacity: 0; } }
                        @keyframes help-shoot-anim { 0%, 55% { transform: translate(0, 0); opacity: 1; } 90% { transform: translate(120px, 0); opacity: 1; } 100% { transform: translate(120px, 0); opacity: 0; } }
                        #help-drag-line, #help-arrow-tip { animation: help-drag-anim 4s infinite ease-in-out; }
                        #help-puck-shot { animation: help-shoot-anim 4s infinite ease-in-out; }
                    `}</style>
                    <g id="help-puck-shot"><circle cx="100" cy="75" r="20" fill="var(--color-primary-blue)" filter="url(#help-neon-glow)"/><circle cx="100" cy="75" r="20" fill="var(--color-primary-blue)" stroke="#010409" strokeWidth="2"/></g>
                    <line id="help-drag-line" x1="100" y1="75" x2="180" y2="75" stroke="white" strokeWidth="3" strokeDasharray="5 5" /><path id="help-arrow-tip" d="M180 75 l-10 -6 v12 z" fill="white" />
                </svg>
            </div>
        </div>
        <div className="help-section">
            <h3>Cargar Fichas</h3>
            <p>Una ficha debe estar <strong className="text-yellow">cargada</strong> para poder marcar. Para ello, dispárala de forma que cruce las <strong className="text-cyan">líneas imaginarias</strong> que se forman entre tus otras fichas.</p>
            <div className="animation-container">
                 <svg viewBox="0 0 300 150">
                     <defs><filter id="help-charged-glow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fde047" floodOpacity="1" /></filter></defs>
                     <style>{`
                        @keyframes help-line-cross-anim { 0% { transform: translate(0, 40px); } 60% { transform: translate(0, -40px); } 100% { transform: translate(0, -40px); } }
                        @keyframes help-line-flash-anim { 0%, 100%, 45% { stroke: rgba(34, 211, 238, 0.4); } 50% { stroke: #22d3ee; stroke-width: 4px; } }
                        @keyframes help-puck-charge-anim { 0%, 49% { filter: none; } 50%, 100% { filter: url(#help-charged-glow); } }
                        @keyframes help-text-pop-in { 0%, 49% { opacity: 0; transform: scale(0.5) translateY(10px); } 50% { opacity: 1; transform: scale(1); } 70% { opacity: 1; transform: scale(1); } 80%, 100% { opacity: 0; transform: scale(1.2) translateY(0); } }
                        #help-crossing-puck { animation: help-line-cross-anim 4s infinite cubic-bezier(0.5, 0, 0.5, 1); }
                        #help-imaginary-line { animation: help-line-flash-anim 4s infinite ease-in-out; }
                        #help-crossing-puck-visuals { animation: help-puck-charge-anim 4s infinite ease-in-out; }
                        #help-charged-text { font-family: var(--font-family-main); font-size: 1.2rem; fill: #fde047; text-anchor: middle; paint-order: stroke; stroke: black; stroke-width: 4px; animation: help-text-pop-in 4s infinite ease-in-out; }
                     `}</style>
                    <circle cx="80" cy="75" r="15" fill="#6b7280" /><circle cx="220" cy="75" r="15" fill="#6b7280" />
                    <line id="help-imaginary-line" x1="80" y1="75" x2="220" y2="75" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                    <g id="help-crossing-puck"><g id="help-crossing-puck-visuals"><circle cx="150" cy="75" r="18" fill="var(--color-primary-blue)" stroke="#010409" strokeWidth="2"/></g></g>
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
            <div className="rule-item"><div className="rule-icon icon-yellow"><RoyalShotIcon /></div><div className="rule-details"><h4>Tiro Real y Definitivo</h4><p>Al cargar todas tus fichas especiales, tu Rey desbloquea un <strong className="text-yellow">Tiro Real</strong>. Si además cargas todos tus peones, desata un <strong className="text-ultimate">Tiro Definitivo</strong>, capaz de destruir fichas rivales.</p></div></div>
            <div className="rule-item"><div className="rule-icon icon-green"><BonusTurnIcon /></div><div className="rule-details"><h4>Turno Extra</h4><p>Al cargar una ficha, obtienes un <strong className="text-green">turno extra inmediato</strong>. Puedes disparar otra ficha mientras las demás siguen en movimiento para crear combos.</p></div></div>
            <div className="rule-item"><div className="rule-icon icon-blue"><PulsarIcon /></div><div className="rule-details"><h4>Poder Pulsar</h4><p>Ganas poder al cruzar líneas y golpear orbes. Al llenar la barra, actívala para un <strong className="text-blue">Tiro Pulsar</strong> con potencia descomunal.</p></div></div>
            <div className="rule-item"><div className="rule-icon icon-cyan"><OrbIcon /></div><div className="rule-details"><h4>Orbes y Sobrecarga</h4><p>Golpea los orbes para ganar Poder Pulsar. Al recolectar 3, tu equipo entra en <strong className="text-cyan">Sobrecarga</strong> durante un turno, repeliendo a los rivales cercanos.</p></div></div>
            <div className="rule-item"><div className="rule-icon icon-red"><TurnLossIcon /></div><div className="rule-details"><h4>Pérdida de Turno</h4><p>Pierdes tu turno si cometes una falta: <strong className="text-red">Autogol</strong>, marcar con una ficha <strong className="text-red">no cargada</strong>, marcar en estado <strong className="text-red">intangible</strong>, o fallar un <strong className="text-red">Tiro Real/Definitivo</strong>.</p></div></div>
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
                            <p dangerouslySetInnerHTML={{ __html: info.description.replace(/(\+\d+)/g, '<strong class="text-green">$1</strong>') }} />
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

const SinergiasTab: React.FC = () => (
    <div className="help-section">
        <h3>Sinergias</h3>
        <p>Apunta sobre una línea imaginaria entre dos fichas especiales compatibles durante <strong>1.2 segundos</strong> para activar una poderosa habilidad de un solo uso para ese disparo.</p>
        <div className="puck-list">
            {Object.entries(SYNERGY_DESCRIPTIONS).map(([synergyType, info]) => {
                const comboKey = Object.keys(SYNERGY_COMBOS).find(k => SYNERGY_COMBOS[k] === synergyType);
                if (!comboKey) return null;
                const [puck1, puck2] = comboKey.split('-') as [PuckType, PuckType];

                return (
                    <div key={synergyType} className="puck-info-item synergy-item">
                        <div className="synergy-combo-icons"><PuckTypeIcon puckType={puck1} className="puck-info-icon" /><span>+</span><PuckTypeIcon puckType={puck2} className="puck-info-icon" /></div>
                        <div className="puck-info-details"><h4>{info.name}</h4><p>{info.description}</p></div>
                    </div>
                );
            })}
        </div>
    </div>
);


const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void; playSound: (sound: string) => void; team: Team | null; gameMode: 'pvp' | 'pve'; }> = ({ isOpen, onClose, playSound, team, gameMode }) => {
    const [activeTab, setActiveTab] = useState<HelpTab>('objetivo');

    if (!isOpen) return null;

    const handleClose = () => { playSound('UI_CLICK_2'); onClose(); };
    const handleTabClick = (tab: HelpTab) => { playSound('UI_CLICK_1'); setActiveTab(tab); };

    const containerStyle: React.CSSProperties = (team === 'BLUE' && gameMode === 'pvp') ? { transform: 'rotate(180deg)' } : {};
    const TABS: { id: HelpTab, label: string, icon: React.FC }[] = [
        { id: 'objetivo', label: 'Objetivo', icon: TabIconObjetivo },
        { id: 'controles', label: 'Controles', icon: TabIconControles },
        { id: 'reglas', label: 'Reglas', icon: TabIconReglas },
        { id: 'fichas', label: 'Fichas', icon: TabIconFichas },
        { id: 'sinergias', label: 'Sinergias', icon: TabIconSinergias }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'objetivo': return <ObjetivoTab />;
            case 'controles': return <ControlesTab />;
            case 'reglas': return <ReglasTab />;
            case 'fichas': return <FichasTab />;
            case 'sinergias': return <SinergiasTab />;
            default: return null;
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={handleClose}>
            <style>{`
                :root {
                  --help-red: #E53935;
                  --help-blue: #1E88E5;
                  --help-green: #39d353;
                  --help-yellow: #f1e05a;
                  --help-purple: #c879ff;
                  --help-cyan: #22d3ee;
                }
                .text-red { color: var(--help-red); }
                .text-blue { color: var(--help-blue); }
                .text-green { color: var(--help-green); }
                .text-yellow { color: var(--help-yellow); }
                .text-purple { color: var(--help-purple); }
                .text-cyan { color: var(--help-cyan); }
                .text-ultimate {
                    background: linear-gradient(90deg, #ff00de, #00f6ff, #ff00de);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: ultimate-text-flow 3s linear infinite;
                    background-size: 200%;
                }
                @keyframes ultimate-text-flow { to { background-position: 200% center; } }

                .help-modal-container {
                    width: 95%; max-width: 850px;
                    height: 90vh; max-height: 750px;
                    animation: modal-content-pop-in 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    position: relative;
                }
                .help-modal {
                    background: rgba(13, 17, 23, 0.85);
                    border-radius: 16px; box-shadow: 0 0 60px rgba(0,0,0,0.8);
                    width: 100%; height: 100%; display: flex;
                    overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .help-modal::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    padding: 1px;
                    background: linear-gradient(45deg, rgba(30,136,229,0.4), rgba(229,57,53,0.4));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }

                .help-modal-close-btn {
                    position: absolute; top: 12px; right: 12px;
                    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
                    color: #e0e0e0; font-size: 1.5rem; cursor: pointer;
                    line-height: 1; width: 36px; height: 36px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease; z-index: 20;
                }
                .help-modal-close-btn:hover { color: white; transform: scale(1.1); border-color: white; }
                
                .help-modal-sidebar {
                    width: 200px; background: rgba(0,0,0,0.2);
                    padding: 1rem; flex-shrink: 0;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    display: flex; flex-direction: column; gap: 0.5rem;
                }
                .help-tab-btn {
                    width: 100%; padding: 0.75rem 1rem; background: transparent;
                    border: 1px solid transparent; border-radius: 8px;
                    color: rgba(240, 246, 252, 0.7); font-size: clamp(0.9rem, 2.5vw, 1rem); font-weight: 600;
                    cursor: pointer; transition: all 0.2s ease; text-align: left;
                    display: flex; align-items: center; gap: 0.75rem;
                }
                .help-tab-btn svg { width: 20px; height: 20px; }
                .help-tab-btn:hover { background: rgba(255,255,255,0.05); color: white; }
                .help-tab-btn.active { 
                    background: rgba(57, 211, 83, 0.1); color: var(--help-green);
                    border-color: rgba(57, 211, 83, 0.3);
                    box-shadow: inset 0 0 10px rgba(57, 211, 83, 0.1);
                }

                .help-modal-main { flex-grow: 1; display: flex; flex-direction: column; }
                .help-modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
                .help-modal-title { font-family: var(--font-family-main); letter-spacing: 0.05em; font-size: clamp(1.25rem, 4vw, 1.75rem); font-weight: 400; color: white; }

                .help-modal-content { padding: 1.5rem; overflow-y: auto; color: #c9d1d9; }
                .help-modal-content::-webkit-scrollbar { width: 8px; }
                .help-modal-content::-webkit-scrollbar-track { background: transparent; }
                .help-modal-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

                .help-section { margin-bottom: 2rem; } .help-section:last-child { margin-bottom: 0; }
                .help-section h3 { font-family: var(--font-family-main); letter-spacing: 0.05em; font-size: clamp(1.1rem, 3.5vw, 1.3rem); font-weight: 400; color: var(--help-green); margin-bottom: 1rem; text-shadow: 0 0 8px rgba(57, 211, 83, 0.5); }
                .help-section p { font-size: clamp(0.85rem, 2.5vw, 0.95rem); line-height: 1.6; margin-bottom: 1rem; }
                .animation-container { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1); }
                
                .puck-list, .rules-list { display: flex; flex-direction: column; gap: 1rem; }
                .puck-info-item, .rule-item { background-color: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
                .puck-info-item { display: grid; grid-template-columns: 48px 1fr; gap: 1rem; align-items: flex-start; }
                .puck-info-icon { flex-shrink: 0; width: 48px; height: 48px; }
                .puck-info-details h4, .rule-details h4 { font-size: 1.1rem; font-weight: 700; color: white; margin: 0 0 0.25rem 0; }
                .puck-info-details p, .rule-details p { font-size: 0.85rem; color: #c9d1d9; line-height: 1.5; margin: 0; }
                
                .puck-stats-icons { display: flex; gap: 1rem; margin-top: 0.5rem; color: #c9d1d9; }
                .stat-icon-item { display: flex; align-items: center; gap: 0.35rem; }
                .stat-icon-item svg { width: 16px; height: 16px; }
                .stat-icon-item span { font-size: 0.9rem; font-weight: 600; color: white; }

                .synergy-item { grid-template-columns: 120px 1fr; }
                .synergy-combo-icons { display: flex; align-items: center; justify-content: center; gap: 0.25rem; height: 48px; }
                .synergy-combo-icons > span { font-size: 1.5rem; font-weight: 700; }
                .synergy-combo-icons .puck-info-icon { width: 40px; height: 40px; }

                .rule-item { display: grid; grid-template-columns: 32px 1fr; gap: 1rem; align-items: flex-start; }
                .rule-icon { width: 32px; height: 32px; filter: drop-shadow(0 0 5px currentColor); }
                .rule-icon.icon-yellow { color: var(--help-yellow); }
                .rule-icon.icon-green { color: var(--help-green); }
                .rule-icon.icon-blue { color: var(--help-blue); }
                .rule-icon.icon-cyan { color: var(--help-cyan); }
                .rule-icon.icon-red { color: var(--help-red); }

                .rule-details ul { list-style: none; padding-left: 1rem; margin-top: 0.5rem; }
                .rule-details li { position: relative; padding-left: 1rem; font-size: 0.9rem; margin-bottom: 0.25rem; color: #c9d1d9; }
                .rule-details li::before { content: '•'; position: absolute; left: 0; color: var(--help-purple); }

                .help-modal-mobile-nav { display: none; margin-bottom: 1.5rem; }
                .help-modal-mobile-nav select {
                    width: 100%;
                    background: var(--color-wood-dark);
                    color: var(--color-text-dark);
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                }

                 @media (max-width: 768px) {
                    .help-modal-sidebar, .help-modal-header { display: none; }
                    .help-modal { flex-direction: column; }
                    .help-modal-main { border-top: 1px solid rgba(255,255,255,0.1); }
                    .help-modal-mobile-nav { display: block; }
                    .help-modal-content { padding-top: 0; }
                 }
            `}</style>
            <div className="help-modal-container" onMouseDown={(e) => e.stopPropagation()} style={containerStyle}>
                <div className="help-modal">
                    <aside className="help-modal-sidebar">
                        <h2 className="help-modal-title" style={{padding: '0.75rem 0.5rem', marginBottom: '0.5rem'}}>AYUDA</h2>
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
                            <div className="help-modal-mobile-nav">
                                 <select value={activeTab} onChange={(e) => handleTabClick(e.target.value as HelpTab)}>
                                    {TABS.map(tab => <option key={`mobile-${tab.id}`} value={tab.id}>{tab.label}</option>)}
                                </select>
                            </div>
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
