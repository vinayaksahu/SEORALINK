import Link from 'next/link';
import { Logo } from './Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-seoralink-border-subtle bg-seoralink-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-bold text-xl tracking-wider text-white">
            SEORA<span className="text-seoralink-gold">LINK</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-seoralink-gold transition-colors text-seoralink-text-secondary">Dashboard</Link>
          <Link href="/queue" className="text-sm font-medium hover:text-seoralink-gold transition-colors text-seoralink-text-secondary">Queue</Link>
          <Link href="/rewards" className="text-sm font-medium hover:text-seoralink-gold transition-colors text-seoralink-text-secondary">Rewards</Link>
          <Link href="/referrals" className="text-sm font-medium hover:text-seoralink-gold transition-colors text-seoralink-text-secondary">Referrals</Link>
        </nav>
        
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
