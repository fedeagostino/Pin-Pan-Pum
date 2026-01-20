
import React, { useState } from 'react';
import { UI_COLORS, TRANSLATIONS, Language } from '../constants';

interface MainMenuProps {
    onStartGame: (vsAI: boolean) => void;
    onLanguageChange: (lang: Language) => void;
    currentLanguage: Language;
    playSound: (sound: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onLanguageChange, currentLanguage, playSound }) => {
    const [view, setView] = useState<'main' | 'settings'>('main');
    const t = TRANSLATIONS[currentLanguage];

    const handleAction = (callback: () => void) => {
        playSound('UI_CLICK_1');
        callback();
    };

    return (
        <div className="main-menu-overlay">
            <style>{`
                .main-menu-overlay {
                    position: fixed;
                    inset: 0;
                    background: black;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 500;
                    overflow: hidden;
                    padding: 2rem;
                }

                .ash-container {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }

                .st-logo-container {
                    position: relative;
                    margin-bottom: clamp(2rem, 10vh, 5rem);
                    text-align: center;
                    animation: light-flicker 8s infinite step-end;
                    transition: all 0.5s ease;
                    width: 100%;
                    max-width: 800px;
                }

                .st-logo-bar {
                    height: clamp(2px, 0.5vw, 4px);
                    background: #ff0000;
                    box-shadow: 0 0 15px #ff0000;
                    width: 100%;
                    margin: 0.5rem 0;
                }

                .st-logo-text {
                    font-family: var(--font-family-title);
                    font-size: clamp(2.5rem, 14vw, 8rem);
                    color: transparent;
                    -webkit-text-stroke: clamp(1px, 0.3vw, 2px) #ff0000;
                    filter: drop-shadow(0 0 10px #ff0000);
                    line-height: 0.9;
                    margin: 0;
                    padding: 0.5rem;
                    animation: logo-pulse 4s infinite ease-in-out;
                    letter-spacing: -1px;
                }

                .menu-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                    max-width: 340px;
                    z-index: 10;
                    animation: card-fade-in-up 0.8s ease-out;
                }
                @media (min-width: 768px) { .menu-buttons { gap: 1.5rem; max-width: 380px; } }

                .menu-btn {
                    background: transparent;
                    border: 2px solid rgba(255, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.7);
                    padding: clamp(0.8rem, 3vw, 1.2rem) 1.5rem;
                    font-family: var(--font-family-title);
                    font-size: clamp(1.1rem, 5vw, 1.4rem);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    border-radius: 4px;
                    min-height: 50px;
                }

                .menu-btn:hover {
                    border-color: #ff0000;
                    color: #fff;
                    box-shadow: 0 0 15px rgba(255, 0, 0, 0.4), inset 0 0 5px rgba(255, 0, 0, 0.2);
                    transform: scale(1.02);
                }

                .menu-btn.active-lang {
                    border-color: white;
                    color: white;
                    background: rgba(255,255,255,0.05);
                }

                .settings-header {
                    font-family: var(--font-family-title);
                    color: #ff0000;
                    font-size: clamp(1.5rem, 6vw, 2rem);
                    margin-bottom: 1.5rem;
                    text-align: center;
                    text-shadow: 0 0 10px #ff0000;
                }

                .version-tag {
                    position: absolute;
                    bottom: 1rem;
                    font-size: 0.65rem;
                    color: #333;
                    letter-spacing: 1px;
                    font-family: var(--font-family-main);
                    text-transform: uppercase;
                }
            `}</style>

            <div className="ash-container">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="ash-particle" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 4 + 1}px`,
                            height: `${Math.random() * 4 + 1}px`,
                            animation: `ash-float ${Math.random() * 10 + 5}s infinite linear`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            <div className="st-logo-container" style={{ transform: view === 'settings' ? 'scale(0.8) translateY(-10px)' : 'none' }}>
                <div className="st-logo-bar" />
                <h1 className="st-logo-text">
                    {t.TITLE}
                </h1>
                <div className="st-logo-bar" />
            </div>

            {view === 'main' ? (
                <div className="menu-buttons">
                    <button className="menu-btn" onClick={() => handleAction(() => onStartGame(false))}>
                        {t.PLAY_FRIEND}
                    </button>
                    <button className="menu-btn" onClick={() => handleAction(() => onStartGame(true))}>
                        {t.PLAY_AI}
                    </button>
                    <button className="menu-btn" style={{ opacity: 0.6 }} onClick={() => handleAction(() => setView('settings'))}>
                        {t.SETTINGS}
                    </button>
                </div>
            ) : (
                <div className="menu-buttons">
                    <h2 className="settings-header">{t.SETTINGS}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button 
                            className={`menu-btn ${currentLanguage === 'en' ? 'active-lang' : ''}`} 
                            style={{ flex: 1, fontSize: '0.9rem', padding: '0.8rem 0.5rem' }}
                            onClick={() => onLanguageChange('en')}
                        >
                            EN
                        </button>
                        <button 
                            className={`menu-btn ${currentLanguage === 'es' ? 'active-lang' : ''}`} 
                            style={{ flex: 1, fontSize: '0.9rem', padding: '0.8rem 0.5rem' }}
                            onClick={() => onLanguageChange('es')}
                        >
                            ES
                        </button>
                    </div>
                    <button className="menu-btn" onClick={() => handleAction(() => setView('main'))}>
                        {t.BACK}
                    </button>
                </div>
            )}

            <div className="version-tag">pin-pan-pum3.0 by viejocapo</div>
        </div>
    );
};

export default MainMenu;
