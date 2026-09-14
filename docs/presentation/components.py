# Common SVG Icons and Components for SEORALINK Whitepaper

LOGO_SVG = """
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="seoraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="50%" stop-color="#4facfe" />
      <stop offset="100%" stop-color="#7928ca" />
    </linearGradient>
    <linearGradient id="seoraGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>
  <!-- Geometric Hexagonal Web3 Nexus -->
  <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" stroke="url(#seoraGrad1)" stroke-width="4.5" fill="rgba(15, 23, 42, 0.7)" />
  <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" stroke="url(#seoraGrad2)" stroke-width="2.5" fill="none" opacity="0.8" />
  <!-- Central Interconnected Nexus -->
  <circle cx="50" cy="50" r="10" fill="url(#seoraGrad1)" />
  <circle cx="50" cy="22" r="4.5" fill="#00f2fe" />
  <circle cx="74" cy="36" r="4.5" fill="#38bdf8" />
  <circle cx="74" cy="64" r="4.5" fill="#818cf8" />
  <circle cx="50" cy="78" r="4.5" fill="#7928ca" />
  <circle cx="26" cy="64" r="4.5" fill="#a855f7" />
  <circle cx="26" cy="36" r="4.5" fill="#00f2fe" />
  <!-- Connection lines -->
  <line x1="50" y1="50" x2="50" y2="22" stroke="#00f2fe" stroke-width="1.8" />
  <line x1="50" y1="50" x2="74" y2="36" stroke="#38bdf8" stroke-width="1.8" />
  <line x1="50" y1="50" x2="74" y2="64" stroke="#818cf8" stroke-width="1.8" />
  <line x1="50" y1="50" x2="50" y2="78" stroke="#7928ca" stroke-width="1.8" />
  <line x1="50" y1="50" x2="26" y2="64" stroke="#a855f7" stroke-width="1.8" />
  <line x1="50" y1="50" x2="26" y2="36" stroke="#00f2fe" stroke-width="1.8" />
</svg>
"""

ICON_NETWORK = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>"""
ICON_WALLET = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>"""
ICON_REWARDS = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>"""
ICON_PARTNER = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>"""
ICON_SHIELD = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>"""
ICON_CONTRACT = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>"""
ICON_LOCK = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>"""
ICON_CHECK = """<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>"""
ICON_GLOBAL = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>"""

def render_header(section_num, section_title):
    return f"""
    <div class="page-header">
        <div class="header-left">
            <div class="brand-badge">
                {LOGO_SVG}
                <span>SEORALINK</span>
            </div>
            <span class="header-sep">/</span>
            <span class="breadcrumb">{section_num} &middot; {section_title}</span>
        </div>
        <div class="header-right">
            <span class="domain-tag">seoralink.com</span>
            <span class="doc-badge">GLOBAL BUSINESS PLAN</span>
        </div>
    </div>
    """

def render_footer(page_num, total_pages=20):
    return f"""
    <div class="page-footer">
        <div class="footer-left">
            <span class="tagline">CONNECT. GROW. REWARD.</span>
            <span class="header-sep">&bull;</span>
            <span>BUILDING A BORDERLESS AFFILIATE ECONOMY</span>
        </div>
        <div class="footer-right">
            <span>PUBLIC ECOSYSTEM SPECIFICATION</span>
            <span class="page-num">{page_num:02d} / {total_pages:02d}</span>
        </div>
    </div>
    """
