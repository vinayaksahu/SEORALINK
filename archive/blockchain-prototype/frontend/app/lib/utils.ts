import { TIER_COLORS } from './constants';

export function formatUSDT(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('$', '$'); // Ensure $ is present
}

export function getTierColor(tierName: string): string {
  return TIER_COLORS[tierName as keyof typeof TIER_COLORS] || '#94a3b8';
}

export function calculateOverride(tierValue: number): number {
  return tierValue * 0.05; // 5% calculation
}

export function calculateNetPayout(grossAmount: number, tier: number): number {
  const deduction = grossAmount * 0.05;
  return grossAmount - deduction;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
