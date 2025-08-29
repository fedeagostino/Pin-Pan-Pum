import React from 'react';
import { PALETTES } from '../palettes';

interface OptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaletteChange: (paletteKey: string) => void;
    currentPaletteKey: string;
    playSound: (sound: string) => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({ isOpen, onClose, onPaletteChange, currentPaletteKey, playSound }) => {
    if (!isOpen) return null;

    const handlePaletteClick = (key: string) => {
        playSound('UI_CLICK_1');
        onPaletteChange(key);
    };

    const handleClose = () => {
        playSound('UI_CLICK_2');
        onClose();
    };

    return (
        <div className="modal-overlay" onMouseDown={handleClose}>
            <style>{`
                .options-modal-container {
                    width: 90%; max-width: 500px;
                    background: var(--color-bg-dark);
                    border: 1px solid var(--color-bg-light);
                    border-radius: 16px; box-shadow: 0 0 40px rgba(0,0,0,0.7);
                    animation: modal-content-pop-in 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    display: flex; flex-direction: column;
                }
                .options-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--color-bg-light);
                }
                .options-modal-title {
                    font-family: var(--font-family-main);
                    font-size: 1.75rem;
                    color: var(--color-text-dark);
                }
                .options-modal-close-btn {
                    background: none; border: none;
                    color: var(--color-text-light); font-size: 2rem;
                    cursor: pointer; line-height: 1;
                    transition: all 0.2s ease;
                }
                .options-modal-close-btn:hover { color: white; transform: scale(1.1); }
                .options-modal-content {
                    padding: 1.5rem;
                }
                .options-section-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--color-accent-green);
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                }
                .palette-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                .palette-button {
                    background: var(--color-bg-medium);
                    border: 2px solid var(--color-bg-light);
                    border-radius: 8px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                .palette-button:hover {
                    border-color: var(--color-accent-cyan);
                    transform: translateY(-2px);
                }
                .palette-button.active {
                    border-color: var(--color-accent-green);
                    box-shadow: 0 0 15px var(--color-accent-green);
                }
                .palette-name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--color-text-dark);
                    display: block;
                    margin-bottom: 0.75rem;
                }
                .palette-swatches {
                    display: flex;
                    gap: 0.5rem;
                }
                .swatch {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 2px solid var(--color-bg-dark);
                }
            `}</style>
             <div className="options-modal-container" onMouseDown={(e) => e.stopPropagation()}>
                 <header className="options-modal-header">
                     <h2 className="options-modal-title">Opciones</h2>
                     <button className="options-modal-close-btn" onClick={handleClose} aria-label="Cerrar">&times;</button>
                 </header>
                 <div className="options-modal-content">
                     <h3 className="options-section-title">Paleta de Colores</h3>
                     <div className="palette-grid">
                         {Object.entries(PALETTES).map(([key, { name, colors }]) => (
                             <button
                                 key={key}
                                 className={`palette-button ${currentPaletteKey === key ? 'active' : ''}`}
                                 onClick={() => handlePaletteClick(key)}
                             >
                                 <span className="palette-name">{name}</span>
                                 <div className="palette-swatches">
                                     <div className="swatch" style={{ backgroundColor: colors['--color-primary-blue'] }}></div>
                                     <div className="swatch" style={{ backgroundColor: colors['--color-primary-red'] }}></div>
                                     <div className="swatch" style={{ backgroundColor: colors['--color-accent-green'] }}></div>
                                     <div className="swatch" style={{ backgroundColor: colors['--color-accent-yellow'] }}></div>
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
        </div>
    );
};
export default OptionsModal;