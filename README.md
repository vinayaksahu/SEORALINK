# SEORALINK — Centralized Fintech & Affiliate Platform

An enterprise-grade centralized affiliate and queue progression platform engineered according to the official **SEORALINK_Presentation_16x9.pdf** specification. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## 🏛️ Project Directory Structure

`
SEORALINK/
├── src/                               # Next.js Fullstack Application
│   ├── app/                           # App Router (Pages & API Routes)
│   │   ├── (auth)/                    # Public Auth (Login, Register with Sponsor Check)
│   │   ├── admin/                     # Master Admin Console (Dashboard, Deposits, Payouts, Users, Queue, Settings)
│   │   ├── adminlogin/                # Isolated Admin Login Portal
│   │   ├── member/                    # Member Portal (Dashboard, 2:1 Tripod Queue, Activation, Wallet, Team, Ledger)
│   │   └── api/                       # REST API Endpoints (Auth, Member, Admin)
│   ├── components/                    # Reusable UI & Layout Components
│   └── lib/                           # Core Business Engines
│       ├── activation.ts              #  Node Activation & Direct Referral Bonus
│       ├── auth.ts                    # JWT Session Tokens & Bcrypt Hashing
│       ├── constants.ts               # 12-Tier Ladder Config & Queue Parameters
│       ├── db.ts                      # PostgreSQL Prisma Client
│       ├── ledger.ts                  # Atomic Dual-Wallet Ledger Accounting
│       └── queueEngine.ts             # 2:1 Tripod Single-Leg Advancement Engine
│
├── prisma/
│   └── schema.prisma                  # PostgreSQL Database Schema
│
├── scripts/
│   ├── seed.ts                        # Master Seeder (Super Admin & Genesis Node)
│   └── test-simulation.ts             # Automated 5-Stage Business Logic Test Suite
│
├── PDF/                               # Official Business Presentations & PDF Plans
│   ├── SEORALINK_Presentation_16x9.pdf
│   ├── SEORALINK_Affiliate_Business_Plan.pdf
│   └── ...
│
├── docs/
│   └── presentation/                  # HTML Pitch Decks, Whitepapers & Deck Generators
│
├── archive/
│   └── blockchain-prototype/          # Archived Smart Contract Prototype & Exploration
│
├── assets/                            # Brand Imagery & Wallpapers
└── package.json                       # Project Dependencies & Scripts
`

---

## 💎 Core Business Model & Mathematical Engines

### 1. 12-Tier Doubling Ladder
- **Tier 0 (Junior)**:  Entry • 0 Directs • Micro-entry placement
- **Tier 1 (Zen)**:  Value • 2 Directs • .00 Net Payout (20% Reserve)
- **Tier 2 (Alpha)**:  Value • 2 Directs • .00 Net Payout (20% Reserve)
- **Tier 3 (Nova)**:  Value • 3 Directs • .00 Net Payout (20% Reserve)
- **Tier 4 (Valt)**:  Value • 3 Directs • .00 Net Payout (20% Reserve)
- **Tier 5 (Apex)**:  Value • 3 Directs • .00 Net Payout (20% Reserve)
- **Tier 6 (Orbit)**:  Value • 4 Directs • .00 Net Payout (20% Reserve)
- **Tier 7 (Prime)**:  Value • 4 Directs • .00 Net Payout (20% Reserve)
- **Tier 8 (Elite)**: ,280 Value • 4 Directs • ,024.00 Net Payout (20% Reserve)
- **Tier 9 (Titan)**: ,560 Value • 5 Directs • ,048.00 Net Payout (20% Reserve)
- **Tier 10 (Royal)**: ,120 Value • 5 Directs • ,096.00 Net Payout (20% Reserve)
- **Tier 11 (Legend)**: ,240 Value • 6 Directs • ,192.00 Net Payout (20% Reserve)
- **Tier 12 (Ultima)**: ,480 Value • 6 Directs • **,432.00 Net Payout (10% Privilege Reserve)**
- **Cumulative Earnings**: **,950.00 Gross Pool** • **,608.00 Total Net Payout**

### 2. 2:1 Tripod Single-Leg Queue Progression
- Front queue node at index i matches and completes when 	ierEntries.length >= 2 * i + 3.
- **First downstream entrant (50%)**: Credits member net cash payout.
- **Second downstream entrant (100%)**: Automatically enters member into next higher doubling tier.

### 3. Referral Commissions
- **5% Direct Sponsor Cash**: .50 USDT instantly credited upon every  activation.
- **5% Upline Mentorship Override**: 5% credited to direct mentor at every completed rank tier (,047.50 USDT cumulative per mentee).

### 4. Strict Dual-Wallet Ledger Accounting
- **Fund Wallet (undBalance)**: Used exclusively for deposits and account activations.
- **Income Wallet (incomeBalance)**: Receives all queue payouts, referral commissions, and mentorship rewards; used for withdrawals.
- Every financial mutation writes an immutable LedgerEntry with strict idempotency via unique eferenceKey.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Recommended: Node 20+)
- PostgreSQL database (or Neon, Supabase)

### 1. Installation
`ash
npm install
`

### 2. Environment Configuration
Copy .env.example to .env and fill in your details:
`env
DATABASE_URL=postgresql://username:password@your-host:5432/dbname?sslmode=require&schema=seoralink
DIRECT_URL=postgresql://username:password@your-host:5432/dbname?sslmode=require&schema=seoralink
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_NAME=SEORALINK
NEXT_PUBLIC_APP_URL=http://localhost:3000
`

### 3. Database Schema Setup & Seeding
`ash
# Push schema tables to database
npx prisma db push

# Seed initial Super Admin & Genesis Node
npx tsx scripts/seed.ts
`

### 4. Run Development Server
`ash
npm run dev
`

Visit:
- **Landing Page**: http://localhost:3000
- **Member Portal**: http://localhost:3000/login
- **Admin Console**: http://localhost:3000/adminlogin

---

## 🔑 Default Seed Credentials

| Role | Identifier | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | SL000001 | dmin@seoralink.com | Admin@123456 |
| **Genesis Node** | SL100000 | genesis@seoralink.com | Genesis@123456 |

---

## 🧪 Simulation Testing
Run the automated 5-stage simulation test suite to verify queue progression, referral distribution, and fee calculations:
`ash
npx tsx scripts/test-simulation.ts
`
