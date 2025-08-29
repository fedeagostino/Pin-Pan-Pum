export interface ColorPalette {
  '--font-family-main': string;
  '--font-family-body': string;
  '--color-primary-red': string;
  '--color-primary-blue': string;
  '--color-accent-yellow': string;
  '--color-accent-green': string;
  '--color-accent-purple': string;
  '--color-accent-cyan': string;
  '--color-bg-dark': string;
  '--color-bg-medium': string;
  '--color-bg-light': string;
  '--color-bg-paper': string;
  '--color-text-dark': string;
  '--color-text-light': string;
  '--color-shadow-main': string;
  '--color-shadow-main-rgb': string;
}

export const PALETTES: Record<string, { name: string; colors: ColorPalette }> = {
  VIBRANT_NEON: {
    name: 'Neón Vibrante',
    colors: {
      '--font-family-main': "'Luckiest Guy', cursive",
      '--font-family-body': "'Exo 2', sans-serif",
      '--color-primary-red': '#ff073a',
      '--color-primary-blue': '#00f6ff',
      '--color-accent-yellow': '#f1e05a',
      '--color-accent-green': '#39d353',
      '--color-accent-purple': '#c879ff',
      '--color-accent-cyan': '#22d3ee',
      '--color-bg-dark': '#0d1117',
      '--color-bg-medium': '#161b22',
      '--color-bg-light': '#21262d',
      '--color-bg-paper': '#010409',
      '--color-text-dark': '#f0f6fc',
      '--color-text-light': '#c9d1d9',
      '--color-shadow-main': '#000000',
      '--color-shadow-main-rgb': '0, 0, 0',
    }
  },
  SYNTHWAVE_SUNSET: {
    name: 'Atardecer Synthwave',
    colors: {
        '--font-family-main': "'Luckiest Guy', cursive",
        '--font-family-body': "'Exo 2', sans-serif",
        '--color-primary-red': '#f92a82', // Hot Pink
        '--color-primary-blue': '#17dcd0', // Bright Cyan
        '--color-accent-yellow': '#ffcb00', // Gold
        '--color-accent-green': '#00ff41', // Neon Green
        '--color-accent-purple': '#9e00ff', // Electric Purple
        '--color-accent-cyan': '#00c2ff', // Sky Blue
        '--color-bg-dark': '#2a004f', // Deep Purple
        '--color-bg-medium': '#1e0033',
        '--color-bg-light': '#3c005a',
        '--color-bg-paper': '#0a001a', // Almost Black Purple
        '--color-text-dark': '#ffffff',
        '--color-text-light': '#e0e0e0',
        '--color-shadow-main': '#000000',
        '--color-shadow-main-rgb': '0, 0, 0',
    }
  },
  CLASSIC_ARCADE: {
    name: 'Arcade Clásico',
    colors: {
        '--font-family-main': "'Luckiest Guy', cursive",
        '--font-family-body': "'Exo 2', sans-serif",
        '--color-primary-red': '#e60012', // Classic Red
        '--color-primary-blue': '#005aff', // Classic Blue
        '--color-accent-yellow': '#ffcc00',
        '--color-accent-green': '#00cc00',
        '--color-accent-purple': '#9900cc',
        '--color-accent-cyan': '#00aaff',
        '--color-bg-dark': '#222222',
        '--color-bg-medium': '#333333',
        '--color-bg-light': '#444444',
        '--color-bg-paper': '#111111',
        '--color-text-dark': '#ffffff',
        '--color-text-light': '#cccccc',
        '--color-shadow-main': '#000000',
        '--color-shadow-main-rgb': '0, 0, 0',
    }
  },
};
