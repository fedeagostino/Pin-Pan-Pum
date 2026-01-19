
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
  const newTeamColor = TEAM_COLORS[team];
  const oldTeamColor = previousTeam ? TEAM_COLORS[previousTeam] : '#808080';
  
  const getReasonText = (r: TurnLossReason) => {
    switch(r) {
        case 'OWN_GOAL': return { title: t.TURN_LOST, subtitle: t.OWN_GOAL };
        case 'UNCHARGED_GOAL': return { title: t.TURN_LOST, subtitle: t.UNCHARGED };
        case 'PHASED_GOAL': return { title: t.TURN_LOST, subtitle: t.INTANGIBLE };
        case 'SPECIAL_NO_GOAL': return { title: t.TURN_LOST, subtitle: lang === 'es' ? 'TIRO ESPECIAL SIN GOL' : 'SPECIAL SHOT MISS' };
        default: return null;
    }
  };

  const reasonInfo = reason ? getReasonText(reason) : null;
  const isFirstTurn = !previousTeam;

  return (
    <div className="turn-change-overlay">
      <style>{`
        .turn-change-overlay {
          position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; z-index: 100; pointer-events: none; perspective: 1200px;
        }
        .flipper {
            width: 90%; max-width: 500px; height: 120px; position: relative; transform-style: preserve-3d;
            animation: flipper-sequence 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .flipper-face {
            position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            border-radius: 4px; border: 2px solid #ff0000; text-align: center;
        }
        .flipper-front { background: black; transform: rotateY(0deg); }
        .flipper-back { background: black; transform: rotateY(180deg); }
        .flipper-main-text { font-family: var(--font-family-title); font-size: 2rem; color: #ff0000; text-shadow: 0 0 10px #ff0000; }
      `}</style>
      <div className="flipper">
          <div className="flipper-face flipper-front">
              {isFirstTurn ? (
                  <div className="flipper-main-text">{lang === 'es' ? '¡A JUGAR!' : "LET'S PLAY!"}</div>
              ) : reasonInfo ? (
                  <>
                      <div className="flipper-main-text">{reasonInfo.title}</div>
                      <div style={{ color: '#ccc' }}>{reasonInfo.subtitle}</div>
                  </>
              ) : ( <div className="flipper-main-text">{lang === 'es' ? 'FIN DEL TURNO' : 'END OF TURN'}</div> )}
          </div>
          <div className="flipper-face flipper-back">
              <div className="flipper-main-text">{t.TURN_OF} {newTeamName}</div>
          </div>
      </div>
    </div>
  );
};

export default React.memo(TurnChangeIndicator);
