# CSS Styles for SEORALINK Whitepaper & Business Plan
CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}

@page {
    size: 210mm 297mm;
    margin: 0;
}

body {
    background-color: #030712;
    color: #94a3b8;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    margin: 0;
    padding: 0;
}

.page {
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    min-height: 297mm;
    margin: 0 auto;
    position: relative;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
    background: radial-gradient(circle at 85% 12%, rgba(0, 242, 254, 0.07) 0%, transparent 45%),
                radial-gradient(circle at 12% 88%, rgba(121, 40, 202, 0.08) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.5) 0%, transparent 70%),
                #070a13;
    padding: 12mm 15mm 10mm 15mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* Header & Footer */
.page-header {
    height: 11mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    padding-bottom: 4px;
    margin-bottom: 6px;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.brand-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 1.5px;
    color: #ffffff;
}

.brand-badge svg {
    width: 15px;
    height: 15px;
}

.header-sep {
    color: rgba(148, 163, 184, 0.4);
    font-size: 11px;
}

.breadcrumb {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #38bdf8;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.domain-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #00f2fe;
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.25);
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 600;
}

.doc-badge {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-transform: uppercase;
}

.page-footer {
    height: 8.5mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
    padding-top: 3px;
    font-size: 8.5px;
    color: #64748b;
    flex-shrink: 0;
}

.footer-left {
    display: flex;
    align-items: center;
    gap: 7px;
    letter-spacing: 0.5px;
}

.footer-left .tagline {
    font-weight: 700;
    color: #38bdf8;
}

.footer-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.page-num {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #e2e8f0;
    background: rgba(148, 163, 184, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

/* Page Content Body */
.page-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 8px;
    overflow: hidden;
}

/* Typography & Titles */
.title-block {
    margin-bottom: 2px;
}

.section-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #00f2fe;
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.25);
    padding: 2px 7px;
    border-radius: 10px;
    margin-bottom: 3px;
}

h1.page-title {
    font-size: 19px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.4px;
    line-height: 1.22;
    margin-bottom: 2px;
}

h1.page-title span.accent {
    background: linear-gradient(135deg, #00f2fe 0%, #38bdf8 50%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p.page-subtitle {
    font-size: 10.5px;
    color: #94a3b8;
    line-height: 1.4;
}

/* Layout Grids */
.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 7px;
}

.grid-2-1 {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 8px;
}

.grid-1-2 {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 8px;
}

/* Cards */
.card {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 7px;
    padding: 9px 11px;
    position: relative;
}

.card.highlight {
    border-color: rgba(0, 242, 254, 0.3);
    background: linear-gradient(180deg, rgba(0, 242, 254, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%);
}

.card.purple {
    border-color: rgba(139, 92, 246, 0.3);
    background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%);
}

.card.emerald {
    border-color: rgba(16, 185, 129, 0.3);
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%);
}

.card.amber {
    border-color: rgba(245, 158, 11, 0.3);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%);
}

.card-title {
    font-size: 11.5px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.card-title svg {
    width: 13px;
    height: 13px;
    color: #00f2fe;
}

/* Tables */
.table-container {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 7px;
    overflow: hidden;
}

table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
    text-align: left;
}

table.data-table th {
    background: rgba(30, 41, 59, 0.85);
    color: #38bdf8;
    font-weight: 700;
    padding: 5px 7px;
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(56, 189, 248, 0.25);
}

table.data-table td {
    padding: 4.5px 7px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
    color: #cbd5e1;
}

table.data-table tr:nth-child(even) td {
    background: rgba(15, 23, 42, 0.35);
}

table.data-table tr.highlight td {
    background: rgba(0, 242, 254, 0.06);
    color: #ffffff;
    font-weight: 600;
}

.badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 8px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
}

.badge-cyan {
    background: rgba(0, 242, 254, 0.12);
    color: #00f2fe;
    border: 1px solid rgba(0, 242, 254, 0.3);
}

.badge-purple {
    background: rgba(139, 92, 246, 0.12);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-emerald {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-amber {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Callout Box */
.callout {
    background: rgba(15, 23, 42, 0.8);
    border-left: 3px solid #00f2fe;
    padding: 6px 9px;
    border-radius: 0 5px 5px 0;
    font-size: 9.5px;
    line-height: 1.4;
}

.callout.warning {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
}

.callout.legal {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
}

.callout-title {
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
}

/* Metric Display Box */
.metric-box {
    text-align: center;
    padding: 7px 5px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 6px;
}

.metric-val {
    font-size: 15px;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    color: #ffffff;
    margin-bottom: 2px;
}

.metric-val.cyan { color: #00f2fe; }
.metric-val.purple { color: #c084fc; }
.metric-val.emerald { color: #34d399; }
.metric-val.amber { color: #fbbf24; }

.metric-label {
    font-size: 8.5px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Flowchart Nodes */
.flow-step {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 6px;
    padding: 6px 9px;
}

.step-num {
    background: linear-gradient(135deg, #00f2fe, #7928ca);
    color: #ffffff;
    font-weight: 800;
    font-size: 9.5px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.step-content h4 {
    font-size: 10.5px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 2px;
}

.step-content p {
    font-size: 9px;
    color: #94a3b8;
    line-height: 1.35;
}
"""
