---
name: NomadOps
version: alpha
description: >
  Mission Control for Travel — a dense operational dashboard inspired by
  logistics dispatch systems. The UI is a pixel-faithful recreation of the
  Playbasis Logistics Command Center aesthetic: dark top nav, three-panel
  layout (left agent list, center live map, right detail drawer), and an
  always-live status strip.

colors:
  bg-base: "#0F1117"
  bg-surface: "#1A1D27"
  bg-panel: "#13161F"
  bg-overlay: "#1E2130"
  bg-hover: "#262A3A"
  border-subtle: "#2A2E3E"
  border-strong: "#3A3F52"
  primary: "#1DB954"
  primary-muted: "#16913E"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#3B82F6"
  purple: "#8B5CF6"
  text-primary: "#F0F2F7"
  text-secondary: "#8B90A0"
  text-muted: "#555B70"
  text-inverse: "#0F1117"
  map-route-primary: "#22C55E"
  map-route-alt: "#A78BFA"
  map-route-warning: "#F97316"
  map-node: "#FFFFFF"
  tag-app-edit-bg: "#1E3A5F"
  tag-app-edit-text: "#60A5FA"
  tag-image-bg: "#1A3A2A"
  tag-image-text: "#34D399"
  tag-copy-bg: "#2D1A3A"
  tag-copy-text: "#C084FC"
  tag-brief-bg: "#3A2A1A"
  tag-brief-text: "#FB923C"
  tag-analyze-bg: "#2A1A3A"
  tag-analyze-text: "#A78BFA"
  tag-research-bg: "#3A1A2A"
  tag-research-text: "#F472B6"

typography:
  display:
    fontFamily: "DM Sans"
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  nav-label:
    fontFamily: "DM Sans"
    fontSize: 0.8125rem
    fontWeight: 600
    letterSpacing: 0.01em
  section-heading:
    fontFamily: "DM Sans"
    fontSize: 0.6875rem
    fontWeight: 700
    letterSpacing: 0.08em
  agent-name:
    fontFamily: "DM Sans"
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1.3
  agent-task:
    fontFamily: "DM Sans"
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono"
    fontSize: 0.75rem
    fontWeight: 400
  detail-value:
    fontFamily: "DM Sans"
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1
  label-caps:
    fontFamily: "DM Sans"
    fontSize: 0.625rem
    fontWeight: 700
    letterSpacing: 0.1em

rounded:
  sm: 4px
  md: 6px
  lg: 10px
  pill: 999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px

components:
  nav-bar:
    backgroundColor: "{colors.bg-surface}"
    height: 44px
    borderBottom: "1px solid {colors.border-subtle}"
    padding: "0 16px"
  nav-tab:
    textColor: "{colors.text-secondary}"
    typography: "{typography.nav-label}"
    padding: "0 12px"
    height: 44px
  nav-tab-active:
    textColor: "{colors.text-primary}"
    borderBottom: "2px solid {colors.primary}"
  nav-badge:
    backgroundColor: "{colors.bg-overlay}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "2px 6px"
  agent-panel:
    backgroundColor: "{colors.bg-panel}"
    width: 268px
    borderRight: "1px solid {colors.border-subtle}"
  dispatch-header:
    backgroundColor: "{colors.bg-panel}"
    borderBottom: "1px solid {colors.border-subtle}"
    padding: "10px 14px"
  location-selector:
    backgroundColor: "{colors.bg-overlay}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  stats-row:
    backgroundColor: "transparent"
    padding: "8px 14px"
  agent-row:
    backgroundColor: "transparent"
    padding: "8px 14px"
    borderBottom: "1px solid {colors.border-subtle}"
  agent-row-active:
    backgroundColor: "{colors.bg-hover}"
    borderLeft: "2px solid {colors.primary}"
  tag-pill:
    rounded: "{rounded.sm}"
    padding: "2px 6px"
    typography: "{typography.label-caps}"
  map-panel:
    backgroundColor: "#1A2035"
  map-toolbar:
    backgroundColor: "rgba(15,17,23,0.85)"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  map-toolbar-button-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
  clock-chip:
    backgroundColor: "rgba(15,17,23,0.85)"
    textColor: "{colors.text-primary}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "5px 10px"
  chat-overlay:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
    width: 520px
  detail-drawer:
    backgroundColor: "{colors.bg-panel}"
    width: 300px
    borderLeft: "1px solid {colors.border-subtle}"
    padding: "{spacing.lg}"
  delivered-badge:
    backgroundColor: "#0D3320"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  fare-grid:
    backgroundColor: "{colors.bg-overlay}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  review-bar:
    backgroundColor: "{colors.bg-surface}"
    borderTop: "1px solid {colors.border-subtle}"
    height: 36px
  review-badge:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

## Overview

**Operational Command Center — Dark Mission Control.**

NOMAD OPS replicates the Playbasis Logistics Command Center UI exactly:
a near-black three-panel layout where the map is always live, the left
panel lists active AI agents as "runs", and the right drawer shows the
selected agent's delivery detail. The aesthetic is **Bloomberg Terminal
meets Google Maps** — dense, purposeful, zero decoration.

The singular green `#1DB954` is the only "warm" signal in an otherwise
cool blue-grey dark palette. It means one thing only: **live / active /
delivered**. Everything else is hierarchy through opacity.

---

## Colors

- **bg-base (#0F1117):** True canvas floor — only visible at extreme edges
- **bg-surface (#1A1D27):** Top nav bar and bottom review strip
- **bg-panel (#13161F):** Left agent panel and right detail drawer — the two side columns
- **bg-overlay (#1E2130):** Raised cards within panels (location selector, fare grid)
- **bg-hover (#262A3A):** Active/selected agent row tint
- **primary (#1DB954):** The ONLY green. Live dot, route line, delivered badge, active row left-border. Never decorative.
- **warning (#F59E0B):** Token counts only (⚡ 15.2k, ⚡ 14.9k pattern)
- **danger (#EF4444):** "Needs review" badge at bottom strip — urgency signal
- **text-secondary (#8B90A0):** Labels, descriptions, meta — the workhorse grey
- **text-muted (#555B70):** ACTIVE RUNS heading, column labels — nearly invisible

Tag pills are **hue-matched pairs**: dark-bg + bright-text within the
same color family. Blue for APP EDIT, green for IMAGE, purple for COPY,
orange for BRIEF, violet for ANALYZE, pink for RESEARCH.

---

## Typography

**DM Sans** everywhere except numbers. Chosen for: excellent small-size
legibility on dark, slightly geometric personality that reads "ops tool"
not "consumer app", and wide weight range (400→700 all used here).

**JetBrains Mono** for all live numerical data: costs (`$0.426`),
token counts (`15.6k`), timestamps (`15:28:19`). Monospace ensures
columns align and data reads as machine output, not marketing copy.

Key sizes:
- 13px agent names — readable in a dense list
- 12px task descriptions — secondary, never competes with name
- 10px label-caps section headers (ACTIVE RUNS, ROUTE, FARE METER) — maximum information density

---

## Layout

Full-viewport, fixed-height, three-column. Nothing scrolls except the
agent list and right drawer content.

```
┌───────────────────────────────────────────────────────────────────┐
│  TOP NAV (44px): Brand logo · tabs with badges · status pill      │
├───────────────────────────────────────────────────────────────────┤
│  AVATAR STRIP (44px): Overlapping agent avatar chips (28px each)  │
├────────────────┬────────────────────────────────┬─────────────────┤
│  LEFT PANEL    │      CENTER MAP                │  RIGHT DRAWER   │
│  268px         │      flex: 1                   │  300px          │
│                │                                │                 │
│  Dispatch hdr  │  Dark-styled Google Maps       │  Agent avatar   │
│  Location pill │  Routes/Labels/Deps toolbar    │  DELIVERED pill │
│  Stats 4-col   │  Live clock chip (top-right)   │  Task title     │
│  Active Runs   │  Green + purple polylines      │  Description    │
│  Agent rows    │  White node dots               │  ETA  |  %      │
│  (scrollable)  │  Chat overlay (bottom center)  │  Route steps    │
│                │                                │  Fare meter     │
├────────────────┴────────────────────────────────┴─────────────────┤
│  NEEDS REVIEW BAR (36px): red badge + "3 awaiting review"         │
└───────────────────────────────────────────────────────────────────┘
```

Spatial rules:
- All panels use `border` not `box-shadow` for separation
- Left panel list: `overflow-y: auto; scrollbar-width: none` (no visible scrollbar)
- Avatar strip: `overflow-x: auto; scrollbar-width: none`, avatars `margin-left: -6px`
- Map fills its column completely — no inset, no padding
- Chat overlay: `position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%)`

---

## Elevation & Depth

Border-only layering. No shadows on panels. The map provides all depth.

| Level | Color | Used For |
|-------|-------|----------|
| 0 | bg-base | True canvas |
| 1 | bg-panel | Side columns |
| 2 | bg-surface | Top nav, bottom bar |
| 3 | bg-overlay | Inline cards, fare block, location picker |
| 4 | White (#FFFFFF) | Chat overlay — only element that "lifts" visually |

---

## Shapes

Tight radii everywhere. This is a tool, not a product landing page.

- `rounded.sm` (4px): tag pills, tiny badges
- `rounded.md` (6px): location selector, clock chip, toolbar buttons, fare grid
- `rounded.pill` (999px): avatars, nav badges, status pills, toolbar group container
- `rounded.lg` (10px): chat overlay only

Maximum radius used anywhere: 10px. No `xl`, no `2xl`.

---

## Components

### Agent Row (Left Panel)

The core repeating unit. 268px wide, 8px top/bottom padding, 14px left/right.

Structure (horizontal flex):
1. Avatar circle (28×28, rounded-full, object-cover)
2. Content (flex-col, flex: 1, min-width: 0):
   - **Line 1**: agent name (bold 13px) + `⚡ {tokens}` (warning mono, right-aligned)
   - **Line 2**: task description (12px text-secondary, single-line truncate)
   - **Line 3**: `[TYPE TAG]` + `$ {cost}` (mono text-secondary) + `done` (muted label-caps)
3. Bottom border: `1px solid border-subtle`
4. Selected state: `bg-hover` bg + `border-left: 2px solid primary`

### Stats Row (4 columns)

Below the location selector. Four equal-width columns, center-aligned:
- Large number: `display` typography (1.5rem bold)
- Label below: `label-caps` in text-muted (ON ROUTE, APPROVE, QUEUED, DELIVERED)
- Zero values render in `text-primary`; non-zero DELIVERED renders in `primary` green

### Map Toolbar

Frosted pill, top-center of map, absolute positioned:
- Container: `bg: rgba(15,17,23,0.85)`, `backdrop-filter: blur(8px)`, `rounded.pill`, `border: 1px solid border-subtle`
- Buttons: Routes (active = `primary` green bg + dark text), Labels, Dependencies, 3D
- Vertical separator before 3D button

### Route on Map

- Active route: 3px solid `map-route-primary` (#22C55E)
- Alternate route: 2px slightly-transparent `map-route-alt` (#A78BFA)  
- Node dots: 10px white filled circle with `map-route-primary` 2px border, at each waypoint
- Map base: Google Maps with custom JSON style — greyed-out roads, dark water, minimal labels

### Right Drawer — Route Steps

Vertical timeline, three steps:
1. **PICKUP · ORIGIN** — filled green circle icon
2. **TRANSIT · APP EDIT** — filled dark circle  
3. **DROPOFF · DESTINATION** — empty ring icon (pending)

Timeline track: `border-left: 1.5px solid border-strong` connecting all three.
Each step: `section-heading` ALL CAPS label + bold location name + `agent-task` sub-label.

### Fare Meter Grid

2-column grid inside `bg-overlay` rounded card:
- Left: COST — `$0.426` in `detail-value` + "Low cost" label-caps
- Right: TOKENS — `15.6k` in `detail-value` + "11,520 in · 4,040 out" breakdown

### Chat Overlay

White `#FFFFFF` card, `rounded.lg`, floating over map bottom-center.
- Line 1: "Sign in to chat with Maya in this public demo." — 12px text-muted
- Line 2: Placeholder input text (13px text-muted) + dark send button (32px circle, `→`)
- No visible input border — the card edge IS the container

---

## Do's and Don'ts

**Do:**
- Use green (`#1DB954`) ONLY for live/active/success/delivered states
- Render ALL numbers in JetBrains Mono — costs, tokens, timestamps, ETAs
- Overlap avatars in the strip with `margin-left: -6px` — signals a team, not a list
- Keep map at full contrast and brightness — never dim it with overlays
- Truncate agent task descriptions to single line — density over completeness
- Show the left panel's active row with BOTH `bg-hover` AND the green left-border

**Don't:**
- Use border-radius above 10px anywhere
- Add gradient fills to any panel background — flat darks only
- Add more than 6 tag pill color families
- Use `text-primary` (#F0F2F7) for secondary metadata — always use `text-secondary`
- Render the chat as a full modal — it's always partial, floating, non-blocking
- Add hover transitions longer than 120ms — this is an ops tool, not a landing page
- Use Inter, Roboto, or system fonts — DM Sans + JetBrains Mono only