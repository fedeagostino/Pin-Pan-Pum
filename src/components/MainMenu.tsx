import React from 'react';

interface MainMenuProps {
    onPlay: () => void;
    onPlayAI: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onPlayAI }) => {
    return (
        <div className="main-menu-container">
            <style>{`
                .main-menu-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    animation: menu-fade-in 0.8s ease-out;
                    padding: 1rem;
                }
                @keyframes menu-fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .game-title-container {
                    text-align: center;
                    margin-bottom: 3rem;
                }
                .game-title {
                    font-family: 'Luckiest Guy', cursive;
                    font-size: clamp(4rem, 15vw, 8rem);
                    font-weight: 400;
                    color: white;
                    -webkit-text-stroke: 4px var(--color-shadow-main);
                    text-stroke: 4px var(--color-shadow-main);
                    text-shadow: 0px 4px 0px var(--color-primary-red), 0px 8px 0px var(--color-primary-blue), 0px 12px 6px rgba(0,0,0,0.5);
                    line-height: 0.9;
                    letter-spacing: 0.05em;
                }

                .menu-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    width: 90%;
                    max-width: 350px;
                }
                .menu-button {
                    font-family: 'Luckiest Guy', cursive;
                    padding: 1rem 2rem;
                    background: var(--color-accent-yellow);
                    color: var(--color-bg-dark);
                    font-size: 1.5rem;
                    border: 4px solid var(--color-shadow-main);
                    border-radius: 12px;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.1s ease-out;
                    box-shadow: 0 8px 0 0 var(--color-shadow-main);
                    text-shadow: 1px 1px 0px rgba(255,255,255,0.3);
                }

                .menu-button:not(:disabled):hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 0 0 var(--color-shadow-main);
                }
                
                .menu-button:not(:disabled):active {
                    transform: translateY(4px);
                    box-shadow: 0 4px 0 0 var(--color-shadow-main);
                }
                
                .menu-button:disabled {
                    cursor: not-allowed;
                    background: var(--color-bg-light);
                    color: var(--color-bg-medium);
                    opacity: 0.7;
                    box-shadow: 0 6px 0 0 #00000022;
                }
                .menu-button:disabled .coming-soon {
                    font-family: var(--font-family-body);
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--color-bg-medium);
                    margin-left: 0.5rem;
                    display: inline-block;
                }
            `}</style>
            <div className="game-title-container">
                <h1 className="game-title">
                   PIN<br/>PAN<br/>PUM
                </h1>
            </div>
            <nav className="menu-options">
                <button className="menu-button" onClick={onPlay}>Jugar vs Jugador</button>
                <button className="menu-button" onClick={onPlayAI}>
                    Jugar vs IA
                </button>
                <button className="menu-button" disabled>
                    Torneo
                    <span className="coming-soon">(Próximamente)</span>
                </button>
                <button className="menu-button" disabled>
                    Opciones
                </button>
            </nav>
        </div>
    );
};

export default MainMenu;