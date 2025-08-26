import React from 'react';
import { Team, TurnLossReason } from '../types';
import { TEAM_COLORS } from '../constants';

interface TurnChangeIndicatorProps {
  team: Team; // The new team whose turn it is
  previousTeam: Team | null; // The team whose turn just ended
  reason: TurnLossReason | null;
}

const REASON_TEXT: Record<TurnLossReason, { title: string; subtitle: string }> = {
  OWN_GOAL: { title: 'TURNO PERDIDO', subtitle: 'AUTOGOL' },
  UNCHARGED_GOAL: { title: 'TURNO PERDIDO', subtitle: 'FICHA NO CARGADA' },
  PHASED_GOAL: { title: 'TURNO PERDIDO', subtitle: 'GOL INTANGIBLE' },
  SPECIAL_NO_GOAL: { title: 'TURNO PERDIDO', subtitle: 'TIRO ESPECIAL SIN GOL' },
};

const TurnChangeIndicator: React.FC<TurnChangeIndicatorProps> = ({ team, reason }) => {
  const newTeamName = team === 'BLUE' ? 'TURNO DEL EQUIPO AZUL' : 'TURNO DEL EQUIPO ROJO';
  const newTeamColor = TEAM_COLORS[team];
  const reasonInfo = reason ? REASON_TEXT[reason] : null;
  const animationDuration = 2.5;

  const textToShow = reasonInfo ? reasonInfo.title : newTeamName;
  const subtextToShow = reasonInfo ? reasonInfo.subtitle : null;

  return (
    <div className="turn-change-overlay">
      <style>{`
        .turn-change-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
          pointer-events: none;
          overflow: hidden;
        }

        .turn-change-panel {
            background-color: ${newTeamColor};
            color: white;
            padding: 1.5rem 3rem;
            border-radius: 16px;
            border: 5px solid var(--color-shadow-main);
            box-shadow: 0 8px 0 0 var(--color-shadow-main);
            text-align: center;
            animation: panel-pop-in-out ${animationDuration}s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards;
        }
        
        .turn-change-main-text {
            font-family: var(--font-family-main);
            font-size: 2.5rem;
            font-weight: 400;
            letter-spacing: 1.5px;
            -webkit-text-stroke: 2px var(--color-shadow-main);
            text-stroke: 2px var(--color-shadow-main);
            text-transform: uppercase;
        }
        .turn-change-subtitle {
            font-family: var(--font-family-main);
            font-size: 1.5rem;
            font-weight: 400;
            color: var(--color-background-paper);
            text-shadow: 2px 2px 0px var(--color-shadow-main);
            text-transform: uppercase;
            margin-top: 0.25rem;
        }

        @keyframes panel-pop-in-out {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.1); opacity: 1; }
            35% { transform: scale(1.0); }
            80% { transform: scale(1.0); opacity: 1; }
            100% { transform: scale(1.2); opacity: 0; }
        }

         @media (max-width: 640px) {
            .turn-change-panel { padding: 1rem 2rem; }
            .turn-change-main-text { font-size: 1.5rem; }
            .turn-change-subtitle { font-size: 1rem; }
         }
      `}</style>
      <div className="turn-change-panel">
            <div className="turn-change-main-text">{textToShow}</div>
            {subtextToShow && <div className="turn-change-subtitle">{subtextToShow}</div>}
      </div>
    </div>
  );
};

export default React.memo(TurnChangeIndicator);