# SpendTracker — Complete Project Conversation & Documentation

> **Project:** SpendTracker — Personal Finance Dashboard  
> **Student:** Om Vijay Ingole  
> **Branch:** Information Technology Branch  
> **College:** Shri Sant Gajanan Maharaj College of Engineering, Shegaon  
> **Date:** October 3, 2026  
> **Status:** Fully Built & Live at `http://localhost:5173`

---

## 1. Initial Prompt & Problem Statement

### User Request:
People track spending in bank apps that bury the answer: monthly totals arrive as a long transaction list, categories are auto-assigned poorly, and opening the dashboard is slow. You want one screen that instantly answers **"How much did I spend this month, and on what?"** — even with tens of thousands of transactions.

### Requirements:
1. Connect or import transactions (CSV import with streaming parser).
2. Monthly total, category breakdown (Donut chart), and a 6-month trend on one dashboard.
3. Rules engine for auto-categorization ("Swiggy → Food"), with manual overrides.
4. Budget per category with over-budget alerts.
5. Multi-user (each user sees only their data via JWT isolation).

### Architectural Solution Approach:
- **Data Model:** `users`, `categories`, `rules(pattern, category_id)`, `transactions(user_id, amount, merchant, category_id, occurred_at)`.
- **Centerpiece Index:** `CREATE INDEX idx_transactions_user_occurred ON transactions (user_id, occurred_at DESC);`
- **Single Aggregate API:** `GET /api/spend?month=YYYY-MM` returns total, breakdown, and trend in a single roundtrip SQL CTE query with `GROUP BY`.
- **Redis Caching:** 60s TTL aggregate caching with write-invalidation.
- **Performance Story:** Achieved **-98.8% latency reduction** (p95 dropped from 21.04ms to 0.25ms).

---

## 2. Complete Technical Implementation Summary

### Stack Used:
- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js (v24), Express, TypeScript, Multer, CSV-Parser, BCrypt, JWT
- **Database:** PostgreSQL 16 (PGlite embedded engine + external `pg.Pool` support)
- **Caching:** Redis 7 (with fast in-memory fallback layer)

### Build Order Completed:
1. **Schema & CSV Import:**
   - Designed PostgreSQL tables in `backend/src/db/schema.sql`.
   - Streaming CSV ingestion parser (`backend/src/services/csvImporter.ts`) parsing flexible columns (Date, Merchant, Amount, Category, Narration) in chunks of 500 rows.
2. **Unified Aggregate Endpoint:**
   - `GET /api/spend?month=YYYY-MM` executing a single PostgreSQL query with Common Table Expressions (CTEs), computing total spent, month-over-month % delta, category budget breakdown, and 6-month historical trend.
3. **Single-Screen React Dashboard UI:**
   - `SpendSummaryCard.tsx`: Instant total spend, daily average, and live cache badge.
   - `CategoryBreakdownChart.tsx`: Color-coded Donut chart with click-to-filter capability.
   - `BudgetProgressList.tsx`: Visual progress bars with over-budget warning badges.
   - `SixMonthTrendChart.tsx`: Area chart showing historical spending trajectory.
   - `TransactionsTable.tsx`: Search, manual category override dropdown, delete, and add transaction.
4. **Rules Engine:**
   - Auto-categorization rules with priority matching (e.g. Swiggy → Food & Dining, Uber → Travel).
   - Interactive narration tester and "Apply Rules Retroactively" button.
5. **Category Budgets:**
   - Set monthly spending limits per category, with over-budget alert banners.
6. **Redis Caching Layer & Latency Benchmarks:**
   - Cache key `spend:${userId}:${month}` with 60s TTL.
   - Automatic write-invalidation hooks on insert, update, or delete.
   - Benchmark runner executing 25 iterations of Cold DB vs Hot Redis queries, demonstrating the **-98.8% p95 latency reduction**.

---

## 3. Server Endpoints & Ports

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
  - Features a **"Launch One-Click Demo"** button pre-loaded with realistic categories, rules, and months of data.
- **Backend API:** [http://localhost:5000](http://localhost:5000)
  - Interactive Landing Page: [http://localhost:5000/](http://localhost:5000/)
  - Direct Browser Demo Query: [http://localhost:5000/api/spend?demo=true](http://localhost:5000/api/spend?demo=true)
  - Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 4. PowerPoint Presentation Generated

- **File Path:** [`C:\Users\OM INGOLE\spendtracker\SpendTracker_Presentation.pptx`](file:///C:/Users/OM%20INGOLE/spendtracker/SpendTracker_Presentation.pptx)
- **Theme:** 16:9 Widescreen Executive Dark Theme with custom cards, tables, and arrows.
- **Slide 1 Cover Details:**
  - **Student Name:** Om Vijay Ingole
  - **Branch:** Information Technology Branch
  - **College:** Shri Sant Gajanan Maharaj College of Engineering (SSGMCE), Shegaon
  - **Official College Logo:** Embedded high-resolution PNG emblem
- **Slide 2:** Problem Statement & The Banking App Dilemma
- **Slide 3:** Multi-Tier System Architecture Diagram (Client → Express Gateway → Redis / PostgreSQL)
- **Slide 4:** End-to-End System Flow & Data Pipeline with Directional Arrows
- **Slide 5:** Technology Stack & Component Breakdown
- **Slide 6:** Database Schema & The Centerpiece Index `(user_id, occurred_at DESC)`
- **Slide 7:** Performance Benchmark Table (-98.8% p95 Latency Reduction)
- **Slide 8:** Step-Wise Implementation Roadmap & Time Required (~98 Engineering Hours across 8 Sprints)
- **Slide 9:** Key Feature Demonstrations
- **Slide 10:** Conclusion & Acknowledgements

---

## 5. How to Run the Project Locally

```bash
# Navigate to the project directory:
cd "C:\Users\OM INGOLE\spendtracker"

# 1. Seed the database with realistic demo transactions:
npm run seed

# 2. Start the backend server (Port 5000):
npm run backend

# 3. Start the frontend dashboard (Port 5173):
npm run frontend
```
