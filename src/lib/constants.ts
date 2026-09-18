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
  8,     // 1: Zen ($8 Net)
  16,    // 2: Alpha ($16 Net)
  32,    // 3: Nova ($32 Net)
  64,    // 4: Valt ($64 Net)
  128,   // 5: Apex ($128 Net)
  256,   // 6: Orbit ($256 Net)
  512,   // 7: Prime ($512 Net)
  1024,  // 8: Elite ($1,024 Net)
  2048,  // 9: Titan ($2,048 Net)
  4096,  // 10: Royal ($4,096 Net)
  8192,  // 11: Legend ($8,192 Net)
  18432, // 12: Ultima ($18,432 Net)
] as const;

export const NET_CASHOUT_VALUES = [
  0,     // 0: Junior (Entry)
  8,     // 1: Zen (80% Net of $10)
  16,    // 2: Alpha (80% Net of $20)
  32,    // 3: Nova (80% Net of $40)
  64,    // 4: Valt (80% Net of $80)
  128,   // 5: Apex (80% Net of $160)
  256,   // 6: Orbit (80% Net of $320)
  512,   // 7: Prime (80% Net of $640)
  1024,  // 8: Elite (80% Net of $1,280)
  2048,  // 9: Titan (80% Net of $2,560)
  4096,  // 10: Royal (80% Net of $5,120)
  8192,  // 11: Legend (80% Net of $10,240)
  18432, // 12: Ultima (90% Net of $20,480 - 10% Fee)
] as const;

export const UPLINE_OVERRIDE_VALUES = [
  0.00,    // 0: Junior (No mentorship override on entry tier)
  0.50,    // 1: Zen (5% of $10)
  1.00,    // 2: Alpha (5% of $20)
  2.00,    // 3: Nova (5% of $40)
  4.00,    // 4: Valt (5% of $80)
  8.00,    // 5: Apex (5% of $160)
  16.00,   // 6: Orbit (5% of $320)
  32.00,   // 7: Prime (5% of $640)
  64.00,   // 8: Elite (5% of $1,280)
  128.00,  // 9: Titan (5% of $2,560)
  256.00,  // 10: Royal (5% of $5,120)
  512.00,  // 11: Legend (5% of $10,240)
  1024.00, // 12: Ultima (5% of $20,480)
] as const;

export const CUMULATIVE_UPLINE_OVERRIDES = [
  0.00,    // 0: Junior
  0.50,    // 1: Zen
  1.50,    // 2: Alpha ($0.50 + $1.00)
  3.50,    // 3: Nova ($1.50 + $2.00)
  7.50,    // 4: Valt ($3.50 + $4.00)
  15.50,   // 5: Apex ($7.50 + $8.00)
  31.50,   // 6: Orbit ($15.50 + $16.00)
  63.50,   // 7: Prime ($31.50 + $32.00)
  127.50,  // 8: Elite ($63.50 + $64.00)
  255.50,  // 9: Titan ($127.50 + $128.00)
  511.50,  // 10: Royal ($255.50 + $256.00)
  1023.50, // 11: Legend ($511.50 + $512.00)
  2047.50, // 12: Ultima ($1023.50 + $1024.00)
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
  STANDARD_DEDUCTION_PERCENT: 20.0, // 20% on Tiers 1-11
  INTERMEDIATE_DEDUCTION_PERCENT: 20.0, // 20% on Tiers 1-11 (Permanent Ban)
  ULTIMA_DEDUCTION_PERCENT: 10.0, // 10% on Tier 12 (Ultima - Lifetime Active)
  COMMISSION_DEDUCTION_PERCENT: 10.0, // 10% on all Direct & Mentorship commission withdrawals
  MIN_WITHDRAWAL_AMOUNT: 10.0, // $10 USDT minimum
} as const;
