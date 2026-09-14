export const TIER_NAMES = ['Junior', 'Zen', 'Alpha', 'Nova', 'Valt', 'Apex', 'Orbit', 'Prime', 'Elite', 'Titan', 'Royal', 'Legend', 'Ultima'] as const;

export const TIER_VALUES = [10, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480];

export const TIER_COLORS = {
  Junior: '#94a3b8',
  Zen: '#d4af37',
  Alpha: '#38bdf8',
  Nova: '#10b981',
  Valt: '#a855f7',
  Apex: '#d4af37',
  Orbit: '#38bdf8',
  Prime: '#10b981',
  Elite: '#a855f7',
  Titan: '#d4af37',
  Royal: '#38bdf8',
  Legend: '#10b981',
  Ultima: '#d4af37',
} as const;

export const REQUIRED_DIRECTS = [0, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6];

export const CUMULATIVE_REWARDS = [0, 10, 30, 70, 150, 310, 630, 1270, 2550, 5110, 10230, 20470, 40950];
