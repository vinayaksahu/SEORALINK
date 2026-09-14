// SEORALINK Master Constants & Business Rules (from 16x9 Presentation & Plan)

export const TIER_NAMES = [
  "Junior",  // Tier 0: Micro-entry ($10)
  "Zen",     // Tier 1: $10 reward
  "Alpha",   // Tier 2: $20 reward
  "Nova",    // Tier 3: $40 reward
  "Valt",    // Tier 4: $80 reward
  "Apex",    // Tier 5: $160 reward
  "Orbit",   // Tier 6: $320 reward
  "Prime",   // Tier 7: $640 reward
  "Elite",   // Tier 8: $1,280 reward
  "Titan",   // Tier 9: $2,560 reward
  "Royal",   // Tier 10: $5,120 reward
  "Legend",  // Tier 11: $10,240 reward
  "Ultima",  // Tier 12: $20,480 reward
] as const;

export const TIER_VALUES = [
  10,    // 0: Junior
  10,    // 1: Zen
  20,    // 2: Alpha
  40,    // 3: Nova
  80,    // 4: Valt
  160,   // 5: Apex
  320,   // 6: Orbit
  640,   // 7: Prime
  1280,  // 8: Elite
  2560,  // 9: Titan
  5120,  // 10: Royal
  10240, // 11: Legend
  20480, // 12: Ultima
] as const;

export const REQUIRED_DIRECTS = [
  0, // Tier 0 (Junior)
  2, // Tier 1 (Zen)
  2, // Tier 2 (Alpha)
  3, // Tier 3 (Nova)
  3, // Tier 4 (Valt)
  3, // Tier 5 (Apex)
  4, // Tier 6 (Orbit)
  4, // Tier 7 (Prime)
  4, // Tier 8 (Elite)
  5, // Tier 9 (Titan)
  5, // Tier 10 (Royal)
  6, // Tier 11 (Legend)
  6, // Tier 12 (Ultima)
] as const;

export const CUMULATIVE_REWARDS = [
  0,     // 0: Junior
  10,    // 1: Zen
  30,    // 2: Alpha
  70,    // 3: Nova
  150,   // 4: Valt
  310,   // 5: Apex
  630,   // 6: Orbit
  1270,  // 7: Prime
  2550,  // 8: Elite
  5110,  // 9: Titan
  10230, // 10: Royal
  20470, // 11: Legend
  40950, // 12: Ultima
] as const;

export const TIER_COLORS = {
  Junior: "#94a3b8",
  Zen: "#d4af37",
  Alpha: "#38bdf8",
  Nova: "#10b981",
  Valt: "#a855f7",
  Apex: "#d4af37",
  Orbit: "#38bdf8",
  Prime: "#10b981",
  Elite: "#a855f7",
  Titan: "#d4af37",
  Royal: "#38bdf8",
  Legend: "#10b981",
  Ultima: "#d4af37",
} as const;

export const RATES = {
  MICRO_ENTRY_FEE: 10.0, // $10 USDT
  DIRECT_COMMISSION_PERCENT: 5.0, // 5% ($0.50)
  UPLINE_OVERRIDE_PERCENT: 5.0, // 5%
  STANDARD_DEDUCTION_PERCENT: 20.0, // 20% on Tiers 0-11
  ULTIMA_DEDUCTION_PERCENT: 10.0, // 10% on Tier 12 (Ultima)
  MIN_WITHDRAWAL_AMOUNT: 10.0, // $10 USDT minimum
} as const;
