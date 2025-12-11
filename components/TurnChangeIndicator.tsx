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

const TurnChangeIndicator: React.FC<TurnChangeIndicatorProps> = ({ team, previousTeam, reason }) => {
  const newTeamName = team === 'BLUE' ? 'TURNO DEL EQUIPO AZUL' : 'TURNO DEL EQUIPO ROJO';
  const newTeamColor = TEAM_COLORS[team];
  const oldTeamColor = previousTeam ? TEAM_COLORS[previousTeam] : '#808080';
  const reasonInfo = reason ? REASON_TEXT[reason] : null;
  const isFirstTurn = !previousTeam;

  const animationDuration = 2.5;

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
          perspective: 1200px;
        }

        .turn-change-flash {
            position: absolute;
            inset: 0;
            background-color: ${newTeamColor};
            animation: screen-flash ${animationDuration}s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .flipper {
            width: 90%;
            max-width: 500px;
            height: 120px;
            position: relative;
            transform-style: preserve-3d;
            animation: flipper-sequence ${animationDuration}s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .flipper-face {
            position: absolute;
            width: 100%;
            height: 100%;
            -webkit-backface-visibility: hidden; /* Safari */
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-radius: 12px;
            border: 3px solid rgba(255,255,255,0.7);
            text-align: center;
            padding: 1rem;
        }

        .flipper-front {
            background-color: ${oldTeamColor};
            box-shadow: 0 0 25px ${oldTeamColor};
            transform: rotateY(0deg);
        }
        
        .flipper-back {
            background-color: ${newTeamColor};
            box-shadow: 0 0 25px ${newTeamColor};
            transform: rotateY(180deg);
        }
        
        .flipper-content-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .flipper-main-text {
            font-size: 2.2rem;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: white;
            text-shadow: 2px 2px 5px rgba(0,0,0,0.6);
            text-transform: uppercase;
        }
        .flipper-subtitle {
            font-size: 1.2rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.85);
            text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
            text-transform: uppercase;
            margin-top: 0.25rem;
        }

        @keyframes screen-flash {
            0% { opacity: 0; }
            10% { opacity: 0.3; }
            90% { opacity: 0.3; }
            100% { opacity: 0; }
        }

        @keyframes flipper-sequence {
            0% { transform: scale(0.5) rotateY(0deg); opacity: 0; }
            15% { transform: scale(1.05) rotateY(0deg); opacity: 1; }
            25% { transform: scale(1) rotateY(0deg); opacity: 1; }
            45% { transform: scale(1) rotateY(180deg); opacity: 1; }
            65% { transform: scale(1) rotateY(180deg); opacity: 1; }
            85% { transform: scale(1.1) rotateY(180deg); opacity: 1; }
            100% { transform: scale(0.5) rotateY(180deg); opacity: 0; }
        }

         @media (max-width: 640px) {
            .flipper { height: 100px; }
            .flipper-main-text { font-size: 1.5rem; }
            .flipper-subtitle { font-size: 1rem; }
         }
      `}</style>
      <div className="turn-change-flash" />
      <div className="flipper">
          <div className="flipper-face flipper-front">
              <div className="flipper-content-wrapper">
                {isFirstTurn ? (
                    <div className="flipper-main-text">¡A JUGAR!</div>
                ) : reasonInfo ? (
                    <>
                        <div className="flipper-main-text">{reasonInfo.title}</div>
                        <div className="flipper-subtitle">{reasonInfo.subtitle}</div>
                    </>
                ) : ( <div className="flipper-main-text">FIN DEL TURNO</div> )}
              </div>
          </div>
          <div className="flipper-face flipper-back">
              <div className="flipper-content-wrapper">
                <div className="flipper-main-text">{newTeamName}</div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default React.memo(TurnChangeIndicator);