from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter

wb = Workbook()

# ── Palette ───────────────────────────────────────────────────────────────────
ORANGE    = "F4511E"
DARK_BG   = "0D0D0D"
CARD_BG   = "1A1A1A"
HEADER_BG = "1F1F1F"
WHITE     = "FFFFFF"
MUTED     = "888888"
GREEN     = "16A34A"
LIGHT     = "CCCCCC"

USD  = '"$"#,##0.00'
USD0 = '"$"#,##0'
PCT  = '0.0%'
NUM0 = '#,##0'

def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def fnt(bold=False, color=WHITE, size=11, italic=False):
    return Font(bold=bold, color=color, size=size, italic=italic, name="Calibri")

def al(h="left"):
    return Alignment(horizontal=h, vertical="center", wrap_text=True)

def w(ws, row, col, value, bold=False, color=WHITE, bg=None, size=11,
      num_format=None, align="left", italic=False):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font = fnt(bold=bold, color=color, size=size, italic=italic)
    if bg:
        cell.fill = fill(bg)
    cell.alignment = al(align)
    if num_format:
        cell.number_format = num_format
    return cell

def dark_row(ws, row, ncols=8):
    ws.row_dimensions[row].height = 6
    for c in range(1, ncols+1):
        ws.cell(row, c).fill = fill(DARK_BG)

def set_widths(ws, widths):
    for i, width in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = width

def fill_dark(ws):
    for row in ws.iter_rows():
        for cell in row:
            if cell.fill.fgColor.rgb in ("00000000", "FFFFFFFF", "000000"):
                cell.fill = fill(DARK_BG)

# ─────────────────────────────────────────────────────────────────────────────
# TAB 1 — EXPLAINED
# ─────────────────────────────────────────────────────────────────────────────
ws_ex = wb.active
ws_ex.title = "Explained"
ws_ex.sheet_view.showGridLines = False
set_widths(ws_ex, [2, 110, 2])

def title_block(ws, row, text, sub):
    ws.row_dimensions[row].height = 44
    ws.merge_cells(start_row=row, start_column=2, end_row=row, end_column=2)
    c = ws.cell(row=row, column=2, value=text)
    c.font = Font(bold=True, color=WHITE, size=20, name="Calibri")
    c.fill = fill(ORANGE)
    c.alignment = al("left")
    row += 1
    ws.row_dimensions[row].height = 22
    c2 = ws.cell(row=row, column=2, value=sub)
    c2.font = fnt(italic=True, color=MUTED, size=10)
    c2.fill = fill(DARK_BG)
    return row + 1

def ex_gap(ws, row, height=10):
    ws.row_dimensions[row].height = height
    ws.cell(row, 1).fill = fill(DARK_BG)
    ws.cell(row, 2).fill = fill(DARK_BG)
    ws.cell(row, 3).fill = fill(DARK_BG)
    return row + 1

def ex_heading(ws, row, text):
    ws.row_dimensions[row].height = 30
    c = ws.cell(row=row, column=2, value=text)
    c.font = Font(bold=True, color=ORANGE, size=13, name="Calibri")
    c.fill = fill(DARK_BG)
    c.alignment = al("left")
    ws.cell(row, 1).fill = fill(DARK_BG)
    ws.cell(row, 3).fill = fill(DARK_BG)
    return row + 1

def ex_subheading(ws, row, text):
    ws.row_dimensions[row].height = 26
    c = ws.cell(row=row, column=2, value=text)
    c.font = Font(bold=True, color=WHITE, size=12, name="Calibri")
    c.fill = fill(CARD_BG)
    c.alignment = al("left")
    ws.cell(row, 1).fill = fill(DARK_BG)
    ws.cell(row, 3).fill = fill(DARK_BG)
    return row + 1

def ex_para(ws, row, text, color=LIGHT, height=None):
    lines = text.count("\n") + 1
    h = height or max(18, lines * 16)
    ws.row_dimensions[row].height = h
    c = ws.cell(row=row, column=2, value=text)
    c.font = Font(color=color, size=11, name="Calibri")
    c.fill = fill(DARK_BG)
    c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws.cell(row, 1).fill = fill(DARK_BG)
    ws.cell(row, 3).fill = fill(DARK_BG)
    return row + 1

r = 1
r = title_block(ws_ex, r, "The Furnace — Pricing Model Explained",
                "A plain-language walkthrough of how we make money, what we charge, and why")
r = ex_gap(ws_ex, r, 16)

# ── Section 1 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "What This Business Actually Is")
r = ex_para(ws_ex, r,
    "The Furnace is not an ad agency. It's not a software subscription. It's an AI-powered growth operating system "
    "that runs the entire paid lead generation stack for service businesses — from the moment an ad goes live to the "
    "moment a qualified appointment lands on a sales rep's calendar.", height=42)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "Most agencies charge for time. We charge for the system. That distinction matters because a system gets cheaper "
    "and more accurate over time, while time stays expensive. The pricing model is built around that reality.", height=36)
r = ex_gap(ws_ex, r, 20)

# ── Section 2 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "Why We Have Three Revenue Layers")
r = ex_para(ws_ex, r,
    "Traditional agencies bundle everything into a retainer and hope the client doesn't ask too many questions. "
    "We don't do that. We price across three distinct layers because each one creates a different kind of value, "
    "and bundling them hides what we're actually delivering.", height=42)
r = ex_gap(ws_ex, r, 16)

r = ex_subheading(ws_ex, r, "Layer 1 — Onboarding Fee (one-time)")
r = ex_gap(ws_ex, r, 6)
r = ex_para(ws_ex, r,
    "This is charged once when a client signs. It covers the real work of standing up their system: connecting Google "
    "Ads and Meta, wiring their CRM, setting up the lead webhook, integrating Virtual Closer, generating the first "
    "batch of AI creatives, and configuring attribution so conversions feed back into the ad auctions correctly.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "This isn't busywork. A properly wired attribution setup — where booked appointments and closed revenue report "
    "back to Google and Meta — is worth tens of thousands of dollars in improved campaign performance over a client's "
    "lifetime. Most agencies never build this at all. We do it on day one.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "Pricing ranges from $997 for a Starter client to $4,997+ for Enterprise. It's deliberately set to cover our "
    "actual time cost on setup, not to be a profit center. The money is in what comes after.", height=36)
r = ex_gap(ws_ex, r, 16)

r = ex_subheading(ws_ex, r, "Layer 2 — Platform Fee (monthly, recurring)")
r = ex_gap(ws_ex, r, 6)
r = ex_para(ws_ex, r,
    "This is the core software subscription. Every client pays this every month, regardless of what their ads are "
    "doing. It covers access to the full AI engine: copy generation, creative production, campaign analysis, weekly "
    "performance reports, lead routing, real-time attribution, the admin portal, and the client dashboard.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "This is where the business model gets interesting. The actual cost to run the platform per client is between "
    "$8 and $15 per month in infrastructure and AI compute — even for clients doing aggressive creative testing. "
    "The platform fee starts at $997/month. That's not a typo. The gross margin on this layer alone is above 98%.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "The reason we can charge what we charge is not the software itself — it's the outcome the software produces. "
    "A client paying $997/month for a system that generates qualified appointments at a predictable cost doesn't "
    "think of it as software. They think of it as their pipeline. And pipelines don't get cancelled.", height=48)
r = ex_gap(ws_ex, r, 16)

r = ex_subheading(ws_ex, r, "Layer 3 — Spend Management Fee (percentage of ad spend)")
r = ex_gap(ws_ex, r, 6)
r = ex_para(ws_ex, r,
    "This is the performance layer that scales with the client's investment. We charge a percentage of whatever "
    "they're spending on Google and Meta each month. The rate starts at 10% for smaller clients and decreases as "
    "spend grows — 8% at Growth, 7% at Scale, 5% at Enterprise.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "This fee exists because active campaign management — bidding adjustments, negative keyword maintenance, audience "
    "refinement, budget pacing, creative rotation — creates real dollar value. A poorly managed $10,000/month Google "
    "Ads account wastes 20-30% of budget on bad traffic. A well-managed one doesn't. The fee pays for itself.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "Importantly, this fee scales with the client's success. If they're spending more, it means the campaigns are "
    "working and they're reinvesting. A client growing from $5K/month in ad spend to $25K/month increases our "
    "revenue from this layer by 5x without us adding a single hour of work. The AI does the optimization.", height=48)
r = ex_gap(ws_ex, r, 20)

# ── Section 3 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "How To Think About Client Tiers")
r = ex_gap(ws_ex, r, 6)

r = ex_para(ws_ex, r,
    "STARTER  ($997/mo platform + 10% of ad spend)\n"
    "Local service businesses spending $2K–$8K/month on ads. Roofing companies, personal injury attorneys, medspas. "
    "They usually have no real marketing infrastructure. Furnace becomes their entire system. On $5K/month in ad "
    "spend, total cost to the client is $1,497/month. For a business doing $20K+ per month in revenue from closed "
    "deals, this is an obvious yes if we're generating consistent leads.", height=72)
r = ex_gap(ws_ex, r, 10)

r = ex_para(ws_ex, r,
    "GROWTH  ($1,497/mo platform + 8% of ad spend)\n"
    "Established businesses or multi-location operators already spending on ads but not getting the results they "
    "should. They know what a qualified lead is worth. They're spending $8K–$25K/month. On $12K/month in spend, "
    "total monthly cost is around $2,457. For a business where a closed deal is worth $5,000–$50,000, "
    "this is not a hard conversation.", height=72)
r = ex_gap(ws_ex, r, 10)

r = ex_para(ws_ex, r,
    "SCALE  ($1,997/mo platform + 7% of ad spend)\n"
    "Aggressive growers who have found a working model and want to pour fuel on it. $25K–$75K/month in ad spend. "
    "At 7% management plus the platform fee, they're paying $3,747–$7,247/month. These clients typically have a "
    "full sales team working the leads. They need airtight attribution, fresh creative rotating automatically, "
    "and campaign analysis they can act on weekly. Furnace does all of that.", height=72)
r = ex_gap(ws_ex, r, 10)

r = ex_para(ws_ex, r,
    "ENTERPRISE  ($2,997/mo platform + 5% of ad spend)\n"
    "Clients spending $75K–$250K/month on paid media making serious commitments. At $100K/month in spend, "
    "that's $2,997 platform + $5,000 management = ~$8,000/month total. At this level we're their growth "
    "department, not their vendor. Contracts are typically annual.", height=72)
r = ex_gap(ws_ex, r, 10)

r = ex_para(ws_ex, r,
    "AGENCY WHITE-LABEL  ($499/seat, 10 seat minimum)\n"
    "An agency pays us per-seat to access the Furnace engine and run it under their own brand for their clients. "
    "They handle the client relationship. We power the backend. At $499/seat with a 10-seat minimum, that's "
    "$4,990/month minimum — and the agency charges their clients whatever they want on top. This is our "
    "highest-leverage tier because one sale creates multiple clients instantly.", height=72)
r = ex_gap(ws_ex, r, 20)

# ── Section 4 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "The Math That Makes This a Good Business")
r = ex_para(ws_ex, r,
    "At 20 clients — a mix of Starter, Growth, and Scale — you're looking at roughly $45,000–$65,000 per month "
    "in combined revenue across platform fees and spend management. The cost to run the platform for all 20 clients "
    "is under $200/month in infrastructure and AI compute. The actual overhead is your team's time, and the "
    "platform is designed to minimize exactly that.", height=54)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "At 50 clients, you're well above $150,000/month in revenue. Platform operating costs are under $400/month. "
    "You will spend money on people — account managers, a strategist, someone watching the systems — but the "
    "platform cost itself doesn't move meaningfully with client count.", height=48)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "This is what makes the business model structurally different from an agency. Traditional agencies have roughly "
    "linear cost structures: more clients means more hours means more people. Furnace has a near-flat cost structure "
    "on the software side. The AI does the creative work, the analysis, the reporting, and the attribution. "
    "You pay for humans to make judgment calls and build relationships, not to execute tasks the machine can do.", height=54)
r = ex_gap(ws_ex, r, 20)

# ── Section 5 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "What Makes Clients Stay")
r = ex_para(ws_ex, r,
    "Retention comes from one thing: consistent qualified appointments. If a client's pipeline is full, they "
    "don't cancel. If it's not, no amount of reporting or relationship management saves the account.", height=36)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "The attribution loop is the mechanism that makes this defensible over time. Every qualified lead, every "
    "booked appointment, every closed deal that gets reported back to Google and Meta through Enhanced Conversions "
    "and CAPI makes the bidding smarter. A client who has been on the platform for six months has auctions trained "
    "on their actual revenue outcomes — not just form fills. Their cost per qualified lead drops. Their close rate "
    "from paid traffic increases. Cancelling means giving all of that up and starting over somewhere else.", height=66)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "That's the moat. Not the software itself — the accumulated optimization data inside their specific campaigns "
    "that compounds over time and is impossible to transfer to a competitor.", height=36)
r = ex_gap(ws_ex, r, 20)

# ── Section 6 ─────────────────────────────────────────────────────────────────
r = ex_heading(ws_ex, r, "What This Is Not")
r = ex_para(ws_ex, r,
    "This is not a done-for-you agency where a team manually builds ads, writes copy, and generates reports "
    "every week. The AI handles all of that. The team's job is to configure the system correctly at the start, "
    "review and approve major changes, catch anything the AI flags for human judgment, and build the "
    "client relationship.", height=54)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "This is also not a performance marketing hedge fund where we eat cost-per-lead risk on our own balance "
    "sheet. We charge for the system that produces the leads, not for the leads themselves.", height=36)
r = ex_gap(ws_ex, r, 8)
r = ex_para(ws_ex, r,
    "The goal is to be the only company that owns the full stack — acquisition, creative, conversion, "
    "qualification, and attribution — in one system, for service businesses, at a price point that's obviously "
    "worth it relative to the pipeline it generates.", height=42)
r = ex_gap(ws_ex, r, 20)

fill_dark(ws_ex)
ws_ex.sheet_properties.tabColor = ORANGE

# ─────────────────────────────────────────────────────────────────────────────
# TAB 2 — BUSINESS MODEL
# ─────────────────────────────────────────────────────────────────────────────
ws1 = wb.create_sheet("Business Model")
ws1.sheet_view.showGridLines = False
ws1.freeze_panes = "A5"
set_widths(ws1, [32, 22, 22, 22, 22, 22, 22])

def title2(ws, text, sub):
    ws.row_dimensions[1].height = 40
    ws.merge_cells("A1:G1")
    c = ws["A1"]
    c.value = text
    c.font = Font(bold=True, color=WHITE, size=18, name="Calibri")
    c.fill = fill(ORANGE)
    c.alignment = al("center")
    ws.row_dimensions[2].height = 20
    ws.merge_cells("A2:G2")
    c2 = ws["A2"]
    c2.value = sub
    c2.font = fnt(italic=True, color=MUTED, size=10)
    c2.fill = fill(DARK_BG)
    c2.alignment = al("center")
    ws.row_dimensions[3].height = 8
    for col in range(1, 8): ws.cell(3, col).fill = fill(DARK_BG)

def sec_hdr(ws, row, text, ncols=7):
    ws.row_dimensions[row].height = 26
    w(ws, row, 1, f"  {text}", bold=True, color=ORANGE, bg=HEADER_BG, size=10)
    for c in range(2, ncols+1): ws.cell(row, c).fill = fill(HEADER_BG)

def col_hdrs(ws, row, headers, bgs=None):
    ws.row_dimensions[row].height = 32
    for i, h in enumerate(headers, 1):
        bg = (bgs[i-1] if bgs else HEADER_BG)
        w(ws, row, i, h, bold=True, color=WHITE, bg=bg, size=9, align="center")

title2(ws1, "THE FURNACE — BUSINESS MODEL & PRICING",
       "AI Growth Operating System · 5-Layer Lead Gen Stack · 3 Revenue Layers · No Performance Kicker")

r1 = 4
col_hdrs(ws1, r1, ["", "Starter", "Growth", "Scale", "Enterprise", "Agency White-Label", "Notes"],
         ["0D0D0D","1A2A1A","1A1A2A","2A1A0D","2A0D0D","1A1A2A","0D0D0D"])
r1 += 1

# Positioning
sec_hdr(ws1, r1, "POSITIONING"); r1 += 1
for label, a, b, c, d, e, note in [
    ("Target Client",  "5–25 leads/mo\nlocal service biz", "50–200 leads/mo\nmulti-location", "200+ leads/mo\naggressive growth", "High-spend\nmulti-vertical", "Agency reselling\nFurnace as SaaS", ""),
    ("Verticals",      "Home svcs, legal\ninsurance", "All 6 verticals", "All 6 verticals", "All 6 verticals", "Any vertical", "Home services / legal / elective health / real estate / insurance / local"),
    ("Ad Spend Range", "$2K–$8K/mo", "$8K–$25K/mo", "$25K–$75K/mo", "$75K–$250K/mo", "Managed by agency", "Client's own ad budget — not Furnace revenue"),
]:
    ws1.row_dimensions[r1].height = 44
    w(ws1, r1, 1, label, bold=True, bg=CARD_BG)
    for ci, val in enumerate([a, b, c, d, e], 2):
        w(ws1, r1, ci, val, color=LIGHT, bg=DARK_BG, align="center")
    w(ws1, r1, 7, note, color=MUTED, bg=DARK_BG, italic=True, size=9)
    r1 += 1

dark_row(ws1, r1); r1 += 1

# Pricing structure — 3 layers only
sec_hdr(ws1, r1, "PRICING STRUCTURE (3 revenue layers — no performance kicker)"); r1 += 1
ws1.row_dimensions[r1].height = 24
w(ws1, r1, 1, "Revenue Layer", bold=True, color=ORANGE, bg=HEADER_BG)
for ci, h in enumerate(["Starter","Growth","Scale","Enterprise","Agency WL","How It Works"], 2):
    w(ws1, r1, ci, h, bold=True, bg=HEADER_BG, align="center")
r1 += 1

for label, a, b, c, d, e, note in [
    ("Layer 1: Onboarding Fee\n(one-time setup)",
     "$997", "$1,997", "$2,997", "$4,997", "$9,997+",
     "Account connect, brand ingestion, tracking, GHL/VC wiring, first creative batch. Charged once at contract start."),
    ("Layer 2: Platform Fee\n(monthly, recurring)",
     "$997/mo", "$1,497/mo", "$1,997/mo", "$2,997/mo", "$499/seat/mo",
     "Core SaaS: AI copy gen, creative pipeline, lead routing, reporting, attribution engine, admin portal access."),
    ("Layer 3: Spend Management\n(% of ad spend, monthly)",
     "10% of spend", "8% of spend", "7% of spend", "5% of spend", "Agency sets own %",
     "Oversight and optimization of paid campaigns on Google + Meta. Rate decreases at scale."),
]:
    ws1.row_dimensions[r1].height = 48
    w(ws1, r1, 1, label, bold=True, bg=CARD_BG)
    for ci, val in enumerate([a, b, c, d, e], 2):
        w(ws1, r1, ci, val, bold=True, color=GREEN, bg=DARK_BG, align="center")
    w(ws1, r1, 7, note, color=MUTED, bg=DARK_BG, italic=True, size=9)
    r1 += 1

dark_row(ws1, r1); r1 += 1

# Example client math — no kicker
sec_hdr(ws1, r1, "EXAMPLE CLIENT REVENUE (monthly, after onboarding — platform fee + spend mgmt only)"); r1 += 1
ws1.row_dimensions[r1].height = 24
w(ws1, r1, 1, "Revenue Component", bold=True, color=ORANGE, bg=HEADER_BG)
for ci, h in enumerate(["Starter\n$5K spend","Growth\n$12K spend","Scale\n$30K spend","Enterprise\n$80K spend","Agency WL\n10 seats",""], 2):
    w(ws1, r1, ci, h, bold=True, bg=HEADER_BG, align="center")
r1 += 1

ex_rows = [
    ("Platform Fee",               997,  1497,  1997,  2997, 4990, "Fixed monthly"),
    ("Spend Management (% ad $)",  500,   960,  2100,  4000,    0, "10% / 8% / 7% / 5% applied to client spend"),
    ("TOTAL MONTHLY REVENUE",     1497,  2457,  4097,  6997, 4990, "Per client"),
    ("× Clients at this tier",       5,    20,    50,   100,   10, "Scenario assumption"),
    ("TIER MRR",                  7485, 49140,204850,699700,49900, ""),
]
for label, a, b, c, d, e, note in ex_rows:
    is_total = "TOTAL" in label or "MRR" in label
    ws1.row_dimensions[r1].height = 28
    w(ws1, r1, 1, label, bold=is_total, color=GREEN if is_total else WHITE,
      bg="0D2A0D" if is_total else CARD_BG)
    for ci, val in enumerate([a, b, c, d, e], 2):
        w(ws1, r1, ci, val, bold=is_total, color=GREEN if is_total else WHITE,
          bg="0D1A0D" if is_total else DARK_BG, num_format=USD0, align="center")
    w(ws1, r1, 7, note, color=MUTED, bg=DARK_BG, italic=True, size=9)
    r1 += 1

dark_row(ws1, r1); r1 += 1

# 5 layers
sec_hdr(ws1, r1, "THE 5-LAYER STACK (what Furnace covers)"); r1 += 1
for layer, what, how in [
    ("Layer 1: Acquisition",    "Google Ads + Meta programmatic campaigns. AI-controlled budget pacing, bidding signals, negative keyword management.", "Google Ads API + Meta Marketing API. Real-time sync via cron."),
    ("Layer 2: Creative",       "AI copy generation (Claude Sonnet), photorealistic backgrounds (fal.ai Flux Pro), composited ad creatives (Placid). A/B variant pipeline.", "Autonomous — runs without human input. Human approves before live."),
    ("Layer 3: Conversion",     "Lead form routing. Webhook ingestion from any source. Deduplication, validation, instant routing to VC + CRM.", "/api/leads webhook. Supports GHL, VC, raw POST."),
    ("Layer 4: Qualification",  "Virtual Closer AI voice + SMS SDR. 24/7 qualification, objection handling, calendar booking. VC owns this layer.", "VC ↔ Furnace: bi-directional webhook. Dispositions sync for attribution."),
    ("Layer 5: Attribution",    "Google Enhanced Conversions + Meta CAPI. Qualified leads + booked appts + closed revenue feed back into auction bidding.", "Fires on every lead status change. Zero manual steps. Reduces CPL over time."),
]:
    ws1.row_dimensions[r1].height = 48
    w(ws1, r1, 1, layer, bold=True, color=ORANGE, bg=CARD_BG)
    ws1.merge_cells(start_row=r1, start_column=2, end_row=r1, end_column=4)
    w(ws1, r1, 2, what, color=LIGHT, bg=DARK_BG)
    ws1.merge_cells(start_row=r1, start_column=5, end_row=r1, end_column=7)
    w(ws1, r1, 5, how, color=MUTED, bg=DARK_BG, italic=True, size=9)
    r1 += 1

fill_dark(ws1)
ws1.sheet_properties.tabColor = "3B82F6"

# ─────────────────────────────────────────────────────────────────────────────
# TAB 3 — OPERATING COSTS
# ─────────────────────────────────────────────────────────────────────────────
ws2 = wb.create_sheet("Operating Costs")
ws2.sheet_view.showGridLines = False
set_widths(ws2, [34, 20, 20, 20, 20, 20, 24])

title2(ws2, "THE FURNACE — PLATFORM OPERATING COSTS",
       "Excludes ad spend · All costs are Furnace platform infrastructure · No performance kicker included")

def ws_row(ws, row, label, vals, note="", bold=False, color=WHITE, num_fmt=USD):
    ws.row_dimensions[row].height = 22
    lbl_bg = "0D2A0D" if bold else CARD_BG
    row_bg = "0D1A0D" if bold else DARK_BG
    w(ws, row, 1, label, bold=bold, color=GREEN if bold else color, bg=lbl_bg)
    for ci, v in enumerate(vals, 2):
        w(ws, row, ci, v, bold=bold, color=GREEN if bold else WHITE,
          bg=row_bg, num_format=num_fmt, align="center")
    w(ws, row, 7, note, color=MUTED, bg=DARK_BG, italic=True, size=9)

r2 = 4
ws2.row_dimensions[r2].height = 48
sc_hdrs = ["","A: Launch\n5 clients\n$3K avg spend","B: Growth\n20 clients\n$6K avg spend",
           "C: Scale\n50 clients\n$12K avg spend","D: Enterprise\n100 clients\n$25K avg spend",
           "E: Dominant\n200 clients\n$50K avg spend","Notes"]
sc_bgs  = [DARK_BG,"1A2A1A","1A1A2A","2A1A0D","2A0D0D","1A0D1A",DARK_BG]
for i,(s,bg) in enumerate(zip(sc_hdrs,sc_bgs),1):
    w(ws2,r2,i,s,bold=True,bg=bg,size=9,align="center")
r2 += 1

def ws2_sec(row, title):
    ws2.row_dimensions[row].height = 24
    for c in range(1,8): ws2.cell(row,c).fill = fill(HEADER_BG)
    w(ws2,row,1,f"  {title}",bold=True,color=ORANGE,bg=HEADER_BG,size=10)

ws2_sec(r2,"ACTIVITY ASSUMPTIONS (per client per month)"); r2+=1
ws_row(ws2,r2,"Copy gen runs / client",[4,8,8,12,16],"New ad variant batches",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"Images generated / run",[3,6,6,6,6],"fal.ai + Placid per run",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"Total images / client / month",[12,48,48,72,96],"",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"Campaign analysis runs / client",[4,4,4,8,8],"Weekly AI perf review",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"Weekly reports / client",[4,4,4,4,4],"",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"TOTAL images / month (all clients)",[60,960,2400,7200,19200],"",bold=True,num_fmt=NUM0); r2+=1
dark_row(ws2,r2); r2+=1

ws2_sec(r2,"ANTHROPIC / CLAUDE API  ·  Sonnet 4.6: $3/MTok in · $15/MTok out  |  Haiku 4.5: $0.80/MTok in · $4/MTok out"); r2+=1
ws_row(ws2,r2,"Copy gen (Sonnet, ~$0.011/run)",[0.23,1.82,4.56,13.68,36.48],"800 tok in / 600 tok out per run"); r2+=1
ws_row(ws2,r2,"Campaign analysis (Sonnet, ~$0.018/run)",[0.36,1.44,3.60,14.40,28.80],"2000 tok in / 800 tok out per run"); r2+=1
ws_row(ws2,r2,"Weekly reports (Haiku, ~$0.003/run)",[0.06,0.21,0.52,1.04,2.08],"1200 tok in / 400 tok out per run"); r2+=1
ws_row(ws2,r2,"TOTAL CLAUDE / MONTH",[0.65,3.47,8.68,29.12,67.36],"Essentially free at all scales",bold=True); r2+=1
dark_row(ws2,r2); r2+=1

ws2_sec(r2,"FAL.AI IMAGE GENERATION  ·  Flux Pro v1.1  ·  ~$0.05 Meta (1:1)  ·  ~$0.08 Google (16:9)"); r2+=1
ws_row(ws2,r2,"Total images / month",[60,960,2400,7200,19200],"",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"fal.ai cost / month",[3.90,62.40,156.00,468.00,1248.00],"Only gen on approved copy to reduce cost"); r2+=1
ws_row(ws2,r2,"FAL.AI TOTAL / MONTH",[3.90,62.40,156.00,468.00,1248.00],"~54% of total cost at 200 clients",bold=True); r2+=1
dark_row(ws2,r2); r2+=1

ws2_sec(r2,"PLACID CREATIVE COMPOSITING  ·  Composites fal.ai background + AI copy into polished ads"); r2+=1
ws_row(ws2,r2,"Plan cost / month",[19.00,49.00,99.00,199.00,350.00],"Starter→Growth→Scale→Business→Custom"); r2+=1
ws_row(ws2,r2,"Images in plan",[500,2000,5000,10000,25000],"All scenarios within plan limits",num_fmt=NUM0); r2+=1
ws_row(ws2,r2,"PLACID TOTAL / MONTH",[19.00,49.00,99.00,199.00,350.00],"Negotiate custom above 5K images/mo",bold=True); r2+=1
dark_row(ws2,r2); r2+=1

ws2_sec(r2,"INFRASTRUCTURE"); r2+=1
ws_row(ws2,r2,"Vercel (hosting + cron + functions)",[20,20,20,99,99],"Pro → Team at 100+ clients"); r2+=1
ws_row(ws2,r2,"Supabase (DB + auth + storage)",[25,25,25,75,599],"Pro → extra compute → Team at scale"); r2+=1
ws_row(ws2,r2,"Domain / SSL",[2,2,2,2,2],"furnaceleads.com"); r2+=1
ws_row(ws2,r2,"INFRASTRUCTURE TOTAL / MONTH",[47,47,47,176,700],"Near-flat until 100+ clients",bold=True); r2+=1
dark_row(ws2,r2); r2+=1

ws2_sec(r2,"ZERO MARGINAL COST (free at all scales)"); r2+=1
for label, note in [
    ("Google Ads API (metrics sync + Enhanced Conversions)","Google charges nothing for API access"),
    ("Meta Marketing API (metrics + CAPI attribution)","Meta charges nothing for API access"),
    ("GoHighLevel webhook delivery","GHL doesn't charge per webhook"),
    ("Virtual Closer / RevRing lead routing","Handled by your own VC infrastructure"),
    ("Attribution events (per lead status change)","Google EC + Meta CAPI = free regardless of volume"),
    ("Inbound lead webhook processing","Covered by Vercel function allowance"),
]:
    ws2.row_dimensions[r2].height = 20
    w(ws2,r2,1,label,color="AAAAAA",bg=DARK_BG)
    ws2.merge_cells(start_row=r2,start_column=2,end_row=r2,end_column=6)
    w(ws2,r2,2,"$0",bold=True,color=GREEN,bg=DARK_BG,align="center")
    w(ws2,r2,7,note,color=MUTED,bg=DARK_BG,italic=True,size=9)
    r2+=1
dark_row(ws2,r2); r2+=1

# Totals
totals = [0.65+3.90+19+47, 3.47+62.40+49+47, 8.68+156+99+47, 29.12+468+199+176, 67.36+1248+350+700]
ws2_sec(r2,"TOTAL PLATFORM COST SUMMARY"); r2+=1
ws2.row_dimensions[r2].height = 24
w(ws2,r2,1,"Cost Category",bold=True,color=ORANGE,bg=HEADER_BG)
for ci,h in enumerate(["A: Launch","B: Growth","C: Scale","D: Enterprise","E: Dominant",""],2):
    w(ws2,r2,ci,h,bold=True,bg=HEADER_BG,align="center")
r2+=1
for label, vals in [
    ("Claude API",[0.65,3.47,8.68,29.12,67.36]),
    ("fal.ai (images)",[3.90,62.40,156.00,468.00,1248.00]),
    ("Placid (compositing)",[19.00,49.00,99.00,199.00,350.00]),
    ("Infrastructure",[47,47,47,176,700]),
]:
    ws_row(ws2,r2,label,vals); r2+=1
ws_row(ws2,r2,"TOTAL MONTHLY OPERATING COST",[round(t,2) for t in totals],"",bold=True); r2+=1
dark_row(ws2,r2); r2+=1

# Unit economics
ws2_sec(r2,"UNIT ECONOMICS & MARGINS"); r2+=1
ws2.row_dimensions[r2].height = 24
w(ws2,r2,1,"Metric",bold=True,color=ORANGE,bg=HEADER_BG)
for ci,h in enumerate(["A: Launch","B: Growth","C: Scale","D: Enterprise","E: Dominant",""],2):
    w(ws2,r2,ci,h,bold=True,bg=HEADER_BG,align="center")
r2+=1
counts     = [5,20,50,100,200]
plat_fees  = [997,1497,1997,2997,3997]
ad_spends  = [15000,120000,600000,2500000,10000000]
spend_pcts = [0.10,0.08,0.07,0.05,0.04]
plat_mrrs  = [f*c for f,c in zip(plat_fees,counts)]
spend_fees = [s*p*c for s,p,c in zip(ad_spends,spend_pcts,counts)]
total_revs = [p+s for p,s in zip(plat_mrrs,spend_fees)]
gross_ps   = [r-t for r,t in zip(total_revs,totals)]
margins    = [g/r for g,r in zip(gross_ps,total_revs)]
cpc        = [round(t/c,2) for t,c in zip(totals,counts)]
for label, vals, nf, note in [
    ("Active Clients",counts,NUM0,""),
    ("Total Ad Spend Managed",ad_spends,USD0,"Client's media budget — not Furnace revenue"),
    ("Platform Fee / Client / Month",plat_fees,USD0,"Layer 2 only"),
    ("Spend Management Revenue",spend_fees,USD0,"% of ad spend × all clients"),
    ("Total Monthly Revenue (both layers)",total_revs,USD0,"Platform fees + spend management"),
    ("Total Platform Operating Cost",[round(t,2) for t in totals],USD,""),
    ("Cost Per Client / Month",cpc,USD,"Very low — AI is cheap"),
    ("Gross Profit",gross_ps,USD0,"Revenue minus all operating costs"),
    ("Gross Margin",margins,PCT,""),
]:
    is_gp = "Gross" in label
    ws2.row_dimensions[r2].height = 22
    w(ws2,r2,1,label,bold=is_gp,color=GREEN if is_gp else WHITE,bg="0D2A0D" if is_gp else CARD_BG)
    for ci,v in enumerate(vals,2):
        w(ws2,r2,ci,v,bold=is_gp,color=GREEN if is_gp else WHITE,
          bg="0D1A0D" if is_gp else DARK_BG,num_format=nf,align="center")
    w(ws2,r2,7,note,color=MUTED,bg=DARK_BG,italic=True,size=9)
    r2+=1

fill_dark(ws2)
ws2.sheet_properties.tabColor = GREEN

# ─────────────────────────────────────────────────────────────────────────────
# TAB 4 — REVENUE SCENARIOS (no kicker)
# ─────────────────────────────────────────────────────────────────────────────
ws3 = wb.create_sheet("Revenue Scenarios")
ws3.sheet_view.showGridLines = False
set_widths(ws3, [30,18,18,18,18,18,22])

title2(ws3,"REVENUE SCENARIOS — MIX OF TIERS",
       "All figures are MONTHLY (MRR) at that point in time · ARR = MRR × 12 · Platform fee + spend mgmt only · No performance kicker")

r3 = 4
# Tier reference
ws3.row_dimensions[r3].height = 26
w(ws3,r3,1,"TIER REFERENCE",bold=True,color=ORANGE,bg=HEADER_BG)
for ci,h in enumerate(["Starter","Growth","Scale","Enterprise","Agency WL",""],2):
    w(ws3,r3,ci,h,bold=True,bg=HEADER_BG,align="center")
r3+=1
for label,vals,note in [
    ("Onboarding (one-time)",[997,1997,2997,4997,9997],"Recognized in month 1"),
    ("Platform Fee (monthly)",[997,1497,1997,2997,499],"Per client (Agency = per seat)"),
    ("Spend Mgmt (% ad spend)",["10%","8%","7%","5%","Agency sets"],"Applied to client media budget"),
]:
    ws3.row_dimensions[r3].height = 22
    w(ws3,r3,1,label,color=WHITE,bg=CARD_BG)
    for ci,v in enumerate(vals,2):
        w(ws3,r3,ci,v,color=LIGHT,bg=DARK_BG,align="center",
          num_format=USD0 if isinstance(v,(int,float)) else "@")
    w(ws3,r3,7,note,color=MUTED,bg=DARK_BG,italic=True,size=9)
    r3+=1
dark_row(ws3,r3); r3+=1

scenarios = [
    {
        "name":"Scenario 1 — Early Traction (Year 1 end)",
        "tiers":[
            ("Starter ($3K/mo ad spend)",  997, 3000, 0.10),
            ("Growth ($8K/mo ad spend)",  1497, 8000, 0.08),
            ("Scale ($20K/mo ad spend)",  1997,20000, 0.07),
            ("Enterprise ($50K/mo)",      2997,50000, 0.05),
            ("Agency (10 seats)",         4990,    0, 0.00),
        ],
        "counts":[8,4,2,0,0],
    },
    {
        "name":"Scenario 2 — Solid Growth (Year 2)",
        "tiers":[
            ("Starter ($3K/mo ad spend)",  997, 3000, 0.10),
            ("Growth ($10K/mo ad spend)", 1497,10000, 0.08),
            ("Scale ($25K/mo ad spend)",  1997,25000, 0.07),
            ("Enterprise ($60K/mo)",      2997,60000, 0.05),
            ("Agency (10 seats)",         4990,    0, 0.00),
        ],
        "counts":[10,15,8,3,1],
    },
    {
        "name":"Scenario 3 — Scale Mode (Year 3)",
        "tiers":[
            ("Starter ($5K/mo ad spend)",  997, 5000, 0.10),
            ("Growth ($12K/mo ad spend)", 1497,12000, 0.08),
            ("Scale ($30K/mo ad spend)",  1997,30000, 0.07),
            ("Enterprise ($80K/mo)",      2997,80000, 0.05),
            ("Agency (20 seats)",         9980,    0, 0.00),
        ],
        "counts":[5,25,20,10,2],
    },
]

for sc in scenarios:
    ws3.row_dimensions[r3].height = 28
    w(ws3,r3,1,f"  {sc['name']}",bold=True,color=ORANGE,bg=HEADER_BG)
    for ci,h in enumerate(["# Clients","Platform\nFees /mo","Spend Mgmt\nFees /mo","MRR\n(monthly)","ARR\n(× 12)",""],2):
        w(ws3,r3,ci,h,bold=True,bg=HEADER_BG,align="center")
    r3+=1

    tier_revs = []
    for (tier_label,plat,spend,pct),count in zip(sc["tiers"],sc["counts"]):
        plat_t  = plat*count
        spend_t = spend*count*pct
        total_t = plat_t+spend_t
        tier_revs.append(total_t)
        ws3.row_dimensions[r3].height = 22
        w(ws3,r3,1,f"  {tier_label}",color=LIGHT,bg=DARK_BG)
        w(ws3,r3,2,count,bg=DARK_BG,num_format=NUM0,align="center",color=WHITE)
        w(ws3,r3,3,plat_t,bg=DARK_BG,num_format=USD0,align="center",color=WHITE)
        w(ws3,r3,4,spend_t,bg=DARK_BG,num_format=USD0,align="center",color=WHITE)
        w(ws3,r3,5,total_t,bg=DARK_BG,num_format=USD0,align="center",color=WHITE)
        w(ws3,r3,6,total_t*12,bg=DARK_BG,num_format=USD0,align="center",color=MUTED)
        w(ws3,r3,7,"",bg=DARK_BG)
        r3+=1

    total_clients = sum(sc["counts"])
    total_mrr     = sum(tier_revs)
    total_arr     = total_mrr * 12
    ws3.row_dimensions[r3].height = 32
    w(ws3,r3,1,f"  TOTAL — {sc['name']}",bold=True,color=GREEN,bg="0D2A0D")
    w(ws3,r3,2,total_clients,bold=True,color=GREEN,bg="0D1A0D",num_format=NUM0,align="center")
    w(ws3,r3,3,"",bg="0D1A0D")
    w(ws3,r3,4,"",bg="0D1A0D")
    w(ws3,r3,5,total_mrr,bold=True,color=GREEN,bg="0D1A0D",num_format=USD0,align="center")
    w(ws3,r3,6,total_arr,bold=True,color=GREEN,bg="0D1A0D",num_format=USD0,align="center")
    w(ws3,r3,7,"← MRR / ARR (annualized run rate)",bg="0D1A0D",color=MUTED,italic=True,size=9)
    r3+=1
    dark_row(ws3,r3); r3+=1

fill_dark(ws3)
ws3.sheet_properties.tabColor = "EAB308"

wb.save("/Users/sakredbody22/thefurnace/furnace_model.xlsx")
print("Done — furnace_model.xlsx")
