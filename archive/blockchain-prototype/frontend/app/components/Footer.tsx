import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-seoralink-border-subtle bg-seoralink-bg py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-bold text-lg tracking-wider text-white">
            SEORA<span className="text-seoralink-gold">LINK</span>
          </span>
          <span className="text-sm text-seoralink-text-muted">Korean Business Network • Global Ecosystem</span>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="https://seoralink.com" target="_blank" rel="noopener noreferrer" className="text-sm text-seoralink-text-muted hover:text-seoralink-gold transition-colors">
            seoralink.com
          </a>
          <div className="flex gap-4">
            {/* Social icons placeholders */}
            <div className="w-8 h-8 rounded-full bg-seoralink-bg-card flex items-center justify-center hover:bg-seoralink-gold/20 cursor-pointer transition-colors text-seoralink-text-muted hover:text-seoralink-gold text-xs">
              X
            </div>
            <div className="w-8 h-8 rounded-full bg-seoralink-bg-card flex items-center justify-center hover:bg-seoralink-gold/20 cursor-pointer transition-colors text-seoralink-text-muted hover:text-seoralink-gold text-xs">
              TG
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
