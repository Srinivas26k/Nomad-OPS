# NOMAD OPS Design Specification

## Overview
NOMAD OPS is an autonomous AI-powered travel operations engine. This specification details the "Zero API Key" architecture utilizing open-source models, modern package managers, and free mapping solutions. 

## 1. Frontend Architecture
* **Framework:** Next.js 14 (App Router)
* **Package Manager:** `bun` for fast dependency resolution.
* **UI Components:** **HeroUI** (formerly NextUI) will be used for all primary components (Avatars with real images, Badges, Accordions, Buttons) to ensure a high-end enterprise aesthetic.
* **Styling:** TailwindCSS matching the **v2.0 Light Theme** (bright neutral canvas, soft grey panels, minimalistic borders).
* **Map:** MapLibre GL JS utilizing OpenFreeMap (no API keys required).
* **State Management:** Zustand for local state.
* **Real-time Comms:** Native WebSockets to receive live agent orchestration feeds from the backend (replacing Firebase).

## 2. Backend Architecture
* **Framework:** FastAPI running on Python 3.11.
* **Package Manager:** `uv` for lightning-fast Python virtual environment and dependency management.
* **Real-time Comms:** FastAPI WebSocket endpoints to stream the AI decision logs to the frontend asynchronously.
* **State:** In-memory session dictionaries (MVP-friendly, avoids needing any database credentials).

## 3. AI Agent Orchestration
* **Framework:** **LangChain / LangGraph** will serve as the mandatory multi-agent orchestration framework.
* **LLM Model:** **Ollama** using the `kimi-k2.6:cloud` model as explicitly requested.
* **Agents:** 
  * `OrchestratorAgent`: LangGraph supervisor node that routes tasks.
  * `RoutingAgent`, `WeatherAgent`, `BudgetAgent`, `ExperienceAgent`: Worker nodes managed by the supervisor, utilizing the `ollama` chat bindings in LangChain.
* **No Paid APIs:** Tools will be mocked or use completely free endpoints (like Open-Meteo or Nominatim) to ensure no API keys are required.

## 4. Workflows & Data Flow
1. User interacts with the Next.js UI (e.g., changes "Mood" or clicks a "Simulate Rain" button).
2. Frontend sends a WebSocket message to FastAPI.
3. FastAPI invokes the LangGraph orchestrator.
4. LangGraph agents coordinate, reasoning with `kimi-k2.6:cloud` via Ollama.
5. As agents reach decisions, FastAPI streams these log events back via WebSocket.
6. Frontend updates the HeroUI decision feed and MapLibre map immediately.
