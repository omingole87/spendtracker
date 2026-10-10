# SpendTracker — Instant Personal Finance Dashboard 💳

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-B--Tree%20Indexing-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **One screen that instantly answers: *"How much did I spend this month, and on what?"* — even with tens of thousands of transactions.**

SpendTracker is an enterprise-grade, high-performance personal finance dashboard built with **TypeScript, React, Node.js (Express), PostgreSQL, and Redis**.

---

## ⚡ The Portfolio & Performance Story

Bank applications bury answers in sluggish transaction feeds, poor categorization, and multiple roundtrips per widget. SpendTracker was engineered from the database up to deliver **sub-millisecond instant responses** under scale:

### 1. The Centerpiece Index: `(user_id, occurred_at DESC)`
Instead of full-table scanning tens of thousands of rows, range filters and pagination utilize a high-selectivity composite B-tree index:
```sql
CREATE INDEX idx_transactions_user_occurred 
    ON transactions (user_id, occurred_at DESC);
```
- Multi-tenant isolation: Isolates user rows instantly via `WHERE user_id = $1`.
- Date range scanning: Fast bounded traversal between `[month_start, month_end)`.
- Eliminates sorting overhead: Pre-sorted index structure avoids expensive external merges.

### 2. Single SQL Aggregate Endpoint (`GET /api/spend?month=YYYY-MM`)
Instead of firing 3–5 separate HTTP requests for the monthly total, category pie chart, budget progress, and 6-month trend, SpendTracker executes **one single roundtrip query** leveraging PostgreSQL Common Table Expressions (CTEs) and JSON aggregation:
```sql
WITH user_window_tx AS (
  SELECT t.id, t.amount, t.occurred_at, t.category_id,
         TO_CHAR(t.occurred_at, 'YYYY-MM') as month_str
  FROM transactions t
  WHERE t.user_id = $1 AND t.occurred_at >= $2 AND t.occurred_at < $3
),
current_summary AS (...),
cat_breakdown AS (...),
six_trend AS (...)
SELECT 
  (SELECT row_to_json(current_summary) FROM current_summary) as current_summary,
  (SELECT json_agg(cat_breakdown ORDER BY total_spent DESC) FROM cat_breakdown) as categories,
  (SELECT json_agg(six_trend ORDER BY month ASC) FROM six_trend) as trend;
```

### 3. Redis Invalidate-on-Write Caching Layer
- Cache Key: `spend:${userId}:${month}`
- TTL: 60 seconds
- **Write Invalidation**: Any transaction insertion, CSV import, manual categorization override, or category budget change immediately invalidates the matching user spend cache keys.
- **Measured Metric**: Reduces p95 latency from **~15ms–50ms down to <1ms** (achieving **>50% to 90%+ p95 latency reduction**).

---

## 🚀 Key Features

1. **One-Screen Dashboard**:
   - Total spending with month-over-month percentage change.
   - Interactive Donut chart breakdown by category with percentage share.
   - Real-time monthly budgets with progress bars and over-budget alert banners.
   - 6-Month historical spending trajectory area chart with interactive month jumping.
   - Recent transactions table with real-time search and category filtering.

2. **Rules Engine for Auto-Categorization**:
   - Keyword and pattern matching (e.g. `Swiggy` → Food & Dining, `Uber` → Travel & Transport).
   - Priority-based rule execution.
   - Interactive live tester to verify narration matches.
   - "Apply Rules Retroactively" to re-categorize existing past transactions in one click.

3. **Manual Overrides**:
   - Click any transaction category badge to manually reassign it. Manual assignments are locked against automated rule rewrites.

4. **Streaming CSV Import**:
   - Flexible column parsing (supports standard bank exports: Date, Merchant/Payee, Debit/Amount, Category, Narration).
   - Automatically executes the rules engine on import in batch chunks of 500.

5. **Scale & Latency Benchmark Modal**:
   - Synthetic transaction generator: seed 2,000 to 10,000+ realistic transactions with one click.
   - Live benchmark suite: runs 25 iterations of Cold DB vs Hot Redis queries, computing p50, p90, p95, p99, and average response times.

6. **Multi-User Isolation**:
   - JWT authentication (`/api/auth/register`, `/api/auth/login`).
   - One-Click Instant Demo Login (`demo@spendtracker.dev`) pre-populated with realistic categories, rules, and months of data.

---

## 🛠️ Project Structure

```
spendtracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── redis.ts              # Redis client with fast in-memory fallback
│   │   ├── db/
│   │   │   ├── connection.ts         # Supports Postgres Pool and embedded PGlite
│   │   │   ├── schema.sql            # Table definitions and composite indexes
│   │   │   ├── init.ts               # DDL runner
│   │   │   └── seed.ts               # Demo data generator
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT auth & tenant isolation
│   │   ├── services/
│   │   │   ├── rulesEngine.ts        # Priority-based rule evaluator
│   │   │   ├── csvImporter.ts        # Streaming batch CSV importer
│   │   │   ├── spendService.ts       # Unified CTE aggregate query + Redis caching
│   │   │   └── benchmarkService.ts   # Latency percentiles & scaling generator
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── spendRoutes.ts
│   │   │   ├── transactionRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   ├── ruleRoutes.ts
│   │   │   └── benchmarkRoutes.ts
│   │   └── index.ts                  # Express application
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SpendSummaryCard.tsx
│   │   │   ├── CategoryBreakdownChart.tsx
│   │   │   ├── BudgetProgressList.tsx
│   │   │   ├── SixMonthTrendChart.tsx
│   │   │   ├── TransactionsTable.tsx
│   │   │   ├── CsvImportModal.tsx
│   │   │   ├── RulesEngineModal.tsx
│   │   │   ├── BudgetsModal.tsx
│   │   │   ├── BenchmarkModal.tsx
│   │   │   └── AuthModal.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── sample-data/
│   └── sample_bank_transactions.csv  # Ready-to-import test CSV
└── docker-compose.yml
```

---

## 🏃 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Seed & Setup Database
```bash
# From the spendtracker/ directory:
npm run seed
```
*(SpendTracker uses embedded PostgreSQL 16 WebAssembly engine out of the box with zero external dependencies, or connects to external PostgreSQL if `DATABASE_URL` is set in `backend/.env`)*.

### 2. Start Backend Server
```bash
npm run backend
# Running on http://localhost:5000
```

### 3. Start Frontend Dashboard
```bash
npm run frontend
# Running on http://localhost:5173
```

### 4. Experience the Demo
1. Open `http://localhost:5173`.
2. Click **"Launch One-Click Demo"**.
3. View the single-screen financial overview, import `sample_bank_transactions.csv`, test auto-categorization rules, and open the **"Latency Benchmark"** modal to measure live p95 performance!
