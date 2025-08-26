

import React from 'react';
import { Team } from '../types';
import { TEAM_COLORS } from '../constants';

interface TurnIndicatorProps {
  currentTurn: Team;
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({ currentTurn }) => {
  const teamColor = TEAM_COLORS[currentTurn];
  const teamName = currentTurn === 'BLUE' ? 'Equipo Azul' : 'Equipo Rojo';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-lg shadow-lg bg-gray-800 border border-gray-700">
      <h2 className="text-xl font-bold text-white flex items-center gap-3">
        Turno de:
        <span style={{ color: teamColor }} className="font-extrabold">{teamName}</span>
      </h2>
    </div>
  );
};

export default TurnIndicator;