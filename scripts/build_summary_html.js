const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>SEORALINK - Easy Business Plan Summary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
      background-color: #0b0f17;
      color: #e6edf3;
      font-size: 11px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      page-break-after: always;
      height: 275mm;
      max-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .header {
      background: linear-gradient(135deg, #161b22, #0d1117);
      border: 1px solid #30363d;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #58a6ff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-badge {
      background: rgba(210, 153, 34, 0.15);
      border: 1px solid #d29922;
      color: #e3b341;
      font-size: 9px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }

    .header-sub {
      font-size: 10px;
      color: #8b949e;
      text-align: right;
    }

    .header-sub span {
      color: #3fb950;
      font-weight: 600;
    }

    .metrics-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .metric-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .metric-card.gold { border-top: 3px solid #d29922; }
    .metric-card.blue { border-top: 3px solid #58a6ff; }
    .metric-card.green { border-top: 3px solid #3fb950; }
    .metric-card.purple { border-top: 3px solid #bc8cff; }

    .metric-val {
      font-size: 16px;
      font-weight: 700;
      color: #f0f6fc;
    }
    .metric-card.gold .metric-val { color: #e3b341; }
    .metric-card.blue .metric-val { color: #58a6ff; }
    .metric-card.green .metric-val { color: #3fb950; }
    .metric-card.purple .metric-val { color: #bc8cff; }

    .metric-label {
      font-size: 9px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #58a6ff;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid #21262d;
      padding-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 12px;
      background: #58a6ff;
      border-radius: 2px;
    }

    .info-box {
      background: rgba(56, 139, 253, 0.08);
      border: 1px solid rgba(56, 139, 253, 0.25);
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 10px;
    }

    .info-box p {
      font-size: 10.5px;
      color: #c9d1d9;
      line-height: 1.5;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .pillar-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 9px 10px;
    }

    .pillar-num {
      font-size: 10px;
      font-weight: 700;
      color: #8b949e;
      margin-bottom: 3px;
    }

    .pillar-title {
      font-size: 11px;
      font-weight: 700;
      color: #f0f6fc;
      margin-bottom: 4px;
    }

    .pillar-desc {
      font-size: 9.5px;
      color: #8b949e;
      line-height: 1.4;
    }

    .mechanism-container {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
    }

    .tripod-diagram {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: #0d1117;
      border: 1px dashed #30363d;
      border-radius: 6px;
      padding: 8px;
      margin-top: 6px;
      text-align: center;
    }

    .node-box {
      background: #21262d;
      border: 1px solid #388bfd;
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 9.5px;
      font-weight: 600;
      color: #58a6ff;
    }

    .node-box.sub {
      border-color: #3fb950;
      color: #3fb950;
    }

    .node-arrow {
      color: #8b949e;
      font-size: 12px;
      font-weight: 700;
    }

    .stream-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stream-left { flex: 1; }

    .stream-tag {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .tag-instant { background: rgba(56, 139, 253, 0.2); color: #58a6ff; border: 1px solid #388bfd; }
    .tag-compound { background: rgba(210, 153, 34, 0.2); color: #e3b341; border: 1px solid #d29922; }
    .tag-leader { background: rgba(63, 185, 80, 0.2); color: #3fb950; border: 1px solid #238636; }

    .stream-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #f0f6fc;
    }

    .stream-desc {
      font-size: 9.5px;
      color: #8b949e;
    }

    .stream-amount {
      text-align: right;
      padding-left: 12px;
    }

    .stream-amount .val {
      font-size: 13px;
      font-weight: 800;
      color: #3fb950;
    }

    .stream-amount .sub {
      font-size: 8.5px;
      color: #8b949e;
    }

    table.ranks-table {
      width: 100%;
      border-collapse: collapse;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      font-size: 9.5px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    table.ranks-table th {
      background: #21262d;
      color: #58a6ff;
      padding: 5px 6px;
      text-align: center;
      font-weight: 700;
      border-bottom: 1px solid #30363d;
      font-size: 9px;
      text-transform: uppercase;
    }

    table.ranks-table td {
      padding: 4.5px 6px;
      text-align: center;
      border-bottom: 1px solid #21262d;
      color: #c9d1d9;
    }

    table.ranks-table tr.highlight-tier {
      background: rgba(210, 153, 34, 0.12);
      font-weight: 600;
    }

    table.ranks-table tr.highlight-tier td {
      color: #e3b341;
    }

    .badge-directs {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 10px;
      padding: 1px 6px;
      font-weight: 600;
      color: #f0f6fc;
      font-size: 8.5px;
    }

    .reserve-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }

    .reserve-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 8px 10px;
    }

    .reserve-card.regular { border-left: 3px solid #58a6ff; }
    .reserve-card.ultima {
      border-left: 3px solid #e3b341;
      background: rgba(210, 153, 34, 0.05);
    }

    .reserve-title {
      font-size: 10.5px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #f0f6fc;
      display: flex;
      justify-content: space-between;
    }

    .reserve-stat {
      display: flex;
      gap: 10px;
      margin-top: 4px;
      font-size: 9.5px;
    }

    .steps-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .step-item {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 6px 7px;
      text-align: center;
    }

    .step-num {
      width: 16px;
      height: 16px;
      background: #58a6ff;
      color: #0d1117;
      border-radius: 50%;
      font-size: 9px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 3px;
    }

    .step-name {
      font-size: 9.5px;
      font-weight: 700;
      color: #f0f6fc;
      margin-bottom: 2px;
    }

    .step-desc {
      font-size: 8.5px;
      color: #8b949e;
      line-height: 1.3;
    }

    .footer {
      border-top: 1px solid #21262d;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #6e7681;
    }

    .footer a {
      color: #58a6ff;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div>
          <div class="brand-title">
            SEORALINK
            <span class="brand-badge">KOREAN BUSINESS NETWORK</span>
          </div>
          <div style="font-size: 9.5px; color: #8b949e; margin-top: 2px;">
            Global Affiliate Architecture • Easy Business Plan Summary (आसान शब्दों में समझें)
          </div>
        </div>
        <div class="header-sub">
          Origin: <strong>Seoul, South Korea</strong><br>
          Network: <span>Single-Leg Global Queue (v4.0)</span>
        </div>
      </div>

      <!-- Key Metrics Bar -->
      <div class="metrics-bar">
        <div class="metric-card gold">
          <div class="metric-val">$10 USDT</div>
          <div class="metric-label">Micro-Entry (शुरुआत)</div>
        </div>
        <div class="metric-card blue">
          <div class="metric-val">1 Single Line</div>
          <div class="metric-label">Global FIFO Queue</div>
        </div>
        <div class="metric-card green">
          <div class="metric-val">12 Tiers</div>
          <div class="metric-label">Doubling Ranks</div>
        </div>
        <div class="metric-card purple">
          <div class="metric-val">$40,950</div>
          <div class="metric-label">Total Rank Pool</div>
        </div>
      </div>

      <!-- Quick Intro Box -->
      <div class="info-box">
        <p>
          <strong style="color: #f0f6fc;">SEORALINK क्या है?</strong> 
          यह सियोल, दक्षिण कोरिया का एक ग्लोबल एफिलिएट सिस्टम है। इसमें पारंपरिक नेटवर्किंग की तरह <strong>कोई लेफ्ट/राइट लेग बैलेंसिंग, बाइनरी मैचिंग या कटिंग (flushing) नहीं</strong> होती। दुनिया भर से जुड़ने वाले सभी सदस्य <strong>एक ही ग्लोबल लाइन (Single Queue)</strong> में फर्स्ट-कम, फर्स्ट-सर्व आधार पर आते हैं और पूरी दुनिया की कम्युनिटी एक दूसरे को आगे बढ़ाती है।
        </p>
      </div>

      <!-- Core Mechanics: 3 Key Rules -->
      <div class="section-title">सिस्टम के 3 मुख्य नियम (The Core Engine)</div>
      <div class="grid-3">
        <div class="pillar-card">
          <div class="pillar-num">01. SINGLE QUEUE</div>
          <div class="pillar-title">एक ग्लोबल लाइन</div>
          <div class="pillar-desc">
            पूरी दुनिया (Korea, Dubai, Asia, Global) से जितने भी लोग जुड़ते हैं, सब एक ही कतार (Universal Single-Leg) में आते हैं। 100% ग्लोबल स्पिलओवर का फायदा मिलता है।
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">02. 2-ID LAW (TRIPOD)</div>
          <div class="pillar-title">2 आईडी का नियम</div>
          <div class="pillar-desc">
            किसी भी रैंक को पूरा करने के लिए आपके नीचे ग्लोबल कतार से केवल <strong>2 मैचिंग यूनिट्स</strong> का आना जरूरी है। 2 आईडी आते ही आपका वह रैंक 100% पूरा हो जाता है।
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-num">03. 2:1 MATH ENGINE</div>
          <div class="pillar-title">ऑटोमैटिक अपग्रेड</div>
          <div class="pillar-desc">
            आने वाली 2 यूनिट्स में से: <strong>पहला यूनिट</strong> आपका कैशआउट रिवॉर्ड फंड करता है और <strong>दूसरा यूनिट</strong> आपको अपने आप अगले ऊंचे टियर में अपग्रेड कर देता है।
          </div>
        </div>
      </div>

      <!-- Tripod Model Visual Box -->
      <div class="mechanism-container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 10px; color: #f0f6fc;">The Tripod Model (2:1 Ratio कैसे काम करता है)</strong>
          <span style="font-size: 8.5px; color: #58a6ff; font-weight: 600;">Deterministic Math</span>
        </div>
        <div class="tripod-diagram">
          <div class="node-box">आपकी पोजीशन<br><span style="font-size: 8px; color: #8b949e;">Tier N ($Entry)</span></div>
          <div class="node-arrow">➔ 2 IDs नीचे ➔</div>
          <div class="node-box sub">ID 1: Rank Cashout<br><span style="font-size: 8px; color: #3fb950;">(80% नेट कैश)</span></div>
          <div style="font-size: 11px; color: #8b949e;">+</div>
          <div class="node-box sub">ID 2: Auto-Upgrade<br><span style="font-size: 8px; color: #e3b341;">(अगला टियर फंड)</span></div>
        </div>
      </div>

      <!-- 3 Income Streams -->
      <div class="section-title">कमाई के 3 प्रमुख रास्ते (Multiple Revenue Streams)</div>

      <!-- Stream 1 -->
      <div class="stream-card">
        <div class="stream-left">
          <span class="stream-tag tag-instant">स्ट्रीम 1 • INSTANT REAL-TIME</span>
          <div class="stream-title">5% Direct Sponsor Reward (डायरेक्ट रेफरल बोनस)</div>
          <div class="stream-desc">आप जितने भी लोगों को अपने लिंक से $10 से ज्वाइन कराएंगे, हर डायरेक्ट पर 5% ($0.50 USDT) तुरंत आपके वॉलेट में मिलेगा। (अनलिमिटेड डायरेक्ट्स लगा सकते हैं)</div>
        </div>
        <div class="stream-amount">
          <div class="val">$0.50</div>
          <div class="sub">प्रति डायरेक्ट (तुरंत)</div>
        </div>
      </div>

      <!-- Stream 2 -->
      <div class="stream-card">
        <div class="stream-left">
          <span class="stream-tag tag-compound">स्ट्रीम 2 • COMPOUNDING MENTORSHIP</span>
          <div class="stream-title">5% Upline Upgrade Reward (टीम अपग्रेड इनकम)</div>
          <div class="stream-desc">जब भी आपका डायरेक्ट मेंबर अगले टियर्स (Tier 1 से 12) में प्रमोट होगा, आपको हर टियर से 5% अपलाइन बोनस मिलेगा। 1 पार्टनर पूरा करने पर $2,047.50 देता है!</div>
        </div>
        <div class="stream-amount">
          <div class="val">$2,047.50</div>
          <div class="sub">प्रति डायरेक्ट (कुल 12 रैंक)</div>
        </div>
      </div>

      <!-- Stream 3 -->
      <div class="stream-card">
        <div class="stream-left">
          <span class="stream-tag tag-leader">स्ट्रीम 3 • LEADERSHIP POOL</span>
          <div class="stream-title">12 Rank Progressive Rewards (ग्लोबल रैंक इनकम)</div>
          <div class="stream-desc">ग्लोबल सिंगल लाइन के 2-ID मैचिंग से $10 से शुरू होकर $20,480 तक के 12 रैंक पार होते हैं। कुल मिलाकर $40,950 USDT का रिवॉर्ड पूल बनता है।</div>
        </div>
        <div class="stream-amount">
          <div class="val">$40,950</div>
          <div class="sub">कुल रैंक रिवॉर्ड पूल</div>
        </div>
      </div>
    </div>

    <!-- Footer Page 1 -->
    <div class="footer">
      <div>SEORALINK Global Affiliate Ecosystem • Executive Presentation Summary</div>
      <div>Page 1 of 2 • <a href="https://seoralink.com">seoralink.com</a></div>
    </div>
  </div>


  <!-- ================= PAGE 2 ================= -->
  <div class="page">
    <div>
      <!-- Header Page 2 -->
      <div class="header" style="margin-bottom: 8px;">
        <div class="brand-title" style="font-size: 16px;">
          SEORALINK
          <span class="brand-badge">MASTER MATRIX & POLICIES</span>
        </div>
        <div class="header-sub">
          <strong>12 Progressive Ranks Breakdown & Governance</strong>
        </div>
      </div>

      <!-- 12 Ranks Table -->
      <div class="section-title">12 प्रोग्रेसिव रैंक्स का पूरा विवरण (Master Progression Matrix)</div>
      <table class="ranks-table">
        <thead>
          <tr>
            <th>Rank (टियर)</th>
            <th>Entry Value</th>
            <th>ज़रूरी Directs</th>
            <th>Rank Reward</th>
            <th>Upline 5% Bonus</th>
            <th>Net Cashout</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Junior</strong></td>
            <td>$10 Micro-Entry</td>
            <td><span class="badge-directs">0 Directs</span></td>
            <td>$0</td>
            <td>$0.50 (Direct)</td>
            <td>Account Active</td>
          </tr>
          <tr>
            <td><strong>Zen (Tier 1)</strong></td>
            <td>$10</td>
            <td><span class="badge-directs">2 Directs</span></td>
            <td>$10</td>
            <td>$0.50</td>
            <td>$8.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Alpha (Tier 2)</strong></td>
            <td>$20</td>
            <td><span class="badge-directs">2 Directs</span></td>
            <td>$20</td>
            <td>$1.00</td>
            <td>$16.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Nova (Tier 3)</strong></td>
            <td>$40</td>
            <td><span class="badge-directs">3 Directs</span></td>
            <td>$40</td>
            <td>$2.00</td>
            <td>$32.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Valt (Tier 4)</strong></td>
            <td>$80</td>
            <td><span class="badge-directs">3 Directs</span></td>
            <td>$80</td>
            <td>$4.00</td>
            <td>$64.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Apex (Tier 5)</strong></td>
            <td>$160</td>
            <td><span class="badge-directs">3 Directs</span></td>
            <td>$160</td>
            <td>$8.00</td>
            <td>$128.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Orbit (Tier 6)</strong></td>
            <td>$320</td>
            <td><span class="badge-directs">4 Directs</span></td>
            <td>$320</td>
            <td>$16.00</td>
            <td>$256.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Prime (Tier 7)</strong></td>
            <td>$640</td>
            <td><span class="badge-directs">4 Directs</span></td>
            <td>$640</td>
            <td>$32.00</td>
            <td>$512.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Elite (Tier 8)</strong></td>
            <td>$1,280</td>
            <td><span class="badge-directs">4 Directs</span></td>
            <td>$1,280</td>
            <td>$64.00</td>
            <td>$1,024.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Titan (Tier 9)</strong></td>
            <td>$2,560</td>
            <td><span class="badge-directs">5 Directs</span></td>
            <td>$2,560</td>
            <td>$128.00</td>
            <td>$2,048.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Royal (Tier 10)</strong></td>
            <td>$5,120</td>
            <td><span class="badge-directs">5 Directs</span></td>
            <td>$5,120</td>
            <td>$256.00</td>
            <td>$4,096.00 (80%)</td>
          </tr>
          <tr>
            <td><strong>Legend (Tier 11)</strong></td>
            <td>$10,240</td>
            <td><span class="badge-directs">6 Directs</span></td>
            <td>$10,240</td>
            <td>$512.00</td>
            <td>$8,192.00 (80%)</td>
          </tr>
          <tr class="highlight-tier">
            <td><strong>Ultima (Tier 12) ★</strong></td>
            <td>$20,480</td>
            <td><span class="badge-directs" style="border-color: #d29922; color: #e3b341;">6 Directs</span></td>
            <td>$20,480</td>
            <td>$1,024.00</td>
            <td><strong>$18,432.00 (90% Net)</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Directs Requirement Summary Box -->
      <div style="background: rgba(35, 134, 54, 0.1); border: 1px solid rgba(63, 185, 80, 0.3); border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-size: 9.5px; color: #7ee787;">
        <strong>ज़रूरी डायरेक्ट्स का नियम (अधिकतम 6 डायरेक्ट्स):</strong>
        Zen & Alpha के लिए 2 डायरेक्ट • Nova, Valt, Apex के लिए 3 डायरेक्ट • Orbit, Prime, Elite के लिए 4 डायरेक्ट • Titan & Royal के लिए 5 डायरेक्ट • Legend & Ultima के लिए <strong>अधिकतम कुल 6 डायरेक्ट्स</strong> चाहिए।
      </div>

      <!-- Withdrawal & Protocol Reserve Policy -->
      <div class="section-title">विड्रॉल और प्रोटोकॉल रिज़र्व पॉलिसी (Capital Reserve Rules)</div>
      <div class="reserve-grid">
        <div class="reserve-card regular">
          <div class="reserve-title">
            <span>Ranks 1 to 11 (Standard Tiers)</span>
            <span style="color: #58a6ff;">20% Reserve</span>
          </div>
          <p style="font-size: 9px; color: #8b949e;">
            रैंक 1 से 11 तक मिलने वाले रिवॉर्ड का <strong>80% तुरंत आपके वॉलेट में कैशआउट</strong> होता है और <strong>20% प्रोटोकॉल रिज़र्व</strong> में जाता है जिससे नए मेंबर्स के लिए कतार तेजी से चलती रहती है।
          </p>
          <div class="reserve-stat">
            <div>Net Cash: <span style="color: #3fb950; font-weight: 700;">80%</span></div>
            <div>Reserve: <span style="color: #58a6ff; font-weight: 700;">20% Reinvest</span></div>
          </div>
        </div>

        <div class="reserve-card ultima">
          <div class="reserve-title">
            <span style="color: #e3b341;">Rank 12 Ultima (Pinnacle Privilege)</span>
            <span style="color: #e3b341;">10% Only</span>
          </div>
          <p style="font-size: 9px; color: #8b949e;">
            अंतिम रैंक (Ultima) पर पहुँचने पर डिडक्शन घटकर केवल <strong>10%</strong> रह जाता है। आपको कुल $20,480 में से पूरे <strong>$18,432.00 USDT (90% शुद्ध लाभ)</strong> का डायरेक्ट नेट पेआउट मिलता है।
          </p>
          <div class="reserve-stat">
            <div>Peak Cashout: <span style="color: #e3b341; font-weight: 700;">90% ($18,432)</span></div>
            <div>Fee: <span style="color: #8b949e; font-weight: 700;">10% ($2,048)</span></div>
          </div>
        </div>
      </div>

      <!-- 5-Step Getting Started Guide -->
      <div class="section-title">शुरुआत कैसे करें? (How to Get Started - 5 Steps)</div>
      <div class="steps-row">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-name">Register</div>
          <div class="step-desc">स्पॉन्सर के इनवाइट लिंक से फ्री साइन अप करें।</div>
        </div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-name">Activate</div>
          <div class="step-desc">$10 USDT से अकाउंट एक्टिवेट कर ग्लोबल कतार में स्थान लॉक करें।</div>
        </div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-name">Share</div>
          <div class="step-desc">मित्रों को रेफर कर प्रति डायरेक्ट $0.50 तुरंत कमाएं।</div>
        </div>
        <div class="step-item">
          <div class="step-num">4</div>
          <div class="step-name">Qualify</div>
          <div class="step-desc">2 से 6 डायरेक्ट्स पूरे कर उच्च स्तर अनलॉक करें।</div>
        </div>
        <div class="step-item">
          <div class="step-num">5</div>
          <div class="step-name">Scale</div>
          <div class="step-desc">ग्लोबल मोमेंटम के साथ Ultima ($18,432) तक पहुँचें।</div>
        </div>
      </div>

      <!-- Why SEORALINK Summary -->
      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 7px 10px; font-size: 9px; color: #8b949e; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="color: #58a6ff; font-weight: 700;">मुख्य विशेषताएं:</span>
          ✓ कोई लेग मैचिंग का झंझट नहीं &nbsp;|&nbsp; 
          ✓ 100% ग्लोबल सिंगल लाइन &nbsp;|&nbsp; 
          ✓ गणितीय रूप से 100% पारदर्शी &nbsp;|&nbsp; 
          ✓ इंस्टेंट वॉलेट पेआउट
        </div>
        <div style="color: #3fb950; font-weight: 700;">
          Web: seoralink.com
        </div>
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer">
      <div>SEORALINK Global Affiliate Architecture • Prepared for Quick Understanding</div>
      <div>Page 2 of 2 • <a href="https://seoralink.com">seoralink.com</a></div>
    </div>
  </div>

</body>
</html>`;

const targetHtml = path.join(__dirname, '..', 'PDF', 'SEORALINK_Easy_Summary.html');
fs.writeFileSync(targetHtml, htmlContent, 'utf8');
console.log('Summary HTML generated successfully at:', targetHtml);
