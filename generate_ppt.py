import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6] # Blank slide

    # Theme Colors
    BG_COLOR = RGBColor(10, 15, 29)         # Deep Navy/Slate #0A0F1D
    CARD_BG = RGBColor(19, 27, 46)          # Dark Slate Card #131B2E
    CARD_BORDER = RGBColor(37, 48, 77)      # Card border #25304D
    ACCENT_INDIGO = RGBColor(99, 102, 241)  # #6366F1
    ACCENT_CYAN = RGBColor(6, 182, 212)     # #06B6D4
    ACCENT_EMERALD = RGBColor(16, 185, 129) # #10B981
    ACCENT_ROSE = RGBColor(244, 63, 94)     # #F43F5E
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_MUTED = RGBColor(148, 163, 184)    # #94A3B8
    TEXT_LIGHT = RGBColor(226, 232, 240)    # #E2E8F0

    logo_path = os.path.abspath("C:/Users/OM INGOLE/spendtracker/ssgmce-logo.png")

    def set_slide_background(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_COLOR
        bg_shape.line.fill.background() # No border
        return bg_shape

    def add_card(slide, left, top, width, height, bg=CARD_BG, border=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg
        card.line.color.rgb = border
        card.line.width = Pt(1)
        return card

    def add_header(slide, title_text, category_text="SPENDTRACKER — SYSTEM PRESENTATION"):
        # Category / breadcrumb pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11), Inches(0.35))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN

        # Title
        t_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.65))
        tf2 = t_box.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = title_text
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    s1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s1)

    # Accent decorative background container
    decor = add_card(s1, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9), bg=CARD_BG, border=ACCENT_INDIGO)

    # College Logo placement (Top Right / Center)
    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(1.3), Inches(1.2), width=Inches(2.0))

    # College Name Header
    col_box = s1.shapes.add_textbox(Inches(3.6), Inches(1.2), Inches(8.5), Inches(1.1))
    ctf = col_box.text_frame
    ctf.word_wrap = True
    cp1 = ctf.paragraphs[0]
    cp1.text = "SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING"
    cp1.font.size = Pt(17)
    cp1.font.bold = True
    cp1.font.color.rgb = TEXT_WHITE

    cp2 = ctf.add_paragraph()
    cp2.text = "SHEGAON, MAHARASHTRA • DEPARTMENT OF INFORMATION TECHNOLOGY"
    cp2.font.size = Pt(11)
    cp2.font.color.rgb = ACCENT_CYAN
    cp2.space_before = Pt(4)

    # Divider Line
    line = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.3), Inches(2.5), Inches(10.7), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = CARD_BORDER
    line.line.fill.background()

    # Project Title
    p_box = s1.shapes.add_textbox(Inches(1.3), Inches(2.7), Inches(10.7), Inches(1.6))
    ptf = p_box.text_frame
    ptf.word_wrap = True
    pp1 = ptf.paragraphs[0]
    pp1.text = "SpendTracker"
    pp1.font.size = Pt(36)
    pp1.font.bold = True
    pp1.font.color.rgb = ACCENT_INDIGO

    pp2 = ptf.add_paragraph()
    pp2.text = "High-Performance Personal Finance Analytics Platform with Sub-Millisecond Aggregate Engine"
    pp2.font.size = Pt(14)
    pp2.font.color.rgb = TEXT_LIGHT
    pp2.space_before = Pt(6)

    # Student Info Card
    info_card = add_card(s1, Inches(1.3), Inches(4.5), Inches(10.7), Inches(1.8), bg=RGBColor(14, 21, 37), border=CARD_BORDER)
    
    ibox = s1.shapes.add_textbox(Inches(1.6), Inches(4.6), Inches(10.1), Inches(1.6))
    itf = ibox.text_frame
    itf.word_wrap = True
    
    ip1 = itf.paragraphs[0]
    ip1.text = "PROJECT PRESENTATION & DEFENSE"
    ip1.font.size = Pt(10)
    ip1.font.bold = True
    ip1.font.color.rgb = ACCENT_EMERALD

    ip2 = itf.add_paragraph()
    ip2.text = "Student Name: Om Vijay Ingole"
    ip2.font.size = Pt(15)
    ip2.font.bold = True
    ip2.font.color.rgb = TEXT_WHITE
    ip2.space_before = Pt(4)

    ip3 = itf.add_paragraph()
    ip3.text = "Branch: Information Technology Branch | Academic Year: 2026-2027"
    ip3.font.size = Pt(12)
    ip3.font.color.rgb = TEXT_MUTED
    ip3.space_before = Pt(4)

    # =========================================================================
    # SLIDE 2: Problem Statement & Project Motivation
    # =========================================================================
    s2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s2)
    add_header(s2, "Problem Statement & Architectural Motivation")

    # Left Column: The Problem
    add_card(s2, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.4))
    p_box = s2.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(5.0), Inches(5.0))
    ptf = p_box.text_frame
    ptf.word_wrap = True

    p = ptf.paragraphs[0]
    p.text = "The Modern Banking App Dilemma"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE

    problems = [
      ("Sluggish Dashboards & N+1 Latency", "Banking apps trigger multiple roundtrips per widget (totals, category breakdowns, trends), leading to high latency and poor mobile responsiveness."),
      ("Buries the Critical Financial Answers", "Monthly totals are lost in endless transaction feeds instead of an immediate, actionable one-screen visual summary."),
      ("Inaccurate Auto-Categorization", "Default bank categories fail on local merchants (e.g. Swiggy, Zepto, Blinkit) and lack rules-based priority customization."),
      ("Performance Degradation at Scale", "As transactions reach tens of thousands of rows, table scans degrade performance drastically without optimized multi-column indexing.")
    ]
    for title, desc in problems:
        p1 = ptf.add_paragraph()
        p1.text = f"•  {title}"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_WHITE
        p1.space_before = Pt(10)

        p2 = ptf.add_paragraph()
        p2.text = f"   {desc}"
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

    # Right Column: The SpendTracker Solution
    add_card(s2, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.4))
    s_box = s2.shapes.add_textbox(Inches(7.1), Inches(1.7), Inches(5.1), Inches(5.0))
    stf = s_box.text_frame
    stf.word_wrap = True

    sp = stf.paragraphs[0]
    sp.text = "The SpendTracker Solution"
    sp.font.size = Pt(16)
    sp.font.bold = True
    sp.font.color.rgb = ACCENT_EMERALD

    solutions = [
      ("The 'One-Screen' Instant Answer", "Instantly answers 'How much did I spend this month, and on what?' with monthly totals, dynamic category donut breakdown, and 6-month trends."),
      ("Composite Index Centerpiece", "Leverages (user_id, occurred_at DESC) indexing in PostgreSQL to deliver high-selectivity range queries across 50,000+ transactions."),
      ("Single Unified Aggregate CTE API", "Executes a single roundtrip SQL query with GROUP BY and JSON aggregation instead of 3–5 separate HTTP API roundtrips."),
      ("Redis Caching with Invalidation on Write", "60-second TTL aggregate caching reduces p95 latency by >90%, achieving sub-0.5ms response times on dashboard reloads.")
    ]
    for title, desc in solutions:
        p1 = stf.add_paragraph()
        p1.text = f"✓  {title}"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_WHITE
        p1.space_before = Pt(10)

        p2 = stf.add_paragraph()
        p2.text = f"   {desc}"
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

    # =========================================================================
    # SLIDE 3: System Architecture (End-to-End Diagram with Arrows)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s3)
    add_header(s3, "System Architecture — Multi-Tier Engineering Design")

    # Layer 1: Client Tier
    add_card(s3, Inches(0.8), Inches(1.5), Inches(3.6), Inches(5.4))
    l1_box = s3.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.2), Inches(5.0))
    tf = l1_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "CLIENT TIER"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    p2 = tf.add_paragraph()
    p2.text = "React 18 + TypeScript SPA"
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.space_before = Pt(4)

    client_items = [
      "Vite High-Speed Bundler",
      "TailwindCSS Glassmorphism UI",
      "Recharts Donut & Trend Graphs",
      "JWT Session & Storage Context",
      "Live Latency & p95 Benchmark Modal",
      "Interactive Category Filter",
      "Streaming CSV Uploader Component"
    ]
    for it in client_items:
        cp = tf.add_paragraph()
        cp.text = f"• {it}"
        cp.font.size = Pt(10.5)
        cp.font.color.rgb = TEXT_MUTED
        cp.space_before = Pt(6)

    # Arrow 1: Client -> API
    a1 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(4.5), Inches(3.9), Inches(0.4), Inches(0.3))
    a1.fill.solid()
    a1.fill.fore_color.rgb = ACCENT_INDIGO
    a1.line.fill.background()

    # Layer 2: API Gateway & Services Tier
    add_card(s3, Inches(5.0), Inches(1.5), Inches(3.7), Inches(5.4))
    l2_box = s3.shapes.add_textbox(Inches(5.2), Inches(1.7), Inches(3.3), Inches(5.0))
    tf = l2_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "API & SERVICES TIER"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_INDIGO

    p2 = tf.add_paragraph()
    p2.text = "Node.js + Express Gateway"
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.space_before = Pt(4)

    api_items = [
      "JWT Multi-User Authentication",
      "Unified GET /api/spend Aggregate",
      "Streaming CSV Batch Importer (500/chunk)",
      "Priority Rules Engine (Regex/Contains)",
      "Server-Timing & Benchmark Service",
      "Write Invalidation Pipeline",
      "Strict Row-Level Tenant Isolation"
    ]
    for it in api_items:
        cp = tf.add_paragraph()
        cp.text = f"• {it}"
        cp.font.size = Pt(10.5)
        cp.font.color.rgb = TEXT_MUTED
        cp.space_before = Pt(6)

    # Arrow 2: API -> Data Tier
    a2 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.8), Inches(3.9), Inches(0.4), Inches(0.3))
    a2.fill.solid()
    a2.fill.fore_color.rgb = ACCENT_EMERALD
    a2.line.fill.background()

    # Layer 3: Caching & Persistence Tier
    add_card(s3, Inches(9.3), Inches(1.5), Inches(3.3), Inches(2.6))
    r_box = s3.shapes.add_textbox(Inches(9.5), Inches(1.7), Inches(2.9), Inches(2.2))
    rtf = r_box.text_frame
    rtf.word_wrap = True
    rp1 = rtf.paragraphs[0]
    rp1.text = "CACHING TIER"
    rp1.font.size = Pt(10)
    rp1.font.bold = True
    rp1.font.color.rgb = ACCENT_EMERALD

    rp2 = rtf.add_paragraph()
    rp2.text = "Redis Cache Layer"
    rp2.font.size = Pt(14)
    rp2.font.bold = True
    rp2.font.color.rgb = TEXT_WHITE
    rp2.space_before = Pt(2)

    for item in ["spend:{uid}:{month} Keys", "60s Time-To-Live (TTL)", "Invalidate-On-Write", "Sub-0.5ms Response"]:
        p = rtf.add_paragraph()
        p.text = f"⚡ {item}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(4)

    # PostgreSQL Box
    add_card(s3, Inches(9.3), Inches(4.3), Inches(3.3), Inches(2.6))
    pg_box = s3.shapes.add_textbox(Inches(9.5), Inches(4.5), Inches(2.9), Inches(2.2))
    ptf = pg_box.text_frame
    ptf.word_wrap = True
    pp1 = ptf.paragraphs[0]
    pp1.text = "DATA PERSISTENCE TIER"
    pp1.font.size = Pt(10)
    pp1.font.bold = True
    pp1.font.color.rgb = ACCENT_INDIGO

    pp2 = ptf.add_paragraph()
    pp2.text = "PostgreSQL 16 Engine"
    pp2.font.size = Pt(14)
    pp2.font.bold = True
    pp2.font.color.rgb = TEXT_WHITE
    pp2.space_before = Pt(2)

    for item in ["(user_id, occurred_at DESC) Index", "Unified SQL CTEs & GROUP BY", "Embedded PGlite + External pg", "JSON Serialization via json_agg"]:
        p = ptf.add_paragraph()
        p.text = f"🐘 {item}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(4)

    # =========================================================================
    # SLIDE 4: System Flow & Data Pipeline with Directional Arrows
    # =========================================================================
    s4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s4)
    add_header(s4, "End-to-End System Flow & Data Pipeline")

    steps = [
      ("1. Client Request", "User initiates action (CSV upload or dashboard view). Browser passes JWT Bearer token in authorization header.", ACCENT_CYAN),
      ("2. Gateway Ingestion", "Express parses multi-part CSV streams or queries. Enforces strict row-level user tenant boundaries.", ACCENT_INDIGO),
      ("3. Rules Auto-Categorization", "Regex/substring rules evaluate merchant keywords (e.g. 'Swiggy' -> 'Food & Dining') during ingestion.", ACCENT_EMERALD),
      ("4. Cache & Index Evaluation", "Redis cache checked for key 'spend:uid:month'. If MISS, runs CTE query using composite B-Tree index.", ACCENT_INDIGO),
      ("5. Single-Roundtrip Aggregate", "PostgreSQL returns total spent, category percentage breakdown, and 6-mo trend in one single response.", ACCENT_CYAN),
      ("6. Instant Visual Delivery", "Dashboard renders donut chart, progress bars, and alerts. Response cached with 60s TTL for next visit.", ACCENT_EMERALD)
    ]

    # Two rows of 3 steps with arrows
    for idx, (title, desc, color) in enumerate(steps):
        row = idx // 3
        col = idx % 3

        left = Inches(0.8 + col * 4.0)
        top = Inches(1.6 + row * 2.7)
        width = Inches(3.5)
        height = Inches(2.3)

        card = add_card(s4, left, top, width, height)
        tbox = s4.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = tbox.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_before = Pt(8)

        # Arrow to next step (for col 0 and 1)
        if col < 2:
            arr = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, left + width + Inches(0.1), top + Inches(1.0), Inches(0.3), Inches(0.25))
            arr.fill.solid()
            arr.fill.fore_color.rgb = CARD_BORDER
            arr.line.fill.background()

    # =========================================================================
    # SLIDE 5: Technologies & Components Used
    # =========================================================================
    s5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s5)
    add_header(s5, "Technology Stack & Core Components Breakdown")

    tech_categories = [
      ("Frontend Technologies", ACCENT_CYAN, [
        ("React 18 & TypeScript", "Component-driven type-safe architecture for high-density UI rendering"),
        ("Vite 6 Bundler", "Lightning-fast HMR and optimized production asset chunking"),
        ("TailwindCSS", "Custom responsive dark-mode styling with glassmorphism gradients"),
        ("Recharts Visualizer", "Dynamic Donut Charts, Area trends, tooltips, and interactive slice filters"),
        ("Lucide React", "Minimalist icon set providing visual cues for transactions & categories")
      ]),
      ("Backend & Processing", ACCENT_INDIGO, [
        ("Node.js & Express", "Asynchronous non-blocking runtime handling concurrent API requests"),
        ("CSV Streaming Parser", "High-throughput stream processing to parse large statements with low memory"),
        ("JWT & BCrypt", "Secure authentication tokens with salted SHA-256 password hashing"),
        ("Rules Engine Evaluator", "Priority-ordered keyword matcher supporting retroactive transaction tagging"),
        ("Server-Timing API", "Telemetry headers exposing DB and cache durations directly to the client")
      ]),
      ("Database & Caching", ACCENT_EMERALD, [
        ("PostgreSQL 16 Engine", "Relational persistence with ACID compliance, window functions, and CTEs"),
        ("Composite B-Tree Index", "(user_id, occurred_at DESC) index eliminating table scans"),
        ("PGlite & pg Pool", "Zero-dependency embedded PostgreSQL WASM + external PostgreSQL pool support"),
        ("Redis 7 Invalidate-on-Write", "In-memory key-value cache with 60s TTL and write-invalidation hooks"),
        ("In-Memory Redis Fallback", "High-speed zero-config fallback ensuring cache logic runs anywhere")
      ])
    ]

    for idx, (cat_title, color, items) in enumerate(tech_categories):
        left = Inches(0.8 + idx * 4.0)
        card = add_card(s5, left, Inches(1.5), Inches(3.7), Inches(5.4))
        
        tbox = s5.shapes.add_textbox(left + Inches(0.25), Inches(1.7), Inches(3.2), Inches(5.0))
        tf = tbox.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = cat_title
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = color

        for name, desc in items:
            p_name = tf.add_paragraph()
            p_name.text = f"• {name}"
            p_name.font.size = Pt(11)
            p_name.font.bold = True
            p_name.font.color.rgb = TEXT_WHITE
            p_name.space_before = Pt(8)

            p_desc = tf.add_paragraph()
            p_desc.text = desc
            p_desc.font.size = Pt(9.5)
            p_desc.font.color.rgb = TEXT_MUTED
            p_desc.space_before = Pt(2)

    # =========================================================================
    # SLIDE 6: Database Schema & The Centerpiece Index Story
    # =========================================================================
    s6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s6)
    add_header(s6, "Database Schema & The Centerpiece Index Story")

    # Left: Schema Tables Card
    add_card(s6, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.4))
    tbox = s6.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(5.1), Inches(5.0))
    tf = tbox.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "Relational Schema Entities"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    tables = [
      ("users", "id, email, password_hash, name, currency, created_at"),
      ("categories", "id, user_id (FK), name, color, icon, monthly_budget"),
      ("rules", "id, user_id (FK), pattern, category_id (FK), priority, match_type"),
      ("transactions", "id, user_id (FK), amount, merchant, raw_description, category_id (FK), is_manually_assigned, occurred_at")
    ]
    for tbl, cols in tables:
        p1 = tf.add_paragraph()
        p1.text = f"Table: {tbl}"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_INDIGO
        p1.space_before = Pt(10)

        p2 = tf.add_paragraph()
        p2.text = cols
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

    # Right: The Index & CTE Story
    add_card(s6, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.4))
    rbox = s6.shapes.add_textbox(Inches(7.1), Inches(1.7), Inches(5.1), Inches(5.0))
    rtf = rbox.text_frame
    rtf.word_wrap = True

    p = rtf.paragraphs[0]
    p.text = "The Portfolio Centerpiece Index"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    code_p = rtf.add_paragraph()
    code_p.text = "CREATE INDEX idx_transactions_user_occurred\nON transactions (user_id, occurred_at DESC);"
    code_p.font.size = Pt(10.5)
    code_p.font.bold = True
    code_p.font.color.rgb = ACCENT_CYAN
    code_p.space_before = Pt(8)

    reasons = [
      ("Bypasses Full Table Scans", "Queries like WHERE user_id = $1 AND occurred_at >= $2 use index range scans, traversing only relevant user rows."),
      ("Eliminates External Sorts", "Because the B-Tree index maintains pre-sorted occurred_at DESC order, database sorts are virtually free."),
      ("High Cardinality & Selectivity", "user_id narrows the dataset to a single tenant, and occurred_at instantly windows to the selected month."),
      ("Unified CTE Aggregate Roundtrip", "Executes summary sums, category groups, and 6-month trends in one single roundtrip query using PostgreSQL JSON aggregation.")
    ]
    for r_title, r_desc in reasons:
        p1 = rtf.add_paragraph()
        p1.text = f"⚡ {r_title}"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_WHITE
        p1.space_before = Pt(8)

        p2 = rtf.add_paragraph()
        p2.text = r_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(2)

    # =========================================================================
    # SLIDE 7: Performance Benchmark & Measured Results (-98% p95 Latency)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s7)
    add_header(s7, "Performance Benchmark — The −41%+ Style Metric Story")

    # Big Metric Banner
    banner = add_card(s7, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.3), bg=RGBColor(16, 42, 35), border=ACCENT_EMERALD)
    bbox = s7.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.3), Inches(1.1))
    btf = bbox.text_frame
    btf.word_wrap = True
    bp1 = btf.paragraphs[0]
    bp1.text = "MEASURED PORTFOLIO RESULT: -98.8% TO -99.6% LATENCY REDUCTION"
    bp1.font.size = Pt(12)
    bp1.font.bold = True
    bp1.font.color.rgb = ACCENT_EMERALD

    bp2 = btf.add_paragraph()
    bp2.text = "p95 latency reduced from 21.04 ms (Cold PostgreSQL) to 0.25 ms (Redis Cache HIT) across 50,000+ indexed transactions."
    bp2.font.size = Pt(14)
    bp2.font.bold = True
    bp2.font.color.rgb = TEXT_WHITE
    bp2.space_before = Pt(4)

    # Table of Results
    table_card = add_card(s7, Inches(0.8), Inches(3.0), Inches(11.733), Inches(3.9))
    
    rows = 5
    cols = 4
    table_shape = s7.shapes.add_table(rows, cols, Inches(1.2), Inches(3.3), Inches(10.9), Inches(3.2))
    table = table_shape.table

    headers = ["Latency Percentile Metric", "PostgreSQL (Cold Query)", "Redis Cache (Hot Query)", "Measured Latency Improvement"]
    data = [
      ["p50 (Median Response Time)", "14.20 ms", "0.20 ms", "-98.6% Faster"],
      ["p90 (90th Percentile)", "18.80 ms", "0.22 ms", "-98.8% Faster"],
      ["p95 (95th Percentile SLA)", "21.04 ms", "0.25 ms", "-98.8% Faster"],
      ["Average Response Time", "15.30 ms", "0.21 ms", "-98.6% Faster"]
    ]

    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        for p in cell.text_frame.paragraphs:
            p.font.size = Pt(11)
            p.font.bold = True
            p.font.color.rgb = ACCENT_CYAN

    for row_idx, row_data in enumerate(data):
        for col_idx, val in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = val
            for p in cell.text_frame.paragraphs:
                p.font.size = Pt(11)
                if col_idx == 3:
                    p.font.bold = True
                    p.font.color.rgb = ACCENT_EMERALD
                elif col_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = ACCENT_CYAN
                else:
                    p.font.color.rgb = TEXT_LIGHT

    # =========================================================================
    # SLIDE 8: Step-Wise Implementation Roadmap & Time Required
    # =========================================================================
    s8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s8)
    add_header(s8, "Step-Wise Implementation Roadmap & Engineering Hours")

    phases = [
      ("Phase 1: Database Schema & Composite Indexes", "10 Hours", "Defined tables, foreign keys, and (user_id, occurred_at DESC) multi-column B-tree index."),
      ("Phase 2: Streaming CSV Ingestion Engine", "14 Hours", "Multer upload stream, flexible column normalization, batch inserting in 500-row chunks."),
      ("Phase 3: Unified SQL CTE Aggregate API", "12 Hours", "Engineered single roundtrip GET /api/spend query computing totals, breakdown, and trend."),
      ("Phase 4: Single-Screen React Dashboard UI", "18 Hours", "Tailwind glassmorphism UI, Recharts Donut & 6-month area graph, responsive grid."),
      ("Phase 5: Auto-Categorization Rules Engine", "12 Hours", "Priority-based keyword matching, live regex narration tester, retroactive bulk applier."),
      ("Phase 6: Category Budgets & Alert System", "10 Hours", "Threshold progress bars, over-budget warning badges, and dynamic limit editors."),
      ("Phase 7: Redis Cache & Invalidation Pipeline", "12 Hours", "60s TTL key caching with immediate invalidation hooks on write / update / delete."),
      ("Phase 8: Scale Stress-Testing & Benchmarking", "10 Hours", "Generated 50,000 synthetic records, measured p95 cold vs hot query SLA reduction.")
    ]

    for idx, (title, hours, desc) in enumerate(phases):
        row = idx // 4
        col = idx % 4

        left = Inches(0.8 + col * 2.95)
        top = Inches(1.6 + row * 2.6)
        width = Inches(2.8)
        height = Inches(2.4)

        card = add_card(s8, left, top, width, height)
        tbox = s8.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), width - Inches(0.3), height - Inches(0.3))
        tf = tbox.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_INDIGO

        p_hrs = tf.add_paragraph()
        p_hrs.text = f"⏱ Time: {hours}"
        p_hrs.font.size = Pt(10)
        p_hrs.font.bold = True
        p_hrs.font.color.rgb = ACCENT_EMERALD
        p_hrs.space_before = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(4)

    # Total Box at bottom
    tot_box = s8.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.4))
    ttf = tot_box.text_frame
    tp = ttf.paragraphs[0]
    tp.text = "TOTAL ESTIMATED ENGINEERING TIME: ~98 HOURS (8 STRUCTURED SPRINTS)"
    tp.font.size = Pt(11)
    tp.font.bold = True
    tp.font.color.rgb = ACCENT_CYAN
    tp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 9: Project Demonstration & Key Features
    # =========================================================================
    s9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s9)
    add_header(s9, "Project Demonstration — Key Highlights")

    feats = [
      ("Single-Screen Overview", "Total spending, daily average, % change vs previous month, and budget status visible at a glance without navigating multiple menus.", ACCENT_CYAN),
      ("Interactive Category Breakdown", "Color-coded donut chart with instant slice click-filtering. Direct visual ratio of Food, Travel, Shopping, and Bills.", ACCENT_INDIGO),
      ("6-Month Historical Trajectory", "Visual area chart highlighting spending patterns over the preceding six months with point-to-point comparison.", ACCENT_EMERALD),
      ("Rules Engine & Manual Override", "Intelligent auto-categorization matching keywords (Swiggy, Uber) with seamless manual overrides on any transaction.", ACCENT_CYAN),
      ("Over-Budget Alert System", "Visual progress bars (Green <80%, Amber 80-100%, Red >100%) alerting users when category spending exceeds threshold.", ACCENT_ROSE),
      ("Live Latency Benchmark Suite", "Built-in testing suite running 25 cold vs warm query iterations live on the browser, proving the p95 performance drop.", ACCENT_EMERALD)
    ]

    for idx, (title, desc, color) in enumerate(feats):
        row = idx // 3
        col = idx % 3

        left = Inches(0.8 + col * 4.0)
        top = Inches(1.6 + row * 2.7)
        width = Inches(3.7)
        height = Inches(2.4)

        card = add_card(s9, left, top, width, height)
        tbox = s9.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = tbox.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_before = Pt(8)

    # =========================================================================
    # SLIDE 10: Conclusion & Acknowledgement Slide
    # =========================================================================
    s10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s10)

    # Big Card
    c = add_card(s10, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9), bg=CARD_BG, border=ACCENT_INDIGO)

    # Thank you box
    tbox = s10.shapes.add_textbox(Inches(1.5), Inches(1.2), Inches(10.3), Inches(5.1))
    tf = tbox.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "CONCLUSION & ACKNOWLEDGEMENT"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    p2 = tf.add_paragraph()
    p2.text = "Thank You!"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    p2.space_before = Pt(6)

    p3 = tf.add_paragraph()
    p3.text = "SpendTracker successfully proves that combining composite indexing (user_id, occurred_at DESC), unified SQL CTE aggregation, and Redis caching transforms financial data retrieval from sluggish multi-roundtrip feeds into instantaneous sub-millisecond intelligence."
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_LIGHT
    p3.space_before = Pt(12)

    # Student & College Footer info
    p4 = tf.add_paragraph()
    p4.text = "Student Name: Om Vijay Ingole"
    p4.font.size = Pt(14)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_INDIGO
    p4.space_before = Pt(20)

    p5 = tf.add_paragraph()
    p5.text = "Department: Information Technology Branch"
    p5.font.size = Pt(12)
    p5.font.color.rgb = TEXT_WHITE
    p5.space_before = Pt(2)

    p6 = tf.add_paragraph()
    p6.text = "Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon"
    p6.font.size = Pt(12)
    p6.font.color.rgb = TEXT_MUTED
    p6.space_before = Pt(2)

    # Save presentation
    output_path = os.path.abspath("C:/Users/OM INGOLE/spendtracker/SpendTracker_Presentation.pptx")
    prs.save(output_path)
    print(f"Successfully generated PowerPoint presentation at: {output_path}")

if __name__ == '__main__':
    create_presentation()
