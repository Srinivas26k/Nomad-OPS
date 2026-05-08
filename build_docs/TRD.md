# NOMAD OPS — Technical Requirements Document

> **Product:** NOMAD OPS v1.0 · **Team:** PromptWars · **Event:** Google Hackathon Hyderabad 2026  
> **Status:** ACTIVE — Hackathon MVP · **AI Framework:** Google ADK (Agent Development Kit)  
> **Date:** May 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [ADK Implementation Specification](#4-adk-implementation-specification)
5. [Frontend Specification](#5-frontend-specification)
6. [API Contracts](#6-api-contracts)
7. [Performance & Quality](#7-performance--quality)
8. [Security](#8-security)
9. [Demo Scenario — Goa Traveler](#9-demo-scenario--goa-traveler)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Engineering Standards](#12-engineering-standards)
13. [Open Technical Questions](#13-open-technical-questions)
14. [Glossary](#14-glossary)

---

## 1. Overview

This TRD defines the complete engineering specification for NOMAD OPS — an autonomous AI-powered travel orchestration platform built on **Google ADK (Agent Development Kit)**. It translates every PRD requirement into concrete technical decisions: data contracts, API integrations, agent topologies, and system design.

> **Core architectural decision:** NOMAD OPS uses Google ADK as its multi-agent orchestration backbone. ADK's `SequentialAgent`, `ParallelAgent`, and `LlmAgent` primitives map directly to the routing, budget, weather, and recovery agents described in the PRD. The `OrchestratorAgent` is a `SequentialAgent` that chains all sub-agents and passes shared `SessionState` through each step.

---

## 2. System Architecture

### 2.1 Four-Tier Layer Model

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Presentation** | Next.js 14 + TailwindCSS + Framer Motion | Travel Command Center UI, map rendering, chat input |
| **Orchestration** | Google ADK (Python SDK) + Cloud Functions Gen 2 | Multi-agent pipeline, event routing, conflict resolution |
| **AI Reasoning** | Gemini 1.5 Pro via ADK `LlmAgent` | Decision-making, NLU, plan generation |
| **Data / Realtime** | Firebase Realtime DB + Firestore | State sync, decision feed, session storage |
| **Maps** | MapLibre GL JS + OpenStreetMap (OpenFreeMap dark tiles) | Vector map rendering, dark custom style — **no API key** |
| **Routing** | OSRM (public API) + GraphHopper Free Tier | Route calculation, polylines, ETAs — **free** |
| **Geocoding** | Nominatim (OSM) | Destination search, coordinate resolution — **free** |
| **POIs** | Overpass API (OSM) | Nearby places, categories, ratings — **free** |
| **Weather** | Open-Meteo API | 15-min forecast, rain probability — **free, no key** |

### 2.2 ADK Agent Topology

The multi-agent system uses ADK's native agent composition. Each agent is an `LlmAgent` with scoped tools and a single responsibility.

| ADK Agent | ADK Type | Tools / APIs | Triggers |
|-----------|----------|-------------|---------|
| `OrchestratorAgent` | `SequentialAgent` (root) | All sub-agents, Firebase write | Every user action, event, or timed tick |
| `RoutingAgent` | `LlmAgent` | Maps Routes API, Directions API, traffic layer | Destination change, disruption, mood change |
| `BudgetAgent` | `LlmAgent` | Firebase spend ledger, Places API pricing | Every route recalc, new POI selection |
| `WeatherAgent` | `LlmAgent` | Open-Meteo API, Gemini tool call | 5-min polling, rain/storm event |
| `ExperienceAgent` | `LlmAgent` | Places API (ratings, categories), Gemini | Mood change, crowd spike |
| `SocialAgent` | `LlmAgent` | Firebase group session, Gemini negotiation | New member joins, preference conflict |
| `RecoveryAgent` | `LlmAgent` | All routing + budget tools | Disruption score > threshold |
| `ExplainabilityAgent` | `LlmAgent` | Firebase write (decision feed) | After every agent decision |

**ADK Pipeline Pattern:**

```
OrchestratorAgent (SequentialAgent)
  ├── WeatherAgent
  ├── RoutingAgent
  ├── BudgetAgent
  ├── ExperienceAgent
  └── ExplainabilityAgent

Parallel branches (when triggered):
  ├── RecoveryAgent    ← disruption_score > 0.6
  └── SocialAgent      ← group.length > 1 AND preference_conflict = true
```

### 2.3 Data Flow

```
User action / simulated event
        │
        ▼
Next.js API route (/api/orchestrate)
        │
        ▼
Cloud Function (HTTP Gen 2)
        │
        ▼
ADK OrchestratorAgent.run(session_state)
        │
   ┌────┴─────────────────────────┐
   │  Sequential agent chain      │
   │  Each agent → Firestore write│
   └────┬─────────────────────────┘
        │
        ▼
Firebase Realtime DB (push to client)
        │
        ▼
Next.js UI re-renders map + panels
```

---

## 3. Technology Stack

### 3.1 Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.x (App Router) | SSR framework, API routes |
| TailwindCSS | 3.x | Utility-first styling |
| Framer Motion | 11.x | Route animation, rerouting pulse |
| `maplibre-gl` | 4.x | Vector map rendering (OpenStreetMap tiles, no API key) |
| `react-map-gl` | 7.x (MapLibre adapter) | React wrapper for MapLibre GL |
| Firebase JS SDK | 10.x | Realtime DB listener, Firestore, Auth |
| Zustand | 4.x | Global state: session, constraints, feed |
| Recharts | 2.x | Budget sparklines, crowd charts |

### 3.2 Backend / Orchestration

| Component | Technology | Notes |
|-----------|-----------|-------|
| ADK Runtime | `google-adk` (Python 3.11) | Core agent framework |
| ADK Agent Host | Cloud Functions Gen 2 (Python) | HTTP-triggered; 4GB RAM |
| Gemini Model | `gemini-1.5-pro-latest` | All `LlmAgent` reasoning |
| Session State | Firestore doc per `session_id` | Agent context persisted |
| Real-time Push | Firebase Realtime DB | Decision feed to UI |
| Secrets | Google Secret Manager | Gemini API key only |

### 3.3 APIs & External Services (All Free / No Key Required)

| API | Provider | Usage | Auth |
|-----|---------|-------|------|
| Gemini 1.5 Pro | Google AI | All agent LLM calls | API Key (Secret Manager) |
| OpenFreeMap Dark Tiles | openfreemap.org | Vector map tiles (dark style) | **None — free** |
| MapLibre GL JS | maplibre.org | Client-side map rendering | **None — open source** |
| OSRM Routing API | router.project-osrm.org | Route polylines, ETA, turn-by-turn | **None — free** |
| GraphHopper API | graphhopper.com | Alternative route calculation | Free tier (2,500 req/day) |
| Nominatim Geocoding | nominatim.openstreetmap.org | Destination → coordinates | **None — free** |
| Overpass API | overpass-api.de | POI search, nearby places | **None — free** |
| Open-Meteo API | open-meteo.com | Weather forecast, rain probability | **None — free, no key** |
| Firebase Realtime DB | Google Firebase | Decision feed streaming | Service Account |
| Firestore | Google Firebase | Session & agent state | Service Account |
| Firebase Auth | Google Firebase | Anonymous session tokens | Client SDK |
| Cloud Functions | Google Cloud | ADK agent host | Service Account IAM |

---

## 4. ADK Implementation Specification

### 4.1 ADK Setup

```python
# requirements.txt (Cloud Functions)
google-adk>=0.3.0
google-generativeai>=0.5.0
firebase-admin>=6.0.0
functions-framework>=3.0.0
```

### 4.2 OrchestratorAgent — Root Pipeline

```python
from google.adk.agents import SequentialAgent

orchestrator = SequentialAgent(
    name="OrchestratorAgent",
    sub_agents=[
        weather_agent,      # WeatherAgent
        routing_agent,      # RoutingAgent
        budget_agent,       # BudgetAgent
        experience_agent,   # ExperienceAgent
        explain_agent,      # ExplainabilityAgent
    ]
)
```

### 4.3 Sample LlmAgent — RoutingAgent

```python
from google.adk.agents import LlmAgent
from google.adk.tools import tool

@tool
def calculate_route(
    origin: dict,          # {lat, lng}
    destination: str,
    waypoints: list,
    mood: str
) -> dict:
    """Call Directions API, return polyline + risk_score."""
    # ... Directions API call
    return {
        "polyline": "...",
        "eta_minutes": 28,
        "distance_km": 12.4,
        "risk_score": 0.3
    }

routing_agent = LlmAgent(
    name="RoutingAgent",
    model="gemini-1.5-pro-latest",
    tools=[calculate_route, get_alternative_routes],
    instruction="""
        You optimize travel routes based on the current session state.
        Always return a route with a risk_score between 0.0 and 1.0.
        If risk_score > 0.6, also return alternative routes.
    """
)
```

### 4.4 Agent Tool Contracts

| Agent | Tool | Input | Output | API Used |
|-------|------|-------|--------|----------|
| `RoutingAgent` | `calculate_route` | `{origin, destination, waypoints[], mood}` | `{polyline, eta_minutes, distance_km, risk_score}` | **OSRM** |
| `RoutingAgent` | `get_alternative_routes` | `{origin, destination, constraints}` | `{routes[]: {polyline, eta, cost_estimate}}` | **GraphHopper Free** |
| `RoutingAgent` | `geocode_location` | `{place_name: string}` | `{lat, lng, display_name}` | **Nominatim** |
| `BudgetAgent` | `check_budget_impact` | `{route_id, activities[], group_size}` | `{remaining, spend_breakdown, alert_level}` | Internal |
| `WeatherAgent` | `get_weather_risk` | `{lat, lng, window_hours}` | `{rain_prob, risk_level, recommendation}` | **Open-Meteo** |
| `ExperienceAgent` | `rank_pois` | `{location, mood, budget_tier, crowd_max}` | `{pois[]: {name, score, category, coords}}` | **Overpass API** |
| `SocialAgent` | `negotiate_preferences` | `{user_preferences[]}` | `{merged_mood, compromise_score, hybrid_plan}` | Gemini reasoning |
| `RecoveryAgent` | `execute_recovery` | `{disruption_type, current_state}` | `{new_route, explanation, savings}` | OSRM + Gemini |
| `ExplainabilityAgent` | `log_decision` | `{agent, trigger, action, outcome}` | `{decision_id, timestamp, feed_entry}` | Firebase write |

### 4.5 Session State Schema

Persisted in Firestore at `/sessions/{sessionId}`. Passed as context to every ADK agent call.

```typescript
interface SessionState {
  session_id: string;                   // UUID
  destination: string;                  // "Goa, India"
  current_location: { lat: number; lng: number };
  mood: "adventure" | "relaxed" | "nightlife" | "budget" | "photography" | "social";
  budget_total: number;                 // INR
  budget_spent: number;                 // INR, accumulated
  group: UserProfile[];
  active_route: RouteObject;
  constraint_snapshot: ConstraintSnapshot;
  decision_log: DecisionEntry[];
  disruptions: DisruptionEvent[];
}

interface DecisionEntry {
  id: string;
  timestamp: string;                    // ISO8601
  agent: string;                        // "WeatherAgent → RoutingAgent"
  trigger: string;                      // "Rain 82% near Baga Beach"
  action: string;                       // "Switched to indoor café route"
  outcome: string;                      // "Saved 40-min delay; +₹120"
  severity: "info" | "warning" | "critical";
  saved_amount: number | null;
}
```

---

## 5. Frontend Specification

### 5.1 Application Structure

```
/app
  page.tsx                    # Root: 3-panel Command Center layout
  /api
    /orchestrate/route.ts     # Proxies to ADK Cloud Function
    /simulate-event/route.ts  # Demo event injection

/components
  /map
    CommandMap.tsx            # Google Maps wrapper + overlays
    RoutePolyline.tsx         # Animated route drawing
    NodeDot.tsx               # Waypoint markers
  /panels
    ConstraintPanel.tsx       # Left panel: live gauges
    DecisionFeed.tsx          # Right panel: chronological decisions
    AgentList.tsx             # Left panel: active agent runs
  /ui
    MoodSelector.tsx          # 6-mode chip selector
    EventSimulator.tsx        # Demo trigger buttons

/agents                       # ADK Python agents (deployed to Cloud Functions)
  orchestrator.py
  routing_agent.py
  budget_agent.py
  weather_agent.py
  experience_agent.py
  social_agent.py
  recovery_agent.py
  explainability_agent.py

/services
  firebase.ts                 # SDK init, Realtime DB hooks
  maps.ts                     # Maps API helpers

/store
  sessionStore.ts             # Zustand: session, route, constraints, feed

/mocks                        # Pre-seeded fallback data for demo resilience
  rain_event.json
  crowd_spike.json
  group_join.json
```

### 5.2 Map Component Specification

| Feature | Implementation | API / Library |
|---------|---------------|---------------|
| Base map | MapLibre GL JS + OpenFreeMap dark vector tiles | **openfreemap.org** (no key) |
| Dark style | `https://tiles.openfreemap.org/styles/dark` JSON style | OpenFreeMap |
| Active route | MapLibre `GeoJSON` LineLayer; `line-dasharray` animation on reroute | **OSRM** polyline decoded |
| Alt routes | Dashed LineLayer, lower opacity; click to adopt | **GraphHopper** alternatives |
| POI markers | MapLibre `Symbol` layer with category SVG icons | **Overpass API** nodes |
| Traffic | Mock data overlay (colored LineLayer on top of route) | Mock JSON |
| Crowd heat | MapLibre `HeatmapLayer` weighted by `crowd_density` | Client-side mock data |
| Reroute animation | Framer Motion `pathLength` + MapLibre layer swap | Client-side |
| Weather overlay | MapLibre `CircleLayer` at risk coordinates | **Open-Meteo** data |

### 5.3 Constraint Panel — Live Indicators

| Indicator | Data Source | Visual | Update Trigger |
|-----------|-------------|--------|----------------|
| Budget Remaining | BudgetAgent → Firestore | Horizontal bar (green→red) | Every agent decision |
| Weather Risk | WeatherAgent → Firestore | Shield icon + risk badge | Every 5 min + event |
| Crowd Density | ExperienceAgent → Firestore | People icon + % bar | Every agent cycle |
| Energy Level | User slider + voice input | Battery icon + slider | User interaction |
| Transport Status | RoutingAgent → Firestore | Mode icon + ETA | Every route recalc |
| Time Remaining | `session.endTime - now()` | Countdown clock | Every second (client) |

### 5.4 Decision Feed Entry Schema

```typescript
interface DecisionFeedEntry {
  id: string;
  timestamp: string;
  agent: string;           // "WeatherAgent → RoutingAgent"
  trigger: string;         // "Rain probability 82% detected near Baga Beach"
  action: string;          // "Switched to indoor café route via Anjuna"
  outcome: string;         // "Saved 40-min delay; budget impact: +₹120"
  severity: "info" | "warning" | "critical";
  saved_amount: number | null;
}
```

---

## 6. API Contracts

### 6.1 `POST /api/orchestrate`

**Request:**

```json
{
  "session_id": "uuid-string",
  "action_type": "plan_route | mood_change | disruption | voice_input | group_join",
  "payload": { },
  "timestamp": "2026-05-08T14:32:11Z"
}
```

**action_type payload schemas:**

| action_type | payload fields |
|------------|----------------|
| `plan_route` | `{ destination, budget_total, group_size, mood }` |
| `mood_change` | `{ mood: MoodEnum }` |
| `disruption` | `{ disruption_type, location?, intensity? }` |
| `voice_input` | `{ transcript: string }` |
| `group_join` | `{ new_user: UserProfile }` |

**Response:**

```json
{
  "decision_id": "dec_1748293847",
  "updated_route": { "polyline": "...", "eta_minutes": 28 },
  "constraint_snapshot": { "budget_remaining": 12400, "weather_risk": "medium" },
  "decision_summary": "Rerouted due to 82% rain probability near Baga Beach",
  "status": "success | partial | failed"
}
```

### 6.2 `POST /api/simulate-event`

Demo-only endpoint for hackathon event injection:

| `event_type` | payload | Agent Triggered |
|-------------|---------|----------------|
| `rain_event` | `{location: {lat,lng}, intensity: light\|heavy}` | WeatherAgent → RecoveryAgent |
| `crowd_spike` | `{poi_id: string, density_pct: 0–100}` | ExperienceAgent → RoutingAgent |
| `transport_delay` | `{transport_type, delay_minutes}` | RoutingAgent → RecoveryAgent |
| `budget_alert` | `{threshold_pct: 0–100}` | BudgetAgent → ExperienceAgent |
| `group_join` | `{new_user: UserProfile}` | SocialAgent → OrchestratorAgent |
| `energy_drop` | `{energy_level: 0–100}` | ExperienceAgent → RoutingAgent |

---

## 7. Performance & Quality

### 7.1 Latency Targets

| Operation | Target | Strategy |
|-----------|--------|---------|
| ADK agent chain execution | < 2,000ms P95 | Parallel branches; Gemini Flash fallback |
| Map route render update | < 500ms | Optimistic UI; animate on data arrival |
| Decision feed entry | < 200ms | Realtime DB listener; React key diff |
| Event simulation end-to-end | < 1,500ms | `min_instances: 1` on Cloud Function |
| Map rendering | 60 FPS steady-state | Hardware-accelerated canvas |
| Initial LCP | < 2,500ms | Static shell SSG; lazy-load Maps SDK |

### 7.2 Lighthouse Targets

| Metric | Target | Key Technique |
|--------|--------|---------------|
| Performance | > 85 | Code split, lazy map, image opt |
| Accessibility | > 90 | ARIA on all interactive elements, keyboard nav |
| Best Practices | > 90 | HTTPS, no console errors |
| WCAG Contrast | AA minimum | All text ≥ 4.5:1 on dark bg |

### 7.3 Failure & Fallback Matrix

| Failure | Detection | Fallback |
|---------|-----------|---------|
| ADK timeout > 3s | Cloud Function timeout catch | Return last cached route; show "Reconnecting…" in feed |
| Gemini rate limit (429) | HTTP 429 | Exponential backoff (1s, 2s, 4s); mock data after 3 retries |
| Maps API exceeded (403) | HTTP 403 | Fallback static map PNG |
| Weather API down (5xx) | Network error | Last known weather state; stale indicator |
| Firebase offline | SDK `onDisconnect` | Local Zustand state; sync on reconnect |
| GPS denied | `GeolocationPositionError` | Prompt manual city input; default to city center |

---

## 8. Security

| Requirement | Implementation | Priority |
|-------------|---------------|----------|
| API Key Protection | Gemini key only — in Google Secret Manager; never in client bundle | CRITICAL |
| Firebase Auth | Anonymous auth for session | HIGH |
| CORS Policy | Cloud Functions: allow only verified Next.js origin | HIGH |
| Input Sanitization | Zod schema validation on all API route inputs | HIGH |
| ADK Tool Safety | Tool output validated before Firestore write | MEDIUM |
| Nominatim / OSRM Usage | Respect rate limits: max 1 req/sec (Nominatim ToS) | HIGH |
| Rate Limiting | 100 req/min/session via Firebase token check | MEDIUM |
| No Paid Keys | Zero Google Maps, Zero Mapbox — fully OSS stack | CRITICAL |

---

## 9. Demo Scenario — Goa Traveler

The primary hackathon demo. Each step maps to an API call and ADK execution.

| Step | User Action | API Call | Agents | UI Update |
|------|------------|---------|--------|-----------|
| 1 | Open app; select Goa; set ₹15k budget | `POST /orchestrate {plan_route}` | Orchestrator → Routing → Budget → Experience | Map centers; route drawn; constraints populate |
| 2 | Set mood: Nightlife | `POST /orchestrate {mood_change: nightlife}` | Experience → Routing → Explainability | Route shifts to clubs; feed: "Switched to nightlife hotspots" |
| 3 | Click "Simulate Rain" | `POST /simulate-event {rain_event, Baga}` | Weather → Recovery → Routing → Budget | Red overlay on Baga; indoor reroute; feed: "Rain 82% — indoor route" |
| 4 | Friend joins group | `POST /orchestrate {group_join, preference: relaxed}` | Social → Orchestrator → Experience | Feed: "Preference conflict resolved — hybrid route" |
| 5 | Speak: "I'm tired" | `POST /orchestrate {voice_input}` | Experience (energy=30) → Routing | Energy gauge drops; low-energy spots; feed explanation |
| 6 | Click "Simulate Crowd Spike" | `POST /simulate-event {crowd_spike, tito_lane, 90}` | Experience → Routing → Explainability | Heatmap flares; rerouted to Curlies; feed: "Crowd 90%" |

> **Demo resilience:** All 6 steps have pre-seeded mock responses in `/mocks/`. If any API is unavailable, Cloud Function falls back to mock data within 200ms. UI is indistinguishable from live.

---

## 10. Testing Strategy

| Test Type | Tool | Coverage Target | Key Cases |
|-----------|------|----------------|-----------|
| Unit Tests | Jest + React Testing Library | > 70% frontend | ConstraintPanel renders correctly; DecisionFeed sorts by timestamp |
| Agent Tool Tests | pytest + ADK TestRunner | > 80% tools | `calculate_route` returns valid polyline; budget alert at 80% |
| Integration Tests | Supertest on API routes | > 60% | `POST /orchestrate` returns 200 with valid schema; Firestore write confirmed |
| E2E Demo Flow | Playwright | 6/6 demo steps | Full Goa scenario: plan → mood → rain → group → voice → crowd |
| Performance | Lighthouse CI | All targets | LCP < 2.5s, 60 FPS on map animation |
| ADK Pipeline | ADK evaluation framework | All 6 agents | OrchestratorAgent chain completes < 2s on warm function |

---

## 11. Deployment Architecture

| Component | Platform | Config | Notes |
|-----------|---------|--------|-------|
| Next.js Frontend | Firebase Hosting | `next build + export` | CDN-cached; auto-invalidate on deploy |
| ADK Agent Backend | Cloud Functions Gen 2 | Python 3.11; 4GB RAM; `min_instances: 1` | `min_instances: 1` prevents cold start during demo |
| Firestore | Firebase (us-central1) | Session-scoped security rules | Real-time listeners for decision feed |
| Firebase Realtime DB | Firebase (us-central1) | `auth.uid === session.uid` | Decision feed push channel |
| API Keys | Secret Manager | IAM: Cloud Function SA only | Never exposed to client |
| CI/CD | GitHub Actions | Auto-deploy on push to `main` | Tests → build → deploy |

---

## 12. Engineering Standards

### Code Quality

- TypeScript strict mode on all frontend files
- ESLint (airbnb-typescript) + Prettier enforced via pre-commit hook
- Python: Black formatter + mypy on all ADK agent files
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`

### Repository Structure

```
/apps/web              Next.js application
/apps/functions        Cloud Functions + ADK agents (Python)
/packages/shared-types TypeScript interfaces (frontend ↔ functions)
/tests/e2e             Playwright end-to-end
/tests/agents          pytest ADK agent unit tests
/mocks                 Pre-seeded demo fallback responses
/docs                  PRD, TRD, DESIGN.md
/.github/workflows     CI/CD pipelines
```

---

## 13. Open Technical Questions

| # | Question | Owner | Decide By |
|---|---------|-------|-----------|
| OQ-1 | Use ADK `ParallelAgent` for WeatherAgent + BudgetAgent concurrently to hit 2s target? | Backend Lead | Day 1 |
| OQ-2 | Gemini 1.5 Flash vs Pro per agent — Flash for BudgetAgent and ExplainabilityAgent? | AI Lead | Day 1 |
| OQ-3 | Real Open-Meteo weather vs fully mocked data for demo reliability? | Full Team | Day 1 |
| OQ-4 | Voice: Web Speech API (free, browser-only) vs Gemini Live API? | Frontend Lead | Day 2 |
| OQ-5 | Maps API quota: 28,500 free map loads/month — sufficient for demo + judges testing? | DevOps | Day 1 |

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **ADK** | Google Agent Development Kit — framework for building multi-agent AI systems with Gemini |
| **LlmAgent** | ADK agent class that uses Gemini for reasoning with bound `@tool` functions |
| **SequentialAgent** | ADK composition pattern — executes sub-agents in order, passes shared state |
| **OrchestratorAgent** | Root `SequentialAgent` that chains all NOMAD OPS sub-agents |
| **Decision Feed** | Real-time log of AI agent decisions rendered in the right panel |
| **ConstraintSnapshot** | Point-in-time record of all constraints: budget, weather, crowd, energy |
| **RouteObject** | Structured route: polyline, waypoints, ETA, risk score |
| **DisruptionEvent** | Simulated or real event (rain, crowd, delay) that triggers `RecoveryAgent` |
| **Mood** | User-selected travel style configuring `ExperienceAgent` ranking weights |

---

*NOMAD OPS · TRD v1.0 · PromptWars · Google Hackathon Hyderabad 2026 · Built with Google ADK*