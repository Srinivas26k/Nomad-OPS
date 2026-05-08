# NOMAD OPS OSS + Ollama Implementation Design

## Status

Approved direction from product conversation:

- Ollama Cloud is the only external model/API dependency that may require configuration or credentials.
- All travel, map, routing, weather, and POI services must be open, free, and no-key for hackathon viability.
- The UI must closely match the supplied Playbasis-style operational command center screenshots: dense, interactive, map-first, light enterprise, and realtime.

This spec supersedes the older Google ADK/Gemini/Firebase implementation details in `build_docs/TRD.md` where they conflict. The PRD product intent remains authoritative.

## Goals

NOMAD OPS must feel like "mission control for travel under uncertainty." The product should demonstrate an AI operations system, not a static itinerary app or a chatbot.

Evaluation alignment:

- Code quality: typed boundaries, modular services, tests, lint/build passing.
- Security: no hardcoded credentials, no paid API keys, validated inputs, scoped CORS.
- Efficiency: lightweight realtime WebSocket updates, bounded external calls, lazy map loading.
- Testing: backend unit tests and frontend build/lint checks.
- Accessibility: keyboard-friendly controls, semantic landmarks, aria labels, readable contrast.
- Problem alignment: adaptive travel orchestration, explainable decisions, route/map-first UX.
- Services: open-source/no-key geospatial services plus Ollama Cloud model provider.

## Technology Choices

Frontend:

- Next.js app in `apps/web`.
- Bun for package management.
- HeroUI for accessible UI primitives where it fits the command center controls.
- Tailwind for the design-system tokens from `build_docs/DESIGN.md`.
- Zustand for session, route, constraints, agent runs, and decision feed state.
- MapLibre GL with OpenFreeMap style URLs.
- Native WebSocket client for realtime agent events.

Backend:

- FastAPI in `apps/functions`.
- uv for Python dependency management.
- LangGraph for agent workflow orchestration.
- Ollama Cloud through a centralized provider interface.
- Pydantic schemas for all API, context, agent, tool, and realtime contracts.
- In-memory session store for the hackathon build, with a repository boundary so persistence can later move to a database without touching agents.

No-key services:

- Map rendering: MapLibre + OpenFreeMap.
- Routing: OSRM public route service.
- Geocoding: Nominatim.
- POIs: Overpass API.
- Weather: Open-Meteo.
- Voice: browser Web Speech API when available, with text input fallback.

## Backend Architecture

Target folder structure:

```text
apps/functions/
  app/
    main.py
    config.py
    logging.py
    schemas/
      agent.py
      context.py
      events.py
      realtime.py
      travel.py
    providers/
      base.py
      ollama.py
      registry.py
    context/
      engine.py
      scopes.py
    memory/
      session_store.py
    tools/
      routing.py
      weather.py
      geocoding.py
      pois.py
      budget.py
    agents/
      base.py
      orchestrator.py
      routing.py
      weather.py
      budget.py
      experience.py
      social.py
      recovery.py
      explainability.py
    workflows/
      travel_orchestration.py
    realtime/
      manager.py
    api/
      routes.py
      websocket.py
```

Root-level compatibility files may remain temporarily if needed, but production code should live under `app/`.

## Agent Contracts

Every agent receives a scoped `RuntimeContext` and returns structured decisions.

Required agents:

- `OrchestratorAgent`: classifies event intent, chooses workflow path, coordinates conflict resolution.
- `RoutingAgent`: calculates or updates routes using OSRM and route constraints.
- `WeatherAgent`: evaluates weather risk using Open-Meteo.
- `BudgetAgent`: tracks spend impact and budget risk.
- `ExperienceAgent`: ranks POIs and adapts recommendations to mood, crowd, energy, and weather.
- `SocialAgent`: merges group preferences and produces a compromise plan.
- `RecoveryAgent`: activates during disruptions and creates a revised route/plan.
- `ExplainabilityAgent`: turns structured agent outcomes into judge-friendly decision feed entries.

Agent decisions must include:

- `id`
- `timestamp`
- `agent`
- `trigger`
- `action`
- `outcome`
- `severity`
- optional `route_update`
- optional `constraint_update`
- optional `observability`

## Context Architecture

Context scopes:

- Workspace context: app configuration, enabled services, feature flags.
- Session context: destination, mood, budget, group, active route, constraints, decision log.
- Conversation context: latest user text/voice input and recent interaction history.
- Agent context: agent-specific inputs and deterministic boundaries.
- Tool context: request metadata, rate-limit hints, source service, fallback state.
- Orchestration context: workflow run id, event type, current phase, timing.

Rules:

- Agents never mutate raw global state directly.
- Tools return typed data and errors.
- Workflow applies validated updates to the session store.
- WebSocket emits structured events after each meaningful transition.

## Frontend Architecture

Target folder structure:

```text
apps/web/src/
  app/
    layout.tsx
    page.tsx
  components/
    command-center/
      TopNav.tsx
      AgentStrip.tsx
      DispatchPanel.tsx
      CommandMap.tsx
      DecisionDrawer.tsx
      ReviewFooter.tsx
      ChatOverlay.tsx
    ui/
      StatusBadge.tsx
      MetricTile.tsx
      AgentRow.tsx
      EventButton.tsx
  lib/
    env.ts
    websocket.ts
    map.ts
  store/
    session-store.ts
  types/
    orchestration.ts
```

## Interactive UI Requirements

The first screen is the product. No landing page.

The UI must match the supplied command-center references:

- Thin top navigation with workspace, status, usage, tabs, and profile.
- Horizontal agent avatar strip with active status rings.
- Left dispatch panel with location selector, live metrics, constraints, and active runs.
- Full center map as the hero surface.
- Top-center map controls for routes, labels, dependencies, and 3D mode.
- Right drawer with selected agent, route timeline, ETA, coverage, cost/tokens, and decision details.
- Bottom review footer with pending review count.
- Floating chat/replan input over the map.

Required interactions:

- Change mood and update route/decision feed.
- Trigger rain, crowd spike, transport delay, friend joins, energy drop, and budget alert.
- Send a natural-language text command.
- Receive WebSocket agent decision events.
- Update gauges, route metadata, active agent rows, and decision feed in realtime.
- Toggle map overlays.
- Select active agent rows and reflect details in the right drawer.

The implementation may start with deterministic no-key service responses and resilient fallbacks, but it must not be fake-only. Where a free service is configured and reachable, the backend should call it through typed tool modules.

## Environment Configuration

Backend example env:

```text
APP_ENV=development
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
OLLAMA_BASE_URL=
OLLAMA_API_KEY=
OLLAMA_MODEL=kimi-k2.6:cloud
OLLAMA_TIMEOUT_SECONDS=20
OSRM_BASE_URL=https://router.project-osrm.org
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OVERPASS_BASE_URL=https://overpass-api.de/api/interpreter
OPEN_METEO_BASE_URL=https://api.open-meteo.com
FEATURE_LIVE_TOOLS=true
```

Frontend example env:

```text
NEXT_PUBLIC_BACKEND_HTTP_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:8000/ws/stream
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
NEXT_PUBLIC_FEATURE_VOICE=true
```

No real secrets should be committed.

## Phased Implementation

Phase 1: Foundations

- Restructure backend into modular `app/` architecture.
- Add config, schemas, logging, provider registry, session store, realtime manager.
- Add `.env.example` files.
- Fix lint failures.
- Add minimal backend tests for schemas, session store, and workflow smoke path.

Phase 2: Agents and Tools

- Implement all required agents with typed outputs.
- Add free/no-key tool clients with timeouts, retries, and fallbacks.
- Build orchestration workflow for `plan_route`, `mood_change`, `disruption`, `voice_input`, and `group_join`.

Phase 3: Interactive Frontend

- Install/configure app-local HeroUI dependencies with Bun.
- Replace starter page with the command center.
- Add Zustand state and WebSocket client.
- Implement interactive controls and event simulator.
- Integrate MapLibre map and route overlays.

Phase 4: Realtime Integration

- Wire frontend controls to backend WebSocket/API.
- Stream agent lifecycle events and update UI live.
- Handle reconnects, errors, stale state, and fallback states.

Phase 5: Evaluation Hardening

- Run and fix backend ruff and pytest.
- Run and fix frontend lint and build.
- Add accessibility labels and keyboard behavior.
- Remove dead code and unused starter assets.
- Keep no-key policy enforced through env/config review.

## Non-Goals

- No Firebase.
- No Google Maps API key.
- No Mapbox token.
- No paid Places API.
- No production booking/payments.
- No long-term database persistence in this phase.

## Open Risk

The judge rubric mentions Google services usage. This build intentionally prioritizes hackathon no-key constraints. The mitigation is to emphasize open geospatial architecture, strong AI orchestration, and production-grade engineering quality. If later needed, the provider/service interfaces can add optional Google integrations without changing the UI or agent contracts.
