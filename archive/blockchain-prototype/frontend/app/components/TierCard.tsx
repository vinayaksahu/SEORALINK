import { TIER_COLORS } from '../lib/constants';
import { formatUSDT } from '../lib/utils';
import { Check, Lock } from 'lucide-react';

interface TierCardProps {
  tierNumber: number;
  tierName: string;
  value: number;
  isActive: boolean;
  isCompleted: boolean;
}

export default function TierCard({ tierNumber, tierName, value, isActive, isCompleted }: TierCardProps) {
  const color = TIER_COLORS[tierName as keyof typeof TIER_COLORS] || '#94a3b8';
  
  let stateClass = 'opacity-50 grayscale border-seoralink-border-subtle';
  if (isActive) {
    stateClass = 'border-seoralink-gold bg-seoralink-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.15)]';
  } else if (isCompleted) {
    stateClass = 'border-seoralink-green/50 bg-seoralink-green/5';
  }

  return (
    <div className={`card-seoralink relative overflow-hidden transition-all duration-300 ${stateClass}`}>
      {/* Accent line */}
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-4 mt-2">
        <div>
          <div className="text-xs text-seoralink-text-muted font-bold uppercase tracking-wider mb-1">Tier {tierNumber}</div>
          <div className="text-lg font-bold text-white" style={{ color: isActive ? color : 'inherit' }}>{tierName}</div>
        </div>
        <div className="p-2 rounded-full bg-seoralink-bg">
          {isCompleted ? (
            <Check size={16} className="text-seoralink-green" />
          ) : isActive ? (
            <div className="w-4 h-4 rounded-full bg-seoralink-gold animate-pulse" />
          ) : (
            <Lock size={16} className="text-seoralink-text-muted" />
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-seoralink-border-subtle flex justify-between items-end">
        <span className="text-sm text-seoralink-text-muted">Value</span>
        <span className="font-mono text-xl font-bold text-white">{formatUSDT(value)}</span>
      </div>
    </div>
  );
}
