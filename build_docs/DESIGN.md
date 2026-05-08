# NOMAD OPS — Light Operations Command Center Design System

Version: v2.0 Light Theme
Style Direction: Playbasis Logistics Command Center Inspired
Theme Mode: Light / Operational / Enterprise

---

# Overview

NOMAD OPS is a high-density operational command center interface inspired by modern logistics dispatch systems, AI orchestration dashboards, and live mission-control UIs.

The interface should visually match the reference screenshots:

* Bright neutral canvas
* Soft grey panels
* Large live map center
* Lightweight enterprise styling
* Minimal shadows
* Extremely dense information architecture
* AI-agent orchestration aesthetic
* Real-time dispatch feeling

The experience should feel like:

> Linear + Uber Dispatch + Airtable Ops + Google Maps + Bloomberg Terminal

but modernized into a clean light enterprise interface.

The UI must feel:

* Live
* Autonomous
* Operational
* Fast
* Reliable
* Human-supervised AI

Not consumer.
Not playful.
Not startup gradient-heavy.

This is an AI operations control room.

---

# Core Visual Direction

## Primary Principles

1. Light neutral backgrounds
2. Very subtle borders
3. Thin separators instead of shadows
4. Information density first
5. Map is the hero surface
6. Green only means ACTIVE / DELIVERED / LIVE
7. Floating panels should feel lightweight
8. Typography hierarchy must be extremely clear
9. Everything should feel instantly scannable
10. Real-time orchestration aesthetic

---

# Color System

## Base Palette

```yaml
colors:
  bg-base: "#F5F6F8"
  bg-surface: "#FFFFFF"
  bg-panel: "#FCFCFD"
  bg-overlay: "rgba(255,255,255,0.92)"
  bg-hover: "#F3F5F8"
  bg-selected: "#EEF6FF"

  border-subtle: "#E6EAF0"
  border-soft: "#EEF2F6"
  border-strong: "#D5DCE5"

  text-primary: "#111827"
  text-secondary: "#4B5563"
  text-muted: "#9CA3AF"
  text-inverse: "#FFFFFF"

  primary: "#22C55E"
  primary-dark: "#16A34A"
  primary-soft: "#DCFCE7"

  info: "#3B82F6"
  warning: "#F59E0B"
  danger: "#EF4444"
  purple: "#8B5CF6"

  map-route-primary: "#4ADE80"
  map-route-alt: "#60A5FA"
  map-route-secondary: "#C084FC"
  map-node: "#FFFFFF"

  chip-app-bg: "#E8F1FF"
  chip-app-text: "#2563EB"

  chip-image-bg: "#E8FFF1"
  chip-image-text: "#16A34A"

  chip-copy-bg: "#F3E8FF"
  chip-copy-text: "#9333EA"

  chip-brief-bg: "#FFF2E5"
  chip-brief-text: "#EA580C"

  chip-research-bg: "#FFE8F1"
  chip-research-text: "#DB2777"
```

---

# Theme Feel

## Background Behavior

### Main Canvas

Use:

* `#F5F6F8`
* slight warm grey tone
* not pure white
* no gradients

### Panels

All panels are:

* white or near-white
* subtle border
* ultra-soft elevation
* clean enterprise look

### Borders

Use borders for structure.
Not shadows.

```css
border: 1px solid #E6EAF0;
```

Shadows must remain extremely subtle:

```css
box-shadow:
  0 1px 2px rgba(16,24,40,0.04),
  0 1px 1px rgba(16,24,40,0.02);
```

---

# Typography System

## Fonts

### Primary Font

```yaml
DM Sans
```

### Monospace Font

```yaml
JetBrains Mono
```

---

## Typography Scale

```yaml
typography:
  display-xl:
    size: 28px
    weight: 700
    lineHeight: 1.1

  display:
    size: 24px
    weight: 700

  section-title:
    size: 11px
    weight: 700
    tracking: 0.12em
    uppercase: true

  nav-label:
    size: 13px
    weight: 500

  body:
    size: 13px
    weight: 400

  body-small:
    size: 12px
    weight: 400

  agent-name:
    size: 13px
    weight: 600

  metric-large:
    size: 28px
    weight: 700

  mono:
    size: 12px
    weight: 500
```

---

# Layout Architecture

## Global Structure

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│ AVATAR STRIP                                                              │
├───────────────┬──────────────────────────────────────┬────────────────────┤
│ LEFT PANEL    │ CENTER MAP                           │ RIGHT DRAWER       │
│               │                                      │                    │
│ Dispatch      │ Routes                               │ Agent Details      │
│ Active Runs   │ Labels                               │ Route Timeline     │
│ Queue         │ Dependencies                         │ Cost Metrics       │
│               │ Chat Overlay                         │                    │
├───────────────┴──────────────────────────────────────┴────────────────────┤
│ REVIEW FOOTER                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# Sizing System

```yaml
layout:
  top-nav-height: 48px
  avatar-strip-height: 44px
  left-sidebar-width: 280px
  right-sidebar-width: 320px
  bottom-review-height: 34px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
```

---

# Radius System

```yaml
radius:
  sm: 4px
  md: 6px
  lg: 10px
  xl: 14px
  pill: 999px
```

The UI should never feel overly rounded.

No glassmorphism.
No giant radius.
No floating mobile-app look.

---

# Top Navigation

## Behavior

The top navigation is:

* thin
* operational
* compact
* horizontally dense
* always visible

## Styling

```css
height: 48px;
background: #FFFFFF;
border-bottom: 1px solid #E6EAF0;
padding: 0 18px;
```

---

## Left Side

Contains:

* Brand logo
* Workspace selector
* Status badge
* Usage billing chip

## Center

Contains tabs:

* Overview
* Strategy
* Agents
* Team Activity
* Results
* Inbox
* Autonomy
* Data Sources
* Calendar
* Map

### Active Tab

```css
color: #111827;
font-weight: 600;
border-bottom: 2px solid #111827;
```

### Inactive Tab

```css
color: #6B7280;
```

---

# Avatar Agent Strip

## Behavior

A horizontally scrolling overlapping avatar system.

Represents:

* live AI workers
* autonomous agents
* active operators

## Styling

```css
height: 44px;
background: #FFFFFF;
border-bottom: 1px solid #E6EAF0;
```

### Avatar Rules

```css
width: 28px;
height: 28px;
border-radius: 999px;
border: 2px solid white;
margin-left: -6px;
```

### Status Ring

Active agents:

```css
box-shadow: 0 0 0 2px #22C55E;
```

---

# Left Dispatch Panel

## Structure

Contains:

1. Dispatch Header
2. Location Selector
3. Stats Row
4. Active Runs List

---

## Panel Styling

```css
background: #FCFCFD;
border-right: 1px solid #E6EAF0;
```

---

## Dispatch Header

### Contains

* DISPATCH label
* city name
* live indicator

### Styling

```css
padding: 14px;
border-bottom: 1px solid #E6EAF0;
```

---

# Location Selector

## Style

```css
background: white;
border: 1px solid #E6EAF0;
border-radius: 8px;
padding: 10px 12px;
```

Should feel like:

* Linear
* Notion
* modern enterprise select field

---

# Stats Row

## Structure

4-column metrics:

* ON ROUTE
* APPROVE
* QUEUED
* DELIVERED

## Metric Number

```css
font-size: 28px;
font-weight: 700;
```

## Label

```css
font-size: 10px;
letter-spacing: 0.1em;
text-transform: uppercase;
color: #9CA3AF;
```

---

# Active Runs List

## Behavior

This is the highest density area.

Should support:

* virtualized rendering
* infinite scroll
* fast filtering
* realtime updates
* hover interactions

Scrollbar must be hidden.

---

# Agent Row

## Structure

```text
Avatar
  Name + token count
  Task description
  Tag + cost + status
```

---

## Styling

```css
padding: 10px 14px;
border-bottom: 1px solid #EEF2F6;
background: transparent;
transition: background 120ms ease;
```

### Hover State

```css
background: #F7F9FB;
```

### Active State

```css
background: #EEF6FF;
border-left: 2px solid #22C55E;
```

---

# Agent Metadata

## Name

```css
font-size: 13px;
font-weight: 600;
color: #111827;
```

## Description

```css
font-size: 12px;
color: #6B7280;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

## Token Count

```css
font-family: "JetBrains Mono";
font-size: 11px;
color: #F59E0B;
```

---

# Task Tags

## Styling

```css
padding: 2px 6px;
border-radius: 4px;
font-size: 10px;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
```

---

## Tag Variants

### APP EDIT

```css
background: #E8F1FF;
color: #2563EB;
```

### IMAGE

```css
background: #E8FFF1;
color: #16A34A;
```

### COPY

```css
background: #F3E8FF;
color: #9333EA;
```

### BRIEF

```css
background: #FFF2E5;
color: #EA580C;
```

### ANALYZE

```css
background: #EEF2FF;
color: #6366F1;
```

### RESEARCH

```css
background: #FFE8F1;
color: #DB2777;
```

---

# Center Map Panel

## Philosophy

The map is the hero.

Everything else supports the map.

The map should feel:

* alive
* realtime
* operational
* global
* intelligent

---

# Map Styling

Use:

* Google Maps
* Mapbox
* MapLibre

with:

* desaturated colors
* slightly warm roads
* subtle labels
* soft water tones

The map should NOT be dark.

The references clearly use:

* light map base
* enterprise overlays
* clean navigation styling

---

# Route Lines

## Primary Route

```css
stroke: #4ADE80;
stroke-width: 3px;
```

## Secondary Route

```css
stroke: #60A5FA;
stroke-width: 2px;
```

## Alternate Route

```css
stroke: #C084FC;
stroke-width: 2px;
```

---

# Route Nodes

```css
width: 10px;
height: 10px;
background: white;
border: 2px solid #4ADE80;
border-radius: 999px;
```

---

# Map Toolbar

## Position

Top center floating toolbar.

---

## Styling

```css
background: rgba(255,255,255,0.92);
backdrop-filter: blur(10px);
border: 1px solid #E6EAF0;
border-radius: 999px;
padding: 4px;
```

---

## Toolbar Buttons

### Default

```css
background: transparent;
color: #4B5563;
```

### Active

```css
background: #111827;
color: white;
```

---

# Clock Chip

## Styling

```css
background: rgba(255,255,255,0.92);
border: 1px solid #E6EAF0;
border-radius: 999px;
padding: 6px 12px;
font-family: "JetBrains Mono";
font-size: 12px;
```

Position:

* top-right of map

---

# Chat Overlay

## Behavior

Floating AI assistant input.

Never fullscreen.
Never modal.
Always lightweight.

---

## Position

```css
position: absolute;
bottom: 80px;
left: 50%;
transform: translateX(-50%);
```

---

## Styling

```css
width: 520px;
background: rgba(255,255,255,0.96);
backdrop-filter: blur(20px);
border: 1px solid #E6EAF0;
border-radius: 16px;
padding: 16px 18px;
```

---

## Input Field

```css
border: none;
outline: none;
background: transparent;
font-size: 13px;
width: 100%;
```

---

## Send Button

```css
width: 34px;
height: 34px;
border-radius: 999px;
background: #111827;
color: white;
```

---

# Right Detail Drawer

## Purpose

Displays:

* selected agent
* delivery status
* workflow details
* route information
* metrics
* operational context

---

# Drawer Styling

```css
background: rgba(255,255,255,0.96);
border-left: 1px solid #E6EAF0;
padding: 18px;
```

---

# Delivered Badge

```css
background: #DCFCE7;
color: #16A34A;
padding: 4px 10px;
border-radius: 999px;
font-size: 10px;
font-weight: 700;
letter-spacing: 0.08em;
```

---

# Route Timeline

## Structure

Three-stage vertical timeline:

1. Pickup Origin
2. Transit
3. Dropoff Destination

---

## Timeline Line

```css
border-left: 1.5px solid #D5DCE5;
```

---

## Timeline States

### Complete

Filled green node.

### Active

Dark filled node.

### Pending

Outlined circle.

---

# Fare Meter

## Layout

2-column metrics grid.

---

## Styling

```css
background: #F9FAFB;
border: 1px solid #E6EAF0;
border-radius: 10px;
padding: 12px;
```

---

## Large Metrics

```css
font-size: 28px;
font-weight: 700;
font-family: "DM Sans";
```

## Labels

```css
font-size: 10px;
text-transform: uppercase;
letter-spacing: 0.1em;
color: #9CA3AF;
```

---

# Review Footer

## Styling

```css
height: 34px;
background: white;
border-top: 1px solid #E6EAF0;
```

---

## Badge

```css
background: #EF4444;
color: white;
padding: 2px 8px;
border-radius: 999px;
font-size: 10px;
font-weight: 700;
```

---

# Interaction Principles

## Hover Speed

```css
transition: all 120ms ease;
```

Never slow.

---

# Animation Philosophy

Minimal.
Operational.
Fast.

Allowed:

* subtle hover fade
* row highlight
* route drawing
* live pulse
* loading shimmer

Not allowed:

* bouncy animations
* overscaled motion
* heavy easing
* consumer-app motion

---

# Data Density Rules

## Always Prioritize

1. Scanability
2. Realtime clarity
3. Hierarchy
4. Operational trust
5. Human oversight

---

# Important UX Rules

## DO

* Keep everything aligned to an 8px grid
* Use subtle borders everywhere
* Keep typography extremely consistent
* Use JetBrains Mono for all metrics
* Keep map fully visible
* Make agent rows highly dense
* Preserve white space only where necessary
* Use green only for positive live state
* Make UI feel enterprise-grade
* Ensure panels feel lightweight

---

# DO NOT

* Use gradients
* Use neon colors
* Use giant shadows
* Use oversized border radius
* Add marketing-style visuals
* Add colorful dashboards
* Add unnecessary charts
* Make panels opaque and heavy
* Turn this into a SaaS landing page
* Use Apple-style frosted UI excessively

---

# Engineering Notes

## Recommended Stack

### Frontend

* Next.js
* Tailwind CSS
* Framer Motion (minimal)
* shadcn/ui
* Mapbox GL / MapLibre

---

## Recommended Patterns

### Layout

```css
height: 100vh;
overflow: hidden;
```

### Left Panel Scroll

```css
overflow-y: auto;
scrollbar-width: none;
```

### Avatar Strip

```css
overflow-x: auto;
scrollbar-width: none;
```

### Map Fill

```css
position: absolute;
inset: 0;
```

---

# Final Experience Goal

The final product should feel like:

> A real-time autonomous AI workforce operating globally from a mission control center.

Users should instantly understand:

* which agents are active
* where operations are happening
* what tasks are in-flight
* what needs review
* what AI systems are doing
* how workflows move geographically

The interface must communicate:

* trust
* orchestration
* scale
* realtime intelligence
* operational precision

Everything should feel:

* deliberate
* dense
* fast
* calm
* enterprise-grade
* human-supervised AI
