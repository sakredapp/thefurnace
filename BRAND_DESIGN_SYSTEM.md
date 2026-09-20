# Furnace — Brand & Design System

> **Purpose:** A complete, copy-paste-ready brand and design spec for building the CRM UI so it matches the Furnace product family. Hand this whole file to another AI/designer/developer — every value is real and extracted from the live codebase, not invented.
>
> **TL;DR aesthetic:** Dark-first, fire-inspired, premium SaaS. Warm **fire-orange (`#F4511E`)** accent on near-black, warm-brown-tinted backgrounds. Marketing surfaces flip to a warm cream light theme. Heavy headline weights (800–900), wide tracking on labels. Clean, data-dense dashboards. Fonts: **Inter** (already in use — the CRM should reuse it).

---

## 1. Brand Identity

| Item | Value |
|------|-------|
| **Brand name** | Furnace |
| **Full title** | Furnace — AI Lead Generation Operating System |
| **Primary tagline** | "The More It Runs, The Cheaper Your Leads Get." |
| **Secondary tagline** | "Not just another lead vendor, or ad agency." |
| **Description** | An AI-powered lead acquisition engine for insurance agencies and service businesses. We launch campaigns, qualify leads, and feed revenue data back into the platforms. |
| **Contact email** | hello@furnaceleads.com |
| **Logo asset** | `/app/favicon.ico` (16/32px icon set). No SVG wordmark yet — wordmark is currently set in type (Inter, weight 900). |

**Voice:** Direct, confident, metrics-first. Talk in outcomes — "booked calls," "closed deals," "cost per qualified lead." Avoid fluff.

---

## 2. Color System

The product runs **two themes**: a **dark theme** (app / portal / client dashboard / CRM) and a **light theme** (public marketing pages). **The CRM should use the dark theme.**

### 2.1 Core / Accent

| Token | Hex | Use |
|-------|-----|-----|
| `--accent` (Primary / Fire Orange) | `#F4511E` | Primary buttons, links, active nav, badges, focus, key data highlights |
| `--accent-dark` (Hover) | `#C73A0A` | Hover/active state for primary buttons |
| Accent on light text | `#F4511E` | Inline links on light surfaces |

### 2.2 Dark Theme (use this for the CRM)

| Token | Hex | Use |
|-------|-----|-----|
| Body background | `#0d0d0d` | Root app background |
| Surface / panel background | `#0f0a07` | Dashboard & portal page background (warm near-black) |
| Sidebar background | `#1A0D06` | Left nav / sidebar (warmer black) |
| Card background | `rgba(255,255,255,0.03)` | KPI cards, data panels |
| Card background (raised) | `rgba(255,255,255,0.05)` | Hovered / elevated cards |
| Card border | `rgba(255,255,255,0.07)` → `rgba(255,255,255,0.09)` | Default card / divider borders |
| Input background | `rgba(255,255,255,0.07)` | Text fields on dark |
| Input border | `rgba(255,255,255,0.12)` | Field borders |

**Dark-theme text colors (white at opacity):**

| Role | Value |
|------|-------|
| Primary text | `rgba(255,255,255,0.85)` (and pure `#fff` for headings/values) |
| Secondary text | `rgba(255,255,255,0.65)` |
| Muted text | `rgba(255,255,255,0.35)`–`0.45` |
| Hairline / very muted | `rgba(255,255,255,0.05)`–`0.06` |

**Accent overlays on dark (for icon chips, alert tints, badges):**

| Use | Value |
|-----|-------|
| Icon chip background | `rgba(244,81,30,0.18)` |
| Accent border | `rgba(244,81,30,0.25)`–`0.30` |
| Alert/info background | `rgba(244,81,30,0.08)`–`0.12` |

### 2.3 Light Theme (marketing only — for reference)

| Token | Hex | Use |
|-------|-----|-----|
| Page background | `#FFF8F3` (warm cream) | Marketing page body |
| Outer wrapper / frame | `#1A0800` (dark brown) | Site shell border |
| Ink (text) | `#0f0f0f` | Body copy |
| Heading charcoal | `#2A1A0E` | Headlines |
| Muted text | `#3B1A08` / `#6B3820` | Secondary copy |
| Card tint | `#FFF0E5` (peach) | Feature cards |
| Paper | `#ffffff` | Form cards |

**Dark gradient band** (used in dark marketing sections / login):
`linear-gradient(135deg, #2A1A0E 0%, #111008 100%)`

### 2.4 Semantic / Status Colors (CRM status pills, charts)

| Status | Hex |
|--------|-----|
| Success / Closed Won | `#16a34a` |
| Contacted (info) | `#3b82f6` |
| Qualified (warning) | `#f59e0b` |
| Booked | `#8b5cf6` |
| Danger / Closed Lost | `#dc2626` |
| Paused (caution) | `#ca8a04` |
| Neutral / New / Unqualified | `#6b7280` |

**Status pill recipe:** text = `STATUS_COLOR`, background = `STATUS_COLOR` at ~8% alpha (`+"15"`), border = `STATUS_COLOR` at ~19% alpha (`+"30"`).

---

## 3. Typography & Fonts

> **The CRM reuses the existing font: Inter.** Do not introduce a new typeface.

### 3.1 Font Family

- **Primary:** `Inter` (Google Fonts), loaded via `next/font` as CSS variable `--font-inter`.
- **Fallback chain:** `Inter, system-ui, -apple-system, sans-serif`.
- **Load config:**
  ```ts
  const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    variable: "--font-inter",
    display: "swap",
  });
  ```

### 3.2 Font Weights

| Weight | Role |
|--------|------|
| 400 | Body / paragraph |
| 500 | Nav links, secondary labels |
| 600 | Emphasized body, dashboard values |
| 700 | Form labels, button text, table emphasis |
| 800 | Kickers, badges, section labels, table headers |
| 900 | Headlines, page titles, KPI numbers |

### 3.3 Type Scale (CRM / dashboard — use these)

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Page title (H1) | `1.4rem` | 900 | |
| KPI value (big number) | `1.75rem` | 900 | line-height 1 |
| Card value | `1.4rem` | 900 | line-height 1 |
| Card / KPI label | `0.72rem` | 800 | uppercase, wide tracking |
| Table header | `0.72rem` | 800 | uppercase |
| Table cell | `0.88rem`–`0.92rem` | 400 / 700 | |
| Body | `0.92rem`–`0.95rem` | 400 | line-height ~1.65 |
| Form label | `0.82rem` | 700 | tracking `0.06em`, often uppercase |
| Input text | `0.95rem` | 400 | |
| Status pill | `0.65rem`–`0.72rem` | 700 | uppercase |

**Marketing scale (reference, fluid):** H1 `clamp(2rem, 5vw, 2.8rem)` / 900; H2 `clamp(1.6rem, 3.8vw, 2.2rem)` / 900; body `1.05rem` / 400.

### 3.4 Letter-spacing

| Use | Value |
|-----|-------|
| Headings (H1/H2) | `-0.015em` to `-0.02em` (tight) |
| Labels / buttons | `0.06em` |
| Uppercase kickers / badges | `0.1em`–`0.22em` (wide) |

### 3.5 Font Colors (quick reference)

- **On dark surfaces (CRM):** headings `#fff`; body `rgba(255,255,255,0.85)`; secondary `rgba(255,255,255,0.65)`; muted `rgba(255,255,255,0.40)`. Links/active = `#F4511E`.
- **On light surfaces:** headings `#2A1A0E`; body `#0f0f0f`; muted `#3B1A08` / `#6B3820`. Links = `#F4511E`.

---

## 4. Radius, Spacing, Shadows

### 4.1 Border Radius

| Value | Use |
|-------|-----|
| `4px` / `6px` | Status pills, small chips/buttons |
| `8px` | Buttons, inputs, icon containers |
| `12px` | Dashboard cards (primary CRM card radius) |
| `14px` | Feature / integration cards |
| `16px`–`18px` | Large form cards / dark bands |
| `20px` | Page shell wrapper |
| `999px` | Pills / circular badges |

### 4.2 Spacing

Rem-based scale in use: `0.2 / 0.25 / 0.3 / 0.35 / 0.4 / 0.45 / 0.5 / 0.6 / 0.65 / 0.75 / 0.85 / 0.9 / 1 / 1.2 / 1.25 / 1.5 / 1.75 / 2 / 2.5 / 3 / 4rem`.

- Grid gaps: `1rem`–`1.5rem` (dashboards), `1.4rem` (marketing grids).
- Card padding: `1.25rem 1.5rem` (dashboard cards), `1.4rem 1.2rem` (feature cards).
- Section rhythm (marketing): `120px` vertical.

### 4.3 Shadows

| Name | Value | Use |
|------|-------|-----|
| Card hover (accent glow) | `0 8px 32px rgba(244,81,30,0.18)` | Card hover |
| Dark band | `0 20px 48px rgba(26,8,0,0.32)` | Large dark sections |
| Default | none | Most flat surfaces |

---

## 5. Component Patterns

> **Implementation note:** the current codebase styles everything with **inline React style objects** (`style={{}}`) — no Tailwind, no shadcn, no global CSS file. If the CRM uses Tailwind/shadcn, map the tokens above into your config; the *values* are what matter.

### 5.1 Primary Button
```css
background: #F4511E;
color: #fff;
border: none;
border-radius: 8px;
padding: 0.65rem 1.5rem;
font-weight: 700;
font-size: 0.95rem;
transition: background 0.15s, box-shadow 0.15s;
/* hover */ background: #C73A0A;
```

### 5.2 Secondary Button (on dark)
```css
background: transparent;
color: #fff;
border: 1.5px solid rgba(255,255,255,0.6);
border-radius: 8px;
padding: 0.65rem 1.5rem;
font-weight: 700;
font-size: 0.95rem;
/* hover */ background: #fff; color: #1A0800;
```

### 5.3 Card (dark / CRM default)
```css
background: rgba(255,255,255,0.03);
border: 1px solid rgba(255,255,255,0.07);
border-radius: 12px;
padding: 1.25rem 1.5rem;
/* hover (optional) */ box-shadow: 0 8px 32px rgba(244,81,30,0.18);
```

### 5.4 Input (dark)
```css
width: 100%;
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 8px;
padding: 0.7rem 1rem;
color: #fff;
font-size: 0.95rem;
outline: none;
```

### 5.5 Label
```css
display: block;
font-size: 0.82rem;
font-weight: 700;
color: rgba(255,255,255,0.6);
letter-spacing: 0.06em;
text-transform: uppercase; /* optional */
margin-bottom: 0.4rem;
```

### 5.6 Badge / Pill
```css
display: inline-block;
font-size: 0.68rem;
font-weight: 800;
letter-spacing: 0.16em;
text-transform: uppercase;
background: #F4511E;
color: #fff;
border-radius: 999px;
padding: 4px 10px;
```

### 5.7 Status Pill (dynamic color)
```css
font-size: 0.7rem;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--status);
background: color-mix(in srgb, var(--status) 8%, transparent);
border: 1px solid color-mix(in srgb, var(--status) 19%, transparent);
border-radius: 4px;
padding: 2px 6px;
```

### 5.8 Sidebar Nav Link
```css
display: block;
padding: 0.5rem 0.75rem;
border-radius: 6px;
color: rgba(255,255,255,0.65);
font-size: 0.88rem;
font-weight: 500;
text-decoration: none;
/* active */ color: #F4511E; background: rgba(244,81,30,0.12);
```

---

## 6. Motion

| Element | Transition |
|---------|-----------|
| Buttons | `0.15s` ease (background, box-shadow) |
| Card hover | `160ms` ease (box-shadow) |
| Chevron / disclosure | `160ms` ease (transform: rotate(180deg) when open) |
| Progress bars | `0.4s` ease |

Keep motion subtle and fast (≤160ms for UI feedback). No bouncy/long animations.

---

## 7. CRM Build Checklist (for the implementing AI)

1. **Theme:** dark. Background `#0f0a07`, sidebar `#1A0D06`, cards `rgba(255,255,255,0.03)` with `12px` radius and `rgba(255,255,255,0.07)` borders.
2. **Font:** Inter, weights 400–900. Headings/values 900, labels 800 uppercase wide-tracked.
3. **Accent everything actionable** with `#F4511E` (hover `#C73A0A`).
4. **Status pills** use the semantic palette in §2.4 at 8%/19% alpha.
5. **Text colors** = white at opacity (0.85 / 0.65 / 0.40), pure `#fff` for headings & numbers.
6. **Radius:** 8px controls, 12px cards, 999px pills. **Buttons:** 700 weight, `0.65rem 1.5rem` padding.
7. **Keep it data-dense and flat** — minimal shadows, hairline borders, generous but measured spacing.
