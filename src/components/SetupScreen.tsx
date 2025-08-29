import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Team, PuckType, TeamConfig, Puck } from '../types';
import { TEAM_COLORS, SELECTABLE_PUCKS, BOARD_WIDTH, BOARD_HEIGHT, KING_PUCK_RADIUS, PAWN_PUCK_RADIUS, PUCK_RADIUS, PUCK_TYPE_PROPERTIES, PAWN_DURABILITY } from '../constants';
import { STRATEGIC_PLANS, StrategicPlan } from '../formations';
import PuckShape from './PuckShape';
import InfoPanel from './InfoPanel';
import PuckTypeIcon from './PuckTypeIcon';
import TeamDNADisplay from './TeamDNADisplay';

interface SetupScreenProps {
    team: Team;
    onSetupComplete: (config: TeamConfig) => void;
    playSound: (sound: string, options?: { volume?: number }) => void;
    gameMode: 'pvp' | 'pve';
    onHelpClick: () => void;
}

const PuckInPool: React.FC<{ puckType: PuckType; onClick: (puckType: PuckType) => void; onMouseEnter: (puckType: PuckType) => void; isSelected: boolean; }> = ({ puckType, onClick, onMouseEnter, isSelected }) => (
    <div
        className={`pool-puck ${isSelected ? 'disabled' : ''}`}
        onClick={() => !isSelected && onClick(puckType)}
        onMouseEnter={() => onMouseEnter(puckType)}
        aria-label={puckType}
        role="button"
        aria-disabled={isSelected}
    >
        <div className="puck-icon-wrapper">
            <PuckTypeIcon puckType={puckType} />
        </div>
    </div>
);


const SetupScreen: React.FC<SetupScreenProps> = ({ team, onSetupComplete, playSound, gameMode, onHelpClick }) => {
    const [roster, setRoster] = useState<(PuckType | null)[]>(Array(7).fill(null));
    const [selectedPlan, setSelectedPlan] = useState<StrategicPlan>(STRATEGIC_PLANS[team][0]);
    const [lastChangedSlot, setLastChangedSlot] = useState<number | null>(null);
    const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
    const [hoveredPoolPuck, setHoveredPoolPuck] = useState<PuckType | null>(null);
    const [infoPanelData, setInfoPanelData] = useState<{ puckType: PuckType; position: DOMRect; } | { text: string; position: DOMRect } | null>(null);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

    const teamColor = TEAM_COLORS[team];
    const teamColorRGB = team === 'RED' ? '255, 7, 58' : '0, 246, 255';
    const isReversed = team === 'BLUE' && gameMode === 'pvp';
    
    const nextAvailableSlotIndex = useMemo(() => roster.findIndex(p => p === null), [roster]);

    useEffect(() => {
        slotRefs.current = slotRefs.current.slice(0, selectedPlan.specialFormation.puckLayout.length);
    }, [selectedPlan]);

    useEffect(() => {
        let targetElement: HTMLDivElement | null = null;
        let puckTypeToShow: PuckType | null = null;
        let textToShow: string | null = null;

        if (hoveredPoolPuck) {
            if (nextAvailableSlotIndex !== -1) {
                puckTypeToShow = hoveredPoolPuck;
                targetElement = slotRefs.current[nextAvailableSlotIndex];
            }
        } else if (hoveredSlotIndex !== null) {
            targetElement = slotRefs.current[hoveredSlotIndex];
            if (roster[hoveredSlotIndex]) {
                puckTypeToShow = roster[hoveredSlotIndex];
            } else {
                textToShow = "Selecciona una ficha de la reserva";
            }
        }
        
        if (targetElement) {
            const position = targetElement.getBoundingClientRect();
            if (puckTypeToShow) {
                 setInfoPanelData({ puckType: puckTypeToShow, position });
            } else if (textToShow) {
                 setInfoPanelData({ text: textToShow, position });
            }
        } else {
            setInfoPanelData(null);
        }

    }, [hoveredPoolPuck, hoveredSlotIndex, roster, nextAvailableSlotIndex]);


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
            <button onClick={onHelpClick} className="setup-help-button" aria-label="Ayuda">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </button>
            <style>{`
                 /* ... existing styles ... */
                .ghost-puck { animation: puck-pop-in 0.3s ease-out forwards; width: 100%; height: 100%; opacity: 0.5; filter: grayscale(50%); }
            `}</style>
            <header className="setup-header">
                <h1 className="setup-title">CONFIGURACIÓN DEL EQUIPO {team === 'RED' ? 'ROJO' : 'AZUL'}</h1>
            </header>

            <main className="setup-content" onMouseLeave={() => { setHoveredPoolPuck(null); setHoveredSlotIndex(null); }}>
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
                            const isGhostSlot = hoveredPoolPuck && nextAvailableSlotIndex === i;

                            return (
                                <div key={`slot-${i}`}
                                    // FIX: The ref callback function was implicitly returning a value, which is not allowed. 
                                    // Wrapping the assignment in curly braces `{}` makes it a block body that correctly returns `void`.
                                    ref={el => { slotRefs.current[i] = el }}
                                    className={`formation-slot ${lastChangedSlot === i ? 'slot-drop-pulse' : ''} ${nextAvailableSlotIndex === i && !isGhostSlot ? 'next-available' : ''}`}
                                    style={{ left: `${(layout.position.x / BOARD_WIDTH) * 100}%`, top: `${(layout.position.y / BOARD_HEIGHT) * 100}%`, width: `${(PUCK_RADIUS * 2 / BOARD_WIDTH) * 100}%`, height: `${(PUCK_RADIUS * 2 / BOARD_HEIGHT) * 100}%` }}
                                    onClick={() => handleRemovePuck(i)}
                                    onMouseEnter={() => setHoveredSlotIndex(i)}
                                >
                                    {puckType ? (
                                        <div className="slot-puck">
                                            <PuckTypeIcon puckType={puckType} teamColor={teamColor} />
                                        </div>
                                    ) : isGhostSlot ? (
                                        <div className="ghost-puck">
                                            <PuckTypeIcon puckType={hoveredPoolPuck!} teamColor={teamColor} />
                                        </div>
                                    ) : (
                                        <div className="empty-slot-indicator" />
                                    )}
                                </div>
                            );
                        })}
                        <ActiveInfoPanel data={infoPanelData} team={team} isReversed={isReversed} />
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
                        <div className="puck-pool" onMouseLeave={() => setHoveredPoolPuck(null)}>
                            {SELECTABLE_PUCKS.map(puckType => (
                                <PuckInPool
                                    key={puckType}
                                    puckType={puckType}
                                    onClick={handleAddPuck}
                                    onMouseEnter={setHoveredPoolPuck}
                                    isSelected={roster.includes(puckType)}
                                />
                            ))}
                        </div>
                        <TeamDNADisplay puckTypes={roster.filter((p): p is PuckType => p !== null)} />
                    </div>
                </div>
            </main>
            
            <footer className="setup-footer">
                <div className="footer-buttons">
                    <button className="action-button clear" onClick={handleClearRoster}>Limpiar</button>
                    <button className="action-button confirm" disabled={!isSetupComplete} onClick={handleSubmit}>
                        {isSetupComplete ? '¡CONFIRMAR EQUIPO!' : `Selecciona ${7 - selectedPuckCount} más`}
                    </button>
                </div>
            </footer>
        </div>
    );
};

const ActiveInfoPanel: React.FC<{
    data: { puckType: PuckType; position: DOMRect } | { text: string; position: DOMRect } | null;
    team: Team;
    isReversed: boolean;
}> = ({ data, team, isReversed }) => {
    if (!data) return null;

    const INFO_PANEL_WIDTH = 320;
    const PUCK_OFFSET = 15;
    
    const targetRect = data.position;
    const puckScreenCenterY = targetRect.top + targetRect.height / 2;
    const renderDirection = puckScreenCenterY > window.innerHeight / 2 ? 'up' : 'down';

    const halfWidth = INFO_PANEL_WIDTH / 2;
    let panelLeft = (targetRect.left + targetRect.right) / 2 - halfWidth;
    panelLeft = Math.max(10, panelLeft);
    panelLeft = Math.min(panelLeft, window.innerWidth - INFO_PANEL_WIDTH - 10);
    const panelCenterX = panelLeft + halfWidth;
    const pointerHorizontalOffset = (targetRect.left + targetRect.right) / 2 - panelCenterX;
    
    let top;
    let baseTransform = '';
    let transformOrigin;
    if (renderDirection === 'up') {
        top = targetRect.top - PUCK_OFFSET;
        baseTransform = 'translateY(-100%)';
        transformOrigin = 'center bottom';
    } else {
        top = targetRect.bottom + PUCK_OFFSET;
        transformOrigin = 'center top';
    }
    const rotation = isReversed ? ' rotate(180deg)' : '';

    const panelStyle: React.CSSProperties = {
        position: 'fixed', left: `${panelLeft}px`, top: `${top}px`,
        width: `${INFO_PANEL_WIDTH}px`, transform: baseTransform + rotation, transformOrigin,
        zIndex: 1000, pointerEvents: 'none'
    };

    if ('text' in data) {
        return (
             <div style={panelStyle}>
                 <div className="puck-info-card" style={{animation: 'card-fade-in-up 0.3s ease forwards', padding: '1rem', textAlign: 'center', fontWeight: '600'}}>
                    {data.text}
                </div>
             </div>
        )
    }

    const puckProps = PUCK_TYPE_PROPERTIES[data.puckType];
    const dummyPuck: Puck = {
        id: -1, puckType: data.puckType, team: team,
        position: {x: 0, y: 0}, initialPosition: {x: 0, y: 0}, velocity: {x: 0, y: 0},
        rotation: 0, mass: puckProps.mass, friction: puckProps.friction,
        radius: PUCK_RADIUS, isCharged: false, temporaryEffects: [],
        durability: data.puckType === 'PAWN' ? PAWN_DURABILITY : undefined,
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
