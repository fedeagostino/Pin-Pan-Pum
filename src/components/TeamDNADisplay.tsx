import React, { useState, useEffect } from 'react';
import { PuckType } from '../types';
import useGemini from '../hooks/useGemini';

interface TeamDNADisplayProps {
    puckTypes: PuckType[];
}

const TeamDNADisplay: React.FC<TeamDNADisplayProps> = ({ puckTypes }) => {
    const { generateTeamDNA } = useGemini();
    const [dna, setDna] = useState<{ title: string; description: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDNA = async () => {
            if (puckTypes.length === 7) {
                setIsLoading(true);
                setDna(null);
                const result = await generateTeamDNA(puckTypes);
                setDna(result);
                setIsLoading(false);
            } else {
                setDna(null);
                setIsLoading(false);
            }
        };
        const timer = setTimeout(fetchDNA, 500); // Debounce to avoid spamming API
        return () => clearTimeout(timer);
    }, [puckTypes.toString(), generateTeamDNA]);

    const content = () => {
        if (puckTypes.length < 7) {
            return <div className="loading-dna"><span>Completa tu equipo...</span></div>;
        }
        if (isLoading) {
            return <div className="loading-dna"><span>Analizando ADN del equipo...</span></div>;
        }
        if (dna) {
            return (
                <div className="dna-content">
                    <h5 className="dna-title">{dna.title}</h5>
                    <p className="dna-description">{dna.description}</p>
                </div>
            );
        }
        return <div className="loading-dna"><span>Esperando análisis...</span></div>;
    };


    return (
        <div className="team-dna-container">
            <style>{`
                .team-dna-container {
                    background: rgba(0,0,0,0.2);
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    min-height: 80px; /* To prevent layout shift */
                    text-align: center;
                }
                .dna-content {
                     animation: dna-fade-in 0.5s ease;
                }
                @keyframes dna-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dna-title {
                    font-family: var(--font-family-main);
                    font-size: 1.2rem;
                    color: var(--color-accent-cyan);
                    letter-spacing: 0.05em;
                    margin: 0;
                    text-shadow: 0 0 8px var(--color-accent-cyan);
                }
                .dna-description {
                    font-size: 0.8rem;
                    color: #c9d1d9;
                    line-height: 1.5;
                    margin: 0.25rem 0 0 0;
                }
                .loading-dna {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 100%;
                }
                .loading-dna span {
                    color: var(--color-accent-cyan);
                    font-style: italic;
                    animation: blink-text 1.5s infinite;
                    opacity: 0.7;
                }
                @keyframes blink-text {
                    50% { opacity: 0.5; }
                }
            `}</style>
            {content()}
        </div>
    );
};

export default TeamDNADisplay;