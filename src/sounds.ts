// A mapping of sound effect names to their corresponding audio files and default volumes.
// This provides a centralized place to manage all audio assets for the game.

export type SoundKey =
  | 'COLLISION_1' | 'COLLISION_2' | 'COLLISION_3'
  | 'WALL_IMPACT_1' | 'WALL_IMPACT_2'
  | 'SHOT' | 'PULSAR_SHOT' | 'PULSAR_ACTIVATE'
  | 'LINE_CROSS' | 'LINE_CROSS_PERFECT' | 'SYNERGY_LOCK'
  | 'GOAL_SCORE' | 'BONUS_TURN' | 'PAWN_SHATTER'
  | 'PUCK_SELECT' | 'UI_CLICK_1' | 'UI_CLICK_2'
  | 'TURN_CHANGE' | 'ORBITING_HIT' | 'MAX_POWER_LOCK'
  | 'HEARTBEAT' | 'ROYAL_POWER_UNLOCKED' | 'ROYAL_SHOT'
  | 'ULTIMATE_POWER_UNLOCKED' | 'ULTIMATE_SHOT';

// Using media.githubusercontent.com for direct file access to Git LFS files.
const GITHUB_ASSETS_BASE = 'https://media.githubusercontent.com/media/Kitt-Games/PIN-PAN-PUM-Assets/main/Audio';

export const SOUNDS: Record<SoundKey, { src: string; volume: number }> = {
  // Puck Physics
  COLLISION_1: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-3.wav`, volume: 0.6 },
  COLLISION_2: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-4.wav`, volume: 0.6 },
  COLLISION_3: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-5.wav`, volume: 0.6 },
  WALL_IMPACT_1: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-1.wav`, volume: 0.5 },
  WALL_IMPACT_2: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-2.wav`, volume: 0.5 },

  // Player Actions
  SHOT: { src: `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-1.wav`, volume: 0.7 },
  PULSAR_SHOT: { src: `${GITHUB_ASSETS_BASE}/Explosion/explosion-fx-3.wav`, volume: 1.0 },
  PULSAR_ACTIVATE: { src: `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-4.wav`, volume: 0.7 },
  ROYAL_SHOT: { src: `${GITHUB_ASSETS_BASE}/Explosion/explosion-fx-1.wav`, volume: 1.0 },
  ULTIMATE_SHOT: { src: `${GITHUB_ASSETS_BASE}/Explosion/explosion-fx-1.wav`, volume: 1.2 },


  // Synergy & Effects
  LINE_CROSS: { src: `${GITHUB_ASSETS_BASE}/Blip/blip-fx-1.wav`, volume: 0.7 },
  LINE_CROSS_PERFECT: { src: `${GITHUB_ASSETS_BASE}/Blip/blip-fx-2.wav`, volume: 0.9 },
  SYNERGY_LOCK: { src: `${GITHUB_ASSETS_BASE}/UI/ui-fx-3.wav`, volume: 0.4 },
  MAX_POWER_LOCK: { src: `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-1.wav`, volume: 0.8 },

  // Game Events
  GOAL_SCORE: { src: `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-1.wav`, volume: 1.0 },
  BONUS_TURN: { src: `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-2.wav`, volume: 0.8 },
  PAWN_SHATTER: { src: `${GITHUB_ASSETS_BASE}/Impact/impact-fx-6.wav`, volume: 0.7 },
  TURN_CHANGE: { src: `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-2.wav`, volume: 0.6 },
  ORBITING_HIT: { src: `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-2.wav`, volume: 0.8 },
  HEARTBEAT: { src: `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-4.wav`, volume: 0.4 },
  ROYAL_POWER_UNLOCKED: { src: `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-3.wav`, volume: 0.9 },
  ULTIMATE_POWER_UNLOCKED: { src: `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-3.wav`, volume: 1.0 },
  
  // UI
  PUCK_SELECT: { src: `${GITHUB_ASSETS_BASE}/UI/ui-fx-1.wav`, volume: 0.5 },
  UI_CLICK_1: { src: `${GITHUB_ASSETS_BASE}/UI/ui-fx-2.wav`, volume: 0.6 },
  UI_CLICK_2: { src: `${GITHUB_ASSETS_BASE}/UI/ui-fx-4.wav`, volume: 0.6 },
};

// Group sounds for easier random selection
export const SOUND_VARIATIONS: Record<string, SoundKey[]> = {
  COLLISION: ['COLLISION_1', 'COLLISION_2', 'COLLISION_3'],
  WALL_IMPACT: ['WALL_IMPACT_1', 'WALL_IMPACT_2'],
  UI_CLICK: ['UI_CLICK_1', 'UI_CLICK_2'],
};