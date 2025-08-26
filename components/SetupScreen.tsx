import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Team, PuckType, TeamConfig, Puck } from '../types';
import { TEAM_COLORS, SELECTABLE_PUCKS, BOARD_WIDTH, BOARD_HEIGHT, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, PUCK_RADIUS, PUCK_TYPE_PROPERTIES, PAWN_DURABILITY } from '../constants';
import { STRATEGIC_PLANS, StrategicPlan } from '../formations';
import PuckShape from './PuckShape';
import InfoPanel from './InfoPanel';
import PuckTypeIcon from './PuckTypeIcon';
import useGemini from '../hooks/useGemini';

interface SetupScreenProps {
    team: Team;
    onSetupComplete: (config: TeamConfig) => void;
    playSound: (sound: string, options?: { volume?: number }) => void;
}

const PuckInPool: React.FC<{ puckType: PuckType; onClick: (puckType: PuckType) => void; onMouseEnter: (e: React.MouseEvent, puckType: PuckType) => void; onMouseLeave: () => void; isSelected: boolean; }> = ({ puckType, onClick, onMouseEnter, onMouseLeave, isSelected }) => (
    <div
        className={`pool-puck ${isSelected ? 'disabled' : ''}`}
        onClick={() => !isSelected && onClick(puckType)}
        onMouseEnter={(e) => onMouseEnter(e, puckType)}
        onMouseLeave={onMouseLeave}
    >
        <div className="puck-icon-wrapper">
            <PuckTypeIcon puckType={puckType} />
        </div>
        <span className="pool-puck-name">{puckType}</span>
    </div>
);

const SetupScreen: React.FC<SetupScreenProps> = ({ team, onSetupComplete, playSound }) => {
    const [roster, setRoster] = useState<(PuckType | null)[]>(Array(7).fill(null));
    const [selectedPlan, setSelectedPlan] = useState<StrategicPlan>(STRATEGIC_PLANS[team][0]);
    const [infoPanel, setInfoPanel] = useState<{ puckType: PuckType; target: HTMLElement } | null>(null);
    const [lastChangedSlot, setLastChangedSlot] = useState<number | null>(null);

    const teamColor = TEAM_COLORS[team];
    const teamColorRGB = team === 'RED' ? '229, 57, 53' : '30, 136, 229';
    const isReversed = team === 'BLUE';
    
    const nextAvailableSlotIndex = useMemo(() => roster.findIndex(p => p === null), [roster]);

    const handleInfoPanel = (e: React.MouseEvent, puckType: PuckType) => {
        setInfoPanel({ puckType, target: e.currentTarget as HTMLElement });
    };

    const handleClearInfoPanel = useCallback(() => {
        setInfoPanel(null);
    }, []);
    
    const handleAddPuck = (puckType: PuckType) => {
        if (roster.includes(puckType)) return;
        
        const firstEmptyIndex = roster.findIndex(slot => slot === null);
        if (firstEmptyIndex !== -1) {
            playSound('UI_CLICK_1');
            const newRoster = [...roster];
            newRoster[firstEmptyIndex] = puckType;
            setRoster(newRoster);
            setLastChangedSlot(firstEmptyIndex);
            setTimeout(() => setLastChangedSlot(null), 300);
        }
    };

    const handleRemovePuck = (index: number) => {
        if (roster[index]) {
            playSound('UI_CLICK_2');
            setRoster(prev => {
                const newRoster = [...prev];
                newRoster[index] = null;
                return newRoster;
            });
        }
    };
    
    const handleClearRoster = () => {
        playSound('TURN_CHANGE', { volume: 0.6 });
        setRoster(Array(7).fill(null));
    };

    const selectedPuckCount = roster.filter(p => p !== null).length;
    const isSetupComplete = selectedPuckCount === 7;

    const handleSubmit = () => {
        if (isSetupComplete) {
            onSetupComplete({
                team,
                pucks: roster.filter((p): p is PuckType => p !== null),
                strategicPlanName: selectedPlan.name,
            });
        }
    };
    
    const kingY = team === 'RED' ? BOARD_HEIGHT * 0.90 : BOARD_HEIGHT * 0.10;

    return (
        <div className={`setup-screen-container ${isReversed ? 'reversed' : ''}`} style={{'--team-color': teamColor, '--team-color-rgb': teamColorRGB} as React.CSSProperties}>
            <style>{`
                .setup-screen-container { display: flex; flex-direction: column; width: 100%; height: 100%; background: var(--color-background-paper); animation: menu-fade-in 0.5s ease; }
                .setup-screen-container.reversed { flex-direction: column-reverse; }
                
                .setup-header { text-align: center; flex-shrink: 0; padding: clamp(0.5rem, 2vh, 1rem) 0; }
                .setup-title { font-family: var(--font-family-main); font-size: clamp(1.5rem, 5vw, 2.5rem); color: var(--team-color); -webkit-text-stroke: 2px var(--color-shadow-main); text-shadow: 2px 2px var(--color-background-paper); }
                
                .setup-content { flex-grow: 1; display: grid; grid-template-columns: 2fr 1fr; gap: clamp(0.5rem, 2vh, 1rem); padding: 0 clamp(0.5rem, 2vh, 1rem) clamp(0.5rem, 2vh, 1rem); overflow: hidden; }
                .setup-screen-container.reversed .setup-content { transform: rotate(180deg); }

                .left-panel { background: var(--color-wood-dark); border-radius: 12px; box-shadow: inset 0 0 15px rgba(0,0,0,0.4); border: 4px solid var(--color-shadow-main); }
                
                .formation-display { width: 100%; height: 100%; position: relative; overflow: hidden; border-radius: 8px; background-color: var(--color-wood-medium); }
                .formation-slot { position: absolute; transform: translate(-50%, -50%); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
                .slot-puck { animation: puck-pop-in 0.3s ease-out forwards; width: 100%; height: 100%; cursor: pointer; transition: transform 0.2s ease; }
                .slot-puck:hover { transform: scale(1.1); }
                @keyframes puck-pop-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
                
                .empty-slot-indicator { width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.2); border: 3px dashed rgba(255,255,255,0.3); transition: all 0.2s ease; }
                
                .formation-slot.slot-drop-pulse .empty-slot-indicator, .formation-slot.slot-drop-pulse .slot-puck { animation: slot-pulse 0.4s ease-out; }
                @keyframes slot-pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--team-color-rgb), 0.7); } 100% { box-shadow: 0 0 0 20px rgba(var(--team-color-rgb), 0); } }
                
                @keyframes next-slot-pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--team-color-rgb), 0); } 50% { box-shadow: 0 0 15px 5px rgba(var(--team-color-rgb), 0.7); } 100% { box-shadow: 0 0 0 0 rgba(var(--team-color-rgb), 0); } }
                .formation-slot.next-available .empty-slot-indicator {
                    border-style: solid;
                    border-color: var(--team-color);
                    background: rgba(var(--team-color-rgb), 0.1);
                    animation: next-slot-pulse 2s infinite ease-in-out;
                }
                
                .right-panel { display: flex; flex-direction: column; gap: 1rem; overflow: hidden; }
                .formations-wrapper, .puck-pool-wrapper { background: var(--color-wood-light); border-radius: 12px; padding: clamp(0.25rem, 1vh, 0.5rem); }
                
                .selection-title { font-family: var(--font-family-main); font-size: clamp(0.8rem, 2.5vw, 1rem); color: var(--color-text-dark); margin-bottom: 0.25rem; text-align: center; }
                .formation-selector { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.25rem; }
                .formation-button { display: flex; flex-direction: column; align-items: center; gap: 1px; width: clamp(45px, 6vw, 55px); background: var(--color-background-paper); border: 3px solid var(--color-wood-dark); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; padding: 2px; color: var(--color-wood-dark); }
                .formation-button.selected { border-color: var(--team-color); background: #fffde7; box-shadow: 0 0 10px var(--team-color); }
                .formation-button svg { width: 100%; height: 25px; }
                .formation-name { font-size: 0.55rem; font-weight: 600; }

                .puck-pool-wrapper { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
                .puck-pool { flex-grow: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; overflow-y: auto; padding-right: 5px; }
                
                .pool-puck { cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding-top: 8px; }
                .puck-icon-wrapper { width: 80px; height: 80px; transition: all 0.2s ease-out; }
                .pool-puck:hover:not(.disabled) .puck-icon-wrapper { transform: scale(1.15); }
                .pool-puck-name { font-size: 1rem; font-weight: 700; color: var(--color-text-dark); text-transform: capitalize; }
                .pool-puck.disabled { opacity: 0.3; cursor: not-allowed; }
                
                .setup-footer { flex-shrink: 0; display: flex; padding: clamp(0.5rem, 2vh, 1rem); }
                .footer-buttons { width: 100%; display: flex; gap: 1rem; }
                .action-button { font-family: var(--font-family-main); padding: 1rem; color: white; font-size: 1.5rem; border: 4px solid var(--color-shadow-main); border-radius: 12px; cursor: pointer; text-transform: uppercase; transition: all 0.1s ease-out; box-shadow: 0 8px 0 0 var(--color-shadow-main); flex-grow: 1; }
                .action-button:not(:disabled):hover { transform: translateY(-4px); box-shadow: 0 12px 0 0 var(--color-shadow-main); }
                .action-button.confirm { background: var(--color-accent-green); }
                .action-button.clear { background: var(--color-primary-red); font-size: 0.9rem; flex-grow: 0; padding: 0.7rem 0.9rem; }
                .action-button:disabled { background: var(--color-wood-light); color: var(--color-text-dark); opacity: 0.6; cursor: not-allowed; box-shadow: 0 6px 0 0 #00000022; }

                 @media (max-width: 900px), (max-height: 600px) {
                    .setup-content { display: flex; flex-direction: column; }
                    .left-panel { flex-grow: 1; min-height: 200px; }
                 }
            `}</style>
            <header className="setup-header">
                <h1 className="setup-title">CONFIGURACIÓN DEL EQUIPO {team === 'RED' ? 'ROJO' : 'AZUL'}</h1>
            </header>

            <main className="setup-content" onMouseLeave={handleClearInfoPanel}>
                <div className="left-panel">
                    <div className="formation-display">
                        {/* Static Pucks */}
                        <div className="formation-slot" style={{ left: '50%', top: `${(kingY / BOARD_HEIGHT) * 100}%`, width: `${(KING_PUCK_RADIUS * 2 / BOARD_WIDTH) * 100}%`, height: `${(KING_PUCK_RADIUS * 2 / BOARD_HEIGHT) * 100}%` }}>
                           <PuckTypeIcon puckType="KING" teamColor={teamColor} />
                        </div>
                        {selectedPlan.pawnFormation.puckLayout.map((layout, i) => (
                            <div key={`pawn-${i}`} className="formation-slot" style={{ left: `${(layout.position.x / BOARD_WIDTH) * 100}%`, top: `${(layout.position.y / BOARD_HEIGHT) * 100}%`, width: `${(PAWN_PUCK_RADIUS * 2 / BOARD_WIDTH) * 100}%`, height: `${(PAWN_PUCK_RADIUS * 2 / BOARD_HEIGHT) * 100}%` }}>
                                <PuckTypeIcon puckType="PAWN" teamColor={teamColor} />
                            </div>
                        ))}

                        {/* Interactive Slots */}
                        {selectedPlan.specialFormation.puckLayout.map((layout, i) => {
                            const puckType = roster[i];
                            return (
                                <div key={`slot-${i}`}
                                    className={`formation-slot ${lastChangedSlot === i ? 'slot-drop-pulse' : ''} ${nextAvailableSlotIndex === i ? 'next-available' : ''}`}
                                    style={{ left: `${(layout.position.x / BOARD_WIDTH) * 100}%`, top: `${(layout.position.y / BOARD_HEIGHT) * 100}%`, width: `${(PUCK_RADIUS * 2 / BOARD_WIDTH) * 100}%`, height: `${(PUCK_RADIUS * 2 / BOARD_HEIGHT) * 100}%` }}
                                    onClick={() => handleRemovePuck(i)}
                                    onMouseEnter={(e) => puckType && handleInfoPanel(e, puckType)}
                                    onMouseLeave={handleClearInfoPanel}
                                >
                                    {puckType ? (
                                        <div className="slot-puck">
                                            <PuckTypeIcon puckType={puckType} teamColor={teamColor} />
                                        </div>
                                    ) : (
                                        <div className="empty-slot-indicator" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="right-panel">
                     <div className="formations-wrapper">
                         <h4 className="selection-title">Plan Estratégico</h4>
                        <div className="formation-selector">
                            {STRATEGIC_PLANS[team].map(plan => (
                                <button key={plan.name} className={`formation-button ${selectedPlan.name === plan.name ? 'selected' : ''}`} onClick={() => setSelectedPlan(plan)}>
                                     <svg viewBox={`0 ${team === 'RED' ? 400 : 200} 800 500`} preserveAspectRatio="xMidYMid meet">
                                        {plan.specialFormation.puckLayout.map((p, i) => <circle key={`s-${i}`} cx={p.position.x} cy={p.position.y} r={20} fill="currentColor" />)}
                                        {plan.pawnFormation.puckLayout.map((p, i) => <circle key={`p-${i}`} cx={p.position.x} cy={p.position.y} r={15} fill="currentColor" opacity="0.6"/>)}
                                    </svg>
                                    <span className="formation-name">{plan.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="puck-pool-wrapper">
                        <h4 className="selection-title">Fichas Disponibles</h4>
                        <div className="puck-pool">
                            {SELECTABLE_PUCKS.map(puckType => (
                                <PuckInPool
                                    key={puckType}
                                    puckType={puckType}
                                    onClick={handleAddPuck}
                                    onMouseEnter={handleInfoPanel}
                                    onMouseLeave={handleClearInfoPanel}
                                    isSelected={roster.includes(puckType)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            
            <footer className="setup-footer">
                <div className="footer-buttons">
                    <button className="action-button clear" onClick={handleClearRoster}>Limpiar</button>
                    <button className="action-button confirm" disabled={!isSetupComplete} onClick={handleSubmit}>
                        {isSetupComplete ? '¡CONFIRMAR EQUIPO!' : `Selecciona ${7 - selectedPuckCount} fichas`}
                    </button>
                </div>
            </footer>
             {infoPanel && infoPanel.target && (
                 <InfoPanelPopup puckType={infoPanel.puckType} target={infoPanel.target} team={team} isReversed={isReversed} />
            )}
        </div>
    );
};

// Helper component, only used inside SetupScreen
const InfoPanelPopup: React.FC<{ puckType: PuckType; target: HTMLElement; team: Team; isReversed: boolean; }> = ({ puckType, target, team, isReversed }) => {
    const INFO_PANEL_WIDTH = 320;
    const INFO_PANEL_PUCK_OFFSET = 15;
    const targetRect = target.getBoundingClientRect();

    const puckScreenCenter = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
    };

    const renderDirection = puckScreenCenter.y > window.innerHeight / 2 ? 'up' : 'down';

    const halfWidth = INFO_PANEL_WIDTH / 2;
    let panelLeft = puckScreenCenter.x - halfWidth;
    panelLeft = Math.max(10, panelLeft);
    panelLeft = Math.min(panelLeft, window.innerWidth - INFO_PANEL_WIDTH - 10);
    
    const panelCenterX = panelLeft + halfWidth;
    const pointerHorizontalOffset = puckScreenCenter.x - panelCenterX;

    let top;
    let baseTransform = '';
    let transformOrigin;
    
    if (renderDirection === 'up') {
        top = targetRect.top - INFO_PANEL_PUCK_OFFSET;
        baseTransform = 'translateY(-100%)';
        transformOrigin = 'center bottom';
    } else {
        top = targetRect.bottom + INFO_PANEL_PUCK_OFFSET;
        transformOrigin = 'center top';
    }
    
    // For the blue player, the setup screen is rotated. The popup is positioned relative to the viewport (position: fixed),
    // so it must also be rotated to appear correctly oriented for the player.
    const rotation = isReversed ? ' rotate(180deg)' : '';

    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        left: `${panelLeft}px`,
        top: `${top}px`,
        width: `${INFO_PANEL_WIDTH}px`,
        transform: baseTransform + rotation,
        transformOrigin: transformOrigin,
        zIndex: 1000,
        pointerEvents: 'none',
    };

    const puckProps = PUCK_TYPE_PROPERTIES[puckType];
    const dummyPuck: Puck = {
        id: -1,
        puckType: puckType,
        team: team,
        position: {x: 0, y: 0},
        initialPosition: {x: 0, y: 0},
        velocity: {x: 0, y: 0},
        rotation: 0,
        mass: puckProps.mass,
        friction: puckProps.friction,
        radius: PUCK_RADIUS,
        isCharged: false,
        temporaryEffects: [],
        durability: puckType === 'PAWN' ? PAWN_DURABILITY : undefined,
    };

    return (
        <div style={panelStyle}>
            <InfoPanel
                puck={dummyPuck}
                specialShotStatus='NONE'
                renderDirection={renderDirection}
                pointerHorizontalOffset={pointerHorizontalOffset}
            />
        </div>
    );
};

export default SetupScreen;