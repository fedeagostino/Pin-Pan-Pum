
import React from 'react';
import { Team, TurnLossReason } from '../types';
import { TEAM_COLORS, TRANSLATIONS, Language } from '../constants';

interface TurnChangeIndicatorProps {
  team: Team;
  previousTeam: Team | null;
  reason: TurnLossReason | null;
  lang: Language;
}

const TurnChangeIndicator: React.FC<TurnChangeIndicatorProps> = ({ team, previousTeam, reason, lang }) => {
  const t = TRANSLATIONS[lang];
  const newTeamName = team === 'BLUE' ? (lang === 'es' ? 'EQUIPO AZUL' : 'BLUE TEAM') : (lang === 'es' ? 'EQUIPO ROJO' : 'RED TEAM');
  
  const getReasonText = (r: TurnLossReason) => {
    switch(r) {
        case 'OWN_GOAL': return { title: t.TURN_LOST, subtitle: t.OWN_GOAL };
        case 'UNCHARGED_GOAL': return { title: t.TURN_LOST, subtitle: t.UNCHARGED };
        case 'PHASED_GOAL': return { title: t.TURN_LOST, subtitle: t.INTANGIBLE };
        case 'SPECIAL_NO_GOAL': return { title: t.TURN_LOST, subtitle: lang === 'es' ? 'TIRO ESPECIAL SIN GOL' : 'SPECIAL SHOT MISS' };
        case 'NO_CHARGE': return { title: t.TURN_LOST, subtitle: lang === 'es' ? '¡NO ATRAVESÓ LÍNEAS!' : 'FAILED TO CHARGE!' };
        default: return null;
    }
  };

  const reasonInfo = reason ? getReasonText(reason) : null;
  const isFirstTurn = !previousTeam;

  return (
    <div className="turn-change-overlay">
      <style>{`
        @keyframes flipper-sequence {
          0% { transform: rotateY(-90deg) scale(0.5); opacity: 0; }
          15% { transform: rotateY(0deg) scale(1.1); opacity: 1; }
          25% { transform: rotateY(0deg) scale(1); }
          45% { transform: rotateY(0deg); }
          55% { transform: rotateY(180deg); }
          85% { transform: rotateY(180deg); opacity: 1; }
          100% { transform: rotateY(180deg) scale(1.2); opacity: 0; }
        }

        .turn-change-overlay {
          position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; z-index: 1000; pointer-events: none; perspective: 1200px;
        }
        .flipper {
            width: 90%; max-width: 500px; height: 160px; position: relative; transform-style: preserve-3d;
            animation: flipper-sequence 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .flipper-face {
            position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            border-radius: 8px; border: 3px solid #ff0000; text-align: center;
            background: rgba(0, 0, 0, 0.95);
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.4), inset 0 0 20px rgba(255, 0, 0, 0.2);
        }
        .flipper-front { transform: rotateY(0deg); }
        .flipper-back { transform: rotateY(180deg); }
        .flipper-main-text { font-family: var(--font-family-title); font-size: 2.8rem; color: #ff0000; text-shadow: 0 0 15px #ff0000; margin: 0; }
        .flipper-sub-text { font-family: var(--font-family-main); font-size: 1.1rem; color: #ccc; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 2px; }
      `}</style>
      <div className="flipper">
          <div className="flipper-face flipper-front">
              {isFirstTurn ? (
                  <div className="flipper-main-text">{lang === 'es' ? '¡A JUGAR!' : "LET'S PLAY!"}</div>
              ) : reasonInfo ? (
                  <>
                      <div className="flipper-main-text">{reasonInfo.title}</div>
                      <div className="flipper-sub-text">{reasonInfo.subtitle}</div>
                  </>
              ) : ( 
                  <div className="flipper-main-text">{lang === 'es' ? 'TURNO COMPLETADO' : 'TURN COMPLETED'}</div> 
              )}
          </div>
          <div className="flipper-face flipper-back">
              <div className="flipper-sub-text" style={{ color: '#fff', opacity: 0.7 }}>{t.TURN_OF}</div>
              <div className="flipper-main-text" style={{ fontSize: '2.4rem' }}>{newTeamName}</div>
          </div>
      </div>
    </div>
  );
};

export default React.memo(TurnChangeIndicator);
