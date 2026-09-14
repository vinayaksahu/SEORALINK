import Link from 'next/link';
import { Logo } from './components/Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 lg:p-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-seoralink-gold/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-4xl">
          <Logo size={120} />
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
              SEORA<span className="text-seoralink-gold">LINK</span>
            </h1>
            <p className="text-lg md:text-xl text-seoralink-text-body font-medium uppercase tracking-widest">
              Korean Business Network • Global Affiliate Architecture
            </p>
          </div>

          <p className="text-xl md:text-2xl font-bold text-seoralink-cyan-bright tracking-wider">
            CONNECT. GROW. REWARD.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-12">
            <div className="card-seoralink flex flex-col items-center justify-center p-6 bg-seoralink-bg-card/80 backdrop-blur-sm border-seoralink-border-gold/30 hover:border-seoralink-gold/60 transition-colors">
              <span className="text-sm text-seoralink-text-muted mb-2 uppercase tracking-wide">Micro-Entry</span>
              <span className="text-3xl font-mono text-seoralink-gold font-bold">$10 USDT</span>
            </div>
            <div className="card-seoralink flex flex-col items-center justify-center p-6 bg-seoralink-bg-card/80 backdrop-blur-sm border-seoralink-border-gold/30 hover:border-seoralink-gold/60 transition-colors">
              <span className="text-sm text-seoralink-text-muted mb-2 uppercase tracking-wide">Doubling Ladder</span>
              <span className="text-3xl font-mono text-seoralink-cyan font-bold">12 Tiers</span>
            </div>
            <div className="card-seoralink flex flex-col items-center justify-center p-6 bg-seoralink-bg-card/80 backdrop-blur-sm border-seoralink-border-gold/30 hover:border-seoralink-gold/60 transition-colors">
              <span className="text-sm text-seoralink-text-muted mb-2 uppercase tracking-wide">Dual Overrides</span>
              <span className="text-3xl font-mono text-seoralink-green font-bold">5% + 5%</span>
            </div>
            <div className="card-seoralink flex flex-col items-center justify-center p-6 bg-seoralink-bg-card/80 backdrop-blur-sm border-seoralink-border-gold/30 hover:border-seoralink-gold/60 transition-colors">
              <span className="text-sm text-seoralink-text-muted mb-2 uppercase tracking-wide">Rank Rewards</span>
              <span className="text-3xl font-mono text-seoralink-purple font-bold">$40,950</span>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
              Enter Dashboard
            </Link>
            <div className="[&_button]:!h-auto [&_button]:!px-8 [&_button]:!py-4 [&_button]:!text-lg [&_button]:!font-bold [&_button]:!border [&_button]:!border-seoralink-gold/40 [&_button]:!bg-transparent hover:[&_button]:!bg-seoralink-gold/10">
              <ConnectButton />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
