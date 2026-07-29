# design.md — Design System

Design north star: the attached reference mockups — warm, playful, rounded, high-contrast pastel/mustard palette, big friendly stat tiles with circular progress rings, soft drop shadows, chunky pill bottom nav.

## 1. Brand Personality
Playful, warm, encouraging, a little "cute pet-app" energy (not corporate/clinical). Rounded everything. Confident bold numbers. Generous whitespace inside cards. Never looks like a spreadsheet.

## 2. Color Palette

### Core Palette (extracted from reference)
| Token | Hex (approx) | Usage |
|---|---|---|
| `--color-cream-bg` | `#FBEFE0` | App background (soft warm off-white/cream) |
| `--color-amber-500` | `#F5B942` | Primary header/hero background (e.g. "Today" header), primary CTA |
| `--color-amber-600` | `#EFA928` | Amber hover/active state |
| `--color-orange-500` | `#F0824A` | Secondary header background (e.g. "Journal"), "Needs Satisfaction" tile |
| `--color-mint-400` | `#A9DDC3` | Positive/success tile (e.g. "Activity Goal"), map background |
| `--color-mint-600` | `#7CC3A2` | Mint accents, progress fill |
| `--color-lavender-400` | `#C9BEEA` | "Sleep Quality" tile, calm/neutral accent |
| `--color-coral-400` | `#F2A6A0` | "Wellness Index" tile, warning-lite accent |
| `--color-navy-900` | `#1F2430` | Primary text on light surfaces, phone-frame black |
| `--color-navy-600` | `#565C6B` | Secondary/muted text |
| `--color-white` | `#FFFFFF` | Card backgrounds (inner content cards), text on colored headers |
| `--color-success` | `#4CAF7D` | Positive deltas, "Below Average" good-budget state |
| `--color-warning` | `#E0A72E` | "Average" state |
| `--color-danger` | `#E2694F` | Negative deltas, "Above Average" over-budget state |

### Module Color Mapping (consistency across the app)
- **Goals/Habits module** → Amber/Gold as primary accent.
- **Study module** → Orange as primary accent.
- **Money module** → Mint as primary accent (money = green association, still fits palette).
- Stat tiles within any module cycle through Amber → Mint → Lavender → Coral for visual variety (exactly as reference "Today" screen does with its 4 tiles), not strictly module-locked — variety within the grid matters more than strict color-to-meaning mapping.

## 3. Typography
- Font family: **"Nunito"** or **"Quicksand"** (rounded, geometric, friendly — matches the chunky rounded numerals in the reference) for headings and stat numbers; **"Inter"** for body/UI text (better legibility at small sizes for lists/forms).
- Scale:
  - Stat numbers (big tile numbers, e.g. "38%"): `2rem–2.25rem`, weight 800.
  - Screen titles ("TODAY", "JOURNAL"): `1.1rem`, weight 800, letter-spacing `0.05em`, uppercase — matches reference.
  - Card titles: `1rem`, weight 700.
  - Body/labels: `0.8125rem–0.875rem`, weight 500–600.
  - Micro labels (day-of-week letters, "Below Average" etc.): `0.6875rem`, weight 700, uppercase, letter-spacing wide.

## 4. Shape & Elevation
- Border radius scale: `--radius-sm: 12px` (chips/buttons), `--radius-md: 20px` (small cards), `--radius-lg: 28px` (main content cards), `--radius-xl: 36px` (phone-frame-style top sheet corners / header container).
- Shadows: soft, warm-toned, low-opacity — `box-shadow: 0 8px 24px rgba(31,36,48,0.08)` on white cards sitting atop colored headers, giving the "cards floating over a colored header" look in the reference.
- Header sections use a solid saturated color block (amber/orange) that the white content cards overlap/sit on top of with rounded top corners — this overlap pattern is the app's signature layout move, reused on every module's top-level page.

## 5. Core Components (visual spec)

### 5.1 Stat Tile (e.g. "Needs Satisfaction 38%")
- Rounded rectangle (`--radius-md`), colored background (cycles through palette), padding `16px`.
- Top-right or top-left: small circular ring icon (mini progress ring using the tile's own %, stroke = darker shade of tile color, track = white/translucent white).
- Big bold % number, small label below in uppercase micro-label style.
- Tap target: whole tile, navigates to relevant detail/analytics.

### 5.2 Circular Progress Ring
- Used for: subject completion (study), habit streak visual, budget usage, overall daily score.
- SVG stroke-based ring, rounded line caps, background track in light tint of the ring color, animated fill on load/update.

### 5.3 Live/Status Card (e.g. "Mau is on a walk")
- Reused pattern → repurposed in this app as **"Active Session" card**: shows an in-progress study timer session or "X habits left today" banner. White rounded card, small thumbnail/icon-avatar on the left (user avatar or module icon), live pulsing dot + "LIVE"-style badge when a timer is actively running (study session timer), meta row with time + context icon.

### 5.4 Calendar Strip
- 7-day horizontal row (Mon–Sun), each day = small rounded pill; today = filled dark circle with white bold number (exact reference style); days with logged activity get a small colored dot beneath the number.
- Expands to full month **Calendar view** (tap a "see full calendar" affordance) using a grid of day cells, each shaded by a heatmap intensity of that day's completion.

### 5.5 Insights Card
- White card, section header "INSIGHTS" + "N New" badge (amber pill), list of short auto-generated text rows, each with a small colored tag/dot on the left indicating category (habit/study/money) — matches reference's insight card with paw icon + colored left accent bar.

### 5.6 Bottom Navigation (mobile)
- Pill-shaped container, amber/gold fill (matches reference exactly), 5 icon buttons evenly spaced, active icon in a small white/dark circular badge, inactive icons in dark navy at ~70% opacity.
- Fixed to bottom, floats with margin from screen edge (not edge-to-edge), consistent across all screens.

### 5.7 Sidebar Navigation (desktop, ≥1024px)
- Left-fixed, cream/white background, icon + label rows, active item gets a soft amber pill background behind it, logo/wordmark at top, user avatar + name pinned at bottom linking to profile.

### 5.8 Budget/Metric Bar (e.g. "Eating 15min — Below/Average/Above")
- Horizontal 3-zone track (Below Average / Average / Above Average labeled beneath), a filled bar + small marker/pointer icon showing current position, colored by zone (green/amber/red).

### 5.9 Buttons
- Primary: solid navy or solid amber pill button, bold white/navy text, `--radius-sm` to fully rounded (`9999px`) for main CTAs.
- Secondary/outline: white bg, colored border matching context, colored text.
- FAB (mobile quick-add): circular, amber fill, "+" icon, fixed bottom-right just above the nav bar, soft shadow.

## 6. Iconography
- **lucide-react** icon set, line-style icons at `1.5–2px` stroke, matching the thin friendly icon style in the reference (fork/knife, droplet, paw, location pin, pie chart, house, trending-up, user).
- Module icons: Goals = target/flag icon, Study = book/graduation-cap icon, Money = wallet/coin icon.

## 7. Motion
- Card entrances: fade + slight upward slide (150–200ms, ease-out).
- Progress rings: animate stroke-dashoffset on mount/update (400ms ease).
- Bottom sheet: slide up 250ms with spring-ish ease, backdrop fade.
- Streak increment: small celebratory scale-bounce + optional confetti burst (canvas-confetti, sparingly — only on meaningful milestones like a 7/30/100-day streak, not every checkbox tap, to avoid fatigue).

## 8. Responsive Behavior
- **Mobile (base, ≤640px):** single column, everything as described above, matches reference 1:1.
- **Tablet (641–1023px):** stat tiles become a 2-column grid instead of stacked; header/card overlap pattern retained; bottom nav retained (or becomes a top tab bar — decide during build, default: keep bottom nav for consistency).
- **Desktop (≥1024px):** left sidebar nav; main content becomes a max-width `1100px` centered container; Today dashboard becomes a 2–3 column layout (Goals summary | Study summary | Money summary side-by-side, each keeping its own internal stat-tile grid); colored header-block pattern shrinks to a slim top banner rather than a full-screen block (avoids an overwhelming wall of color on large screens).

## 9. Dark Mode (v1.5, not required for launch)
- Swap cream background → deep navy (`#161A22`), white cards → `#20242F` surfaces, keep the same saturated amber/orange/mint/lavender/coral accent colors (they read well on dark too), text flips to off-white.

## 10. Accessibility Notes
- All colored tiles must pair bold-weight text at sufficient size/contrast (test amber/mint backgrounds with navy text, not white, since white-on-pastel often fails AA — navy-900 on these pastels passes comfortably).
- Never convey status (Below/Average/Above, streak broken, etc.) by color alone — always pair with icon or text label, as already reflected in the component specs above.
