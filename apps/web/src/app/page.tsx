"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { AgentRun, Decision, Metrics, Mood, RouteStop, Severity } from "./types";
import { useOrchestration } from "./useOrchestration";
import { parseRouteFromText } from "./geocode";
import MapView from "./MapView";

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEFAULT_STOPS: RouteStop[] = [
  { name: "Panaji", lat: 15.4909, lng: 73.8278, kind: "origin" },
  { name: "Baga",   lat: 15.5532, lng: 73.7521, kind: "waypoint" },
  { name: "Anjuna", lat: 15.5733, lng: 73.7403, kind: "waypoint" },
  { name: "Vagator",lat: 15.5985, lng: 73.7444, kind: "destination" },
];

const AGENTS_SEED: AgentRun[] = [
  { id: "orchestrator", name: "Maya",  role: "OrchestratorAgent",    task: "Coordinating all travel agents",           tokens: "15.6k", cost: "$0.089", active: true,  tag: "ORCH"  },
  { id: "routing",      name: "Rena",  role: "RoutingAgent",          task: "Calculating Panaji to Vagator route",      tokens: "9.2k",  cost: "$0.042", active: true,  tag: "ROUTE" },
  { id: "weather",      name: "Kanya", role: "WeatherAgent",          task: "Monitoring rain risk near Baga",           tokens: "4.1k",  cost: "$0.011", active: false, tag: "WX"    },
  { id: "budget",       name: "Aina",  role: "BudgetAgent",           task: "Tracking Rs 15k trip budget",              tokens: "3.8k",  cost: "$0.009", active: false, tag: "COST"  },
  { id: "experience",   name: "Mateo", role: "ExperienceAgent",       task: "Ranking nightlife and low-crowd POIs",     tokens: "6.4k",  cost: "$0.028", active: false, tag: "EXP"   },
  { id: "social",       name: "Priya", role: "SocialAgent",           task: "Watching group preference conflicts",      tokens: "2.1k",  cost: "$0.005", active: false, tag: "SOC"   },
  { id: "recovery",     name: "Darius",role: "RecoveryAgent",         task: "Standing by for disruption recovery",      tokens: "1.2k",  cost: "$0.003", active: false, tag: "RCV"   },
  { id: "explain",      name: "Amira", role: "ExplainabilityAgent",   task: "Preparing judge-readable rationales",      tokens: "2.8k",  cost: "$0.007", active: false, tag: "WHY"   },
];

const SEED_DECISIONS: Decision[] = [
  { id: "dec_init",    agent: "OrchestratorAgent → RoutingAgent", trigger: "Session initialized for Goa, India",     action: "Generated nightlife route from Panaji through Baga and Anjuna",  outcome: "ETA 28 min · 12.4 km · route coverage 100%", severity: "success" },
  { id: "dec_weather", agent: "WeatherAgent",                      trigger: "Open-Meteo fallback baseline",            action: "Weather risk held at 20%",                                        outcome: "Outdoor route remains valid",                  severity: "info"    },
];

const INITIAL_METRICS: Metrics = {
  budget: 12400, weather: 20, crowd: 34, energy: 78,
  eta: 28, group: 1, transport: "ON TIME", routeName: "Nightlife operations route",
};

const MOODS: Mood[] = ["nightlife", "adventure", "relaxed", "budget", "photography", "social"];

const SCENARIOS: Record<string, { label: string; decision: Omit<Decision, "id">; updates: Partial<Metrics> }> = {
  rain:   { label: "Rain alert",       decision: { agent: "WeatherAgent → RecoveryAgent",    trigger: "Rain probability 82% near Baga Beach",       action: "Activated indoor recovery route via Anjuna cafe corridor",        outcome: "Avoided 40 min delay · new ETA 22 min",         severity: "critical" }, updates: { weather: 82, eta: 22, routeName: "Indoor recovery route" } },
  crowd:  { label: "Crowd surge",      decision: { agent: "ExperienceAgent → RoutingAgent",  trigger: "Crowd density crossed 90% at Tito's Lane",   action: "Shifted stop priority to Curlies and lower-density beach roads",  outcome: "Experience score protected",                    severity: "warning"  }, updates: { crowd: 90, routeName: "Lower-density nightlife route" } },
  delay:  { label: "Transport delay",  decision: { agent: "RoutingAgent → RecoveryAgent",    trigger: "Transport delay detected on NH-66",          action: "Switched transfer plan to taxi plus short walk",                  outcome: "Recovered 18 min · Rs 180 budget impact",      severity: "warning"  }, updates: { transport: "DELAYED", eta: 35 } },
  group:  { label: "Group join",       decision: { agent: "SocialAgent → OrchestratorAgent", trigger: "Friend joined with relaxed preference",      action: "Merged nightlife and relaxed modes into a hybrid itinerary",      outcome: "Compromise score 94%",                          severity: "info"     }, updates: { group: 2, routeName: "Hybrid group route" } },
  energy: { label: "Low energy",       decision: { agent: "ExperienceAgent → RoutingAgent",  trigger: "Energy dropped to 25%",                      action: "Reduced walking distance, prioritized seated venues",              outcome: "Comfort improved · 3 fewer km walking",         severity: "warning"  }, updates: { energy: 25, eta: 31 } },
  budget: { label: "Budget limit",     decision: { agent: "BudgetAgent → ExperienceAgent",   trigger: "Budget threshold reached",                   action: "Replaced two premium venues with free-entry alternatives",         outcome: "Saved Rs 1400 · remaining Rs 2250",             severity: "critical" }, updates: { budget: 2250 } },
};

const TAB_LABELS = ["Overview", "Strategy", "Agents 51", "Team Activity 59", "Results 59", "Inbox 0", "Autonomy", "Data Sources 6", "Calendar", "Map"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) { return name.slice(0, 2).toUpperCase(); }
function now() { return new Date().toLocaleTimeString("en-GB"); }
function severityBg(s: Severity): string {
  return s === "success" ? "var(--green)" : s === "warning" ? "var(--amber)" : s === "critical" ? "var(--red)" : "var(--blue)";
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function Home() {
  const [agents, setAgents]               = useState<AgentRun[]>(AGENTS_SEED);
  const [selectedAgent, setSelectedAgent] = useState<AgentRun>(AGENTS_SEED[0]);
  const [localDecisions, setLocalDecisions] = useState<Decision[]>(SEED_DECISIONS);
  const [mood, setMood]                   = useState<Mood>("nightlife");
  const [message, setMessage]             = useState("");
  const [overlay, setOverlay]             = useState("routes");
  const [activeTab, setActiveTab]         = useState("Map");
  const [clock, setClock]                 = useState(now);
  const [stops, setStops]                 = useState<RouteStop[]>(DEFAULT_STOPS);
  const [geocoding, setGeocoding]         = useState(false);

  const {
    decisions: wsDecisions, metrics, setMetrics,
    activeAgentId, wsStatus, sendVoice, sendMoodChange, sendDisruption,
  } = useOrchestration(INITIAL_METRICS);

  // Merge WS decisions with local seed; WS always at top
  const allDecisions = wsDecisions.length > 0
    ? [...wsDecisions, ...localDecisions].slice(0, 30)
    : localDecisions;

  const latest = allDecisions[0];
  const activeCount = agents.filter((a) => a.active).length;

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync active agent from WebSocket decisions
  useEffect(() => {
    if (!activeAgentId) return;
    setAgents((prev) =>
      prev.map((a) => ({ ...a, active: a.id === activeAgentId || a.id === "orchestrator" }))
    );
    const next = AGENTS_SEED.find((a) => a.id === activeAgentId);
    if (next) setSelectedAgent(next);
  }, [activeAgentId]);

  function pushLocal(decision: Omit<Decision, "id">, updates: Partial<Metrics> = {}) {
    setLocalDecisions((prev) =>
      [{ ...decision, id: `dec_${Date.now()}` }, ...prev].slice(0, 20)
    );
    setMetrics((m) => ({ ...m, ...updates }));
  }

  function changeMood(m: Mood) {
    setMood(m);
    sendMoodChange(m);
    pushLocal({ agent: "ExperienceAgent → RoutingAgent", trigger: `Mood changed to ${m}`, action: "Reweighted POIs, walking load, crowd tolerance, and route priority", outcome: `${m} route synchronized to map`, severity: "info" }, { routeName: `${m.charAt(0).toUpperCase()}${m.slice(1)} adaptive route` });
  }

  function runScenario(key: string) {
    const s = SCENARIOS[key];
    if (!s) return;
    sendDisruption(key);
    pushLocal({ id: `dec_${key}`, ...s.decision } as Omit<Decision, "id">, s.updates);
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage("");
    sendVoice(text);

    // Try to parse a location/route from the text
    setGeocoding(true);
    const parsed = await parseRouteFromText(text).catch(() => null);
    setGeocoding(false);

    if (parsed && parsed.length >= 2) {
      setStops(parsed);
      pushLocal({
        agent: "OrchestratorAgent → RoutingAgent",
        trigger: `Location updated from chat: "${text}"`,
        action: `New route: ${parsed.map((s) => s.name).join(" → ")}`,
        outcome: "Map and route recalculated in real-time",
        severity: "info",
      });
    } else if (parsed && parsed.length === 1) {
      setStops((prev) => [{ ...parsed[0] }, ...prev.slice(1)]);
      pushLocal({
        agent: "OrchestratorAgent",
        trigger: `Origin updated: "${parsed[0].name}"`,
        action: "Origin pin moved to detected location",
        outcome: "Route recalculated from new origin",
        severity: "info",
      });
    } else {
      // No location — treat as constraint command
      const lower = text.toLowerCase();
      const updates: Partial<Metrics> = {};
      if (lower.includes("rain"))   updates.weather = 82;
      if (lower.includes("tired"))  updates.energy  = 25;
      if (lower.includes("budget")) updates.budget  = Math.min(metrics.budget, 3200);
      pushLocal({
        agent: "OrchestratorAgent → ExperienceAgent",
        trigger: `Traveler: "${text}"`,
        action: "Parsed natural-language constraint, updated orchestration context",
        outcome: "Travel plan adapting in real-time",
        severity: Object.keys(updates).length ? "warning" : "info",
      }, updates);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="shell">
      {/* Top nav */}
      <nav className="top-nav">
        <div className="brand">NOMAD OPS</div>
        <StatusBadge wsStatus={wsStatus} />
        <span className="billing-chip">Usage billing $0.0112 tracked</span>
        <div className="nav-tabs">
          {["Overview", "Strategy", "Agents", "Apps", "Collections", "Workspace Ops"].map((item) => (
            <button key={item} className={item === "Workspace Ops" ? "nav-tab active" : "nav-tab"}>{item}</button>
          ))}
        </div>
        <span className="review-chip">3 awaiting review</span>
        <Avatar initials="SN" size="sm" />
      </nav>

      {/* Agent avatar strip */}
      <div className="agent-strip">
        {Array.from({ length: 44 }).map((_, i) => {
          const a = AGENTS_SEED[i % AGENTS_SEED.length];
          return (
            <span className={a.active ? "avatar-status active" : "avatar-status"} key={`${a.id}-${i}`}>
              <Avatar initials={initials(a.name)} size="sm" className="strip-avatar" />
            </span>
          );
        })}
      </div>

      {/* Workspace tab bar */}
      <div className="tab-row">
        {TAB_LABELS.map((label) => (
          <button
            key={label}
            className={label === activeTab ? "workspace-tab selected" : "workspace-tab"}
            onClick={() => setActiveTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main content switches by active tab */}
      <div className="workspace">
        {activeTab === "Map" && (
          <MapWorkspace
            agents={agents}
            selectedAgent={selectedAgent}
            setSelectedAgent={(a) => { setSelectedAgent(a); setAgents((prev) => prev.map((ag) => ({ ...ag, active: ag.id === a.id || ag.id === "orchestrator" }))); }}
            allDecisions={allDecisions}
            latest={latest}
            metrics={metrics}
            mood={mood}
            changeMood={changeMood}
            runScenario={runScenario}
            stops={stops}
            overlay={overlay}
            setOverlay={setOverlay}
            clock={clock}
            message={message}
            setMessage={setMessage}
            submitMessage={submitMessage}
            geocoding={geocoding}
            wsStatus={wsStatus}
            activeCount={activeCount}
          />
        )}

        {activeTab.startsWith("Overview") && (
          <OverviewView metrics={metrics} allDecisions={allDecisions} agents={agents} />
        )}

        {activeTab.startsWith("Strategy") && (
          <StrategyView stops={stops} metrics={metrics} runScenario={runScenario} />
        )}

        {activeTab.startsWith("Agents") && (
          <AgentsView agents={agents} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} allDecisions={allDecisions} />
        )}

        {activeTab.startsWith("Team Activity") && (
          <TeamActivityView allDecisions={allDecisions} />
        )}

        {!["Map", "Overview", "Strategy", "Agents 51", "Team Activity 59"].some(t => activeTab.startsWith(t.split(" ")[0])) && (
          <PlaceholderView label={activeTab} />
        )}
      </div>

      {/* Footer */}
      <footer className="review-footer">
        <Chip color="danger" size="sm">3</Chip>
        <span>Needs review</span>
      </footer>
    </main>
  );
}

// ─── Map workspace (3-column) ─────────────────────────────────────────────────

function MapWorkspace({
  agents, selectedAgent, setSelectedAgent, allDecisions, latest, metrics,
  mood, changeMood, runScenario, stops, overlay, setOverlay, clock,
  message, setMessage, submitMessage, geocoding, wsStatus, activeCount,
}: {
  agents: AgentRun[];
  selectedAgent: AgentRun;
  setSelectedAgent: (a: AgentRun) => void;
  allDecisions: Decision[];
  latest: Decision | undefined;
  metrics: Metrics;
  mood: Mood;
  changeMood: (m: Mood) => void;
  runScenario: (k: string) => void;
  stops: RouteStop[];
  overlay: string;
  setOverlay: (s: string) => void;
  clock: string;
  message: string;
  setMessage: (s: string) => void;
  submitMessage: (e: FormEvent) => void;
  geocoding: boolean;
  wsStatus: string;
  activeCount: number;
}) {
  return (
    <>
      {/* LEFT: Dispatch */}
      <aside className="dispatch-panel">
        <div className="panel-title-row">
          <span>DISPATCH</span>
          <Chip color="success" variant="soft" size="sm">LIVE</Chip>
        </div>

        <button className="location-button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {stops[0]?.name ?? "—"} → {stops[stops.length - 1]?.name ?? "—"}
        </button>

        <div className="stats-grid">
          <Metric value={activeCount} label="ON ROUTE"  tone="blue" />
          <Metric value={0}            label="APPROVE"  tone="red"  />
          <Metric value={0}            label="QUEUED"   tone="muted"/>
          <Metric value={allDecisions.length} label="DELIVERED" tone="green" />
        </div>

        <div className="mood-grid">
          {MOODS.map((m) => (
            <button key={m} className={`mood-btn${mood === m ? " active" : ""}`} onClick={() => changeMood(m)}>
              {m}
            </button>
          ))}
        </div>

        <div className="section-label">CONSTRAINTS</div>
        <Constraint label="Budget"       value={`Rs ${metrics.budget.toLocaleString()}`} pct={Math.round((metrics.budget / 15000) * 100)} />
        <Constraint label="Weather Risk" value={`${metrics.weather}%`}                   pct={metrics.weather} />
        <Constraint label="Crowd Density"value={`${metrics.crowd}%`}                     pct={metrics.crowd}   />
        <Constraint label="Energy"       value={`${metrics.energy}%`}                    pct={metrics.energy}  />

        <div className="section-label">ACTIVE RUNS {agents.length}</div>
        <div className="agent-list">
          {agents.map((a) => (
            <button
              key={a.id}
              className={selectedAgent.id === a.id ? "agent-row selected" : "agent-row"}
              onClick={() => setSelectedAgent(a)}
            >
              <Avatar initials={initials(a.name)} size="sm" />
              <span className="agent-copy">
                <span className="agent-name">{a.name} <b>{a.tokens}</b></span>
                <span className="agent-task">{a.task}</span>
                <span className="agent-meta">
                  <Chip size="sm" variant="soft">{a.tag}</Chip>
                  <span className="meta-cost">{a.cost}</span>
                  <span className={a.active ? "run-status running" : "run-status done"}>{a.active ? "running" : "done"}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER: Real Leaflet map */}
      <section className="map-panel">
        <div className="map-toolbar">
          {["routes", "labels", "dependencies", "3d"].map((item) => (
            <button key={item} className={overlay === item ? "toolbar-btn active" : "toolbar-btn"} onClick={() => setOverlay(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="clock-chip">{clock}</div>

        <div className="map-surface">
          <MapView stops={stops} weatherRisk={metrics.weather} crowdDensity={metrics.crowd} overlay={overlay} />
        </div>

        <form className="chat-overlay" onSubmit={submitMessage}>
          <span className="chat-signed">
            Signed in to chat with Maya · WebSocket {wsStatus}
            {geocoding && <span className="geocoding-badge"> · Locating…</span>}
          </span>
          <div className="chat-row">
            <input
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              placeholder='Try: "from Mumbai to Pune" or "I am tired and it is raining"'
            />
            <button type="submit" className="chat-send" aria-label="Send" disabled={!message.trim()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </form>
      </section>

      {/* RIGHT: Detail panel — full height scrollable */}
      <aside className="detail-panel">
        <div className="operator-card">
          <Avatar initials={initials(selectedAgent.name)} size="md" />
          <div>
            <div className="operator-name">{selectedAgent.name}</div>
            <div className="operator-role">{selectedAgent.role}</div>
          </div>
        </div>

        <Chip color="success" variant="soft" size="sm">DELIVERED</Chip>

        <div className="detail-task">{selectedAgent.task}</div>
        {latest && <p className="detail-copy">{latest.action}</p>}

        <div className="score-grid">
          <Metric value={`${metrics.eta}m`}  label="ETA · P50"        tone="muted" />
          <Metric value="100%"                label="ROUTE COVERAGE"   tone="green" />
        </div>

        <div className="section-label">ROUTE</div>
        <ol className="timeline">
          <li>
            <b>PICKUP · ORIGIN</b>
            <span>{stops[0]?.name ?? "—"}</span>
            <em>Dispatched by Maya</em>
          </li>
          <li>
            <b>TRANSIT · {metrics.transport}</b>
            <span>{metrics.routeName}</span>
          </li>
          <li>
            <b>DROPOFF · DESTINATION</b>
            <span>{stops[stops.length - 1]?.name ?? "—"}</span>
            <em>Artifact lands in workspace library</em>
          </li>
        </ol>

        <div className="fare-meter">
          <div className="fare-row"><span>COST</span><b className="fare-val">{selectedAgent.cost}</b></div>
          <div className="fare-row"><span>TOKENS</span><b className="fare-val token">{selectedAgent.tokens}</b></div>
        </div>

        {/* AI Decision Feed — larger, real-time */}
        <div className="section-label">AI DECISION FEED <span className="feed-count">{allDecisions.length}</span></div>
        <div className="decision-feed">
          {allDecisions.map((d) => (
            <article key={d.id} className="decision" style={{ borderLeftColor: severityBg(d.severity) }}>
              <div className="decision-header">
                <b>{d.agent}</b>
                {d.severity !== "info" && <span className="sev-dot" style={{ background: severityBg(d.severity) }} />}
              </div>
              <span className="decision-trigger">{d.trigger}</span>
              <p>{d.action}</p>
              <small>{d.outcome}</small>
            </article>
          ))}
        </div>

        <div className="section-label">SIMULATE EVENTS</div>
        <div className="event-grid">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button key={key} className="event-btn" onClick={() => runScenario(key)}>
              {s.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewView({ metrics, allDecisions, agents }: { metrics: Metrics; allDecisions: Decision[]; agents: AgentRun[] }) {
  return (
    <div className="tab-view overview-view">
      <h2 className="view-title">Mission Overview</h2>
      <div className="overview-grid">
        <MetricCard label="Budget Remaining" value={`Rs ${metrics.budget.toLocaleString()}`} sub="of Rs 15,000" color="var(--green)" />
        <MetricCard label="Weather Risk" value={`${metrics.weather}%`} sub={metrics.weather > 60 ? "High — rerouting" : "Low — outdoor safe"} color={metrics.weather > 60 ? "var(--red)" : "var(--green)"} />
        <MetricCard label="Crowd Density" value={`${metrics.crowd}%`} sub={metrics.crowd > 75 ? "Dense — avoid Tito's" : "Manageable"} color={metrics.crowd > 75 ? "var(--amber)" : "var(--green)"} />
        <MetricCard label="Energy Level" value={`${metrics.energy}%`} sub={metrics.energy < 30 ? "Low — rest stop needed" : "Good"} color={metrics.energy < 30 ? "var(--amber)" : "var(--green)"} />
        <MetricCard label="ETA" value={`${metrics.eta} min`} sub={metrics.transport} color="var(--blue)" />
        <MetricCard label="Group Size" value={String(metrics.group)} sub="travelers" color="var(--text-secondary)" />
      </div>

      <h3 className="view-subtitle">Agent Status</h3>
      <div className="agent-grid">
        {agents.map((a) => (
          <div key={a.id} className={`agent-card${a.active ? " active" : ""}`}>
            <div className="agent-card-top">
              <Avatar initials={initials(a.name)} size="md" />
              <div>
                <div className="agent-card-name">{a.name}</div>
                <div className="agent-card-role">{a.role}</div>
              </div>
              <span className={a.active ? "run-pill running" : "run-pill done"}>{a.active ? "Live" : "Done"}</span>
            </div>
            <p className="agent-card-task">{a.task}</p>
            <div className="agent-card-meta">
              <span><b>{a.tokens}</b> tokens</span>
              <span><b>{a.cost}</b></span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="view-subtitle">Recent Decisions</h3>
      <div className="full-feed">
        {allDecisions.slice(0, 10).map((d) => (
          <article key={d.id} className="decision" style={{ borderLeftColor: severityBg(d.severity) }}>
            <div className="decision-header"><b>{d.agent}</b></div>
            <span className="decision-trigger">{d.trigger}</span>
            <p>{d.action}</p>
            <small>{d.outcome}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Strategy tab ─────────────────────────────────────────────────────────────

function StrategyView({ stops, metrics, runScenario }: { stops: RouteStop[]; metrics: Metrics; runScenario: (k: string) => void }) {
  return (
    <div className="tab-view strategy-view">
      <h2 className="view-title">Route Strategy</h2>

      <div className="strategy-grid">
        <div className="strategy-card">
          <div className="strategy-card-title">Active Route</div>
          <div className="route-stops">
            {stops.map((s, i) => (
              <div key={s.name} className="route-stop-row">
                <div className="stop-dot" style={{ background: i === 0 ? "var(--green)" : i === stops.length - 1 ? "var(--red)" : "var(--blue)" }} />
                <div>
                  <div className="stop-name">{s.name}</div>
                  <div className="stop-coords">{s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E</div>
                </div>
                <span className="stop-kind">{s.kind}</span>
              </div>
            ))}
          </div>
          <div className="route-meta">
            <span>ETA <b>{metrics.eta} min</b></span>
            <span>Transport <b>{metrics.transport}</b></span>
            <span>Route <b>{metrics.routeName}</b></span>
          </div>
        </div>

        <div className="strategy-card">
          <div className="strategy-card-title">Constraint Snapshot</div>
          <Constraint label="Budget Remaining" value={`Rs ${metrics.budget.toLocaleString()}`} pct={Math.round((metrics.budget / 15000) * 100)} />
          <Constraint label="Weather Risk"      value={`${metrics.weather}%`}                   pct={metrics.weather} />
          <Constraint label="Crowd Density"     value={`${metrics.crowd}%`}                     pct={metrics.crowd}   />
          <Constraint label="Energy"            value={`${metrics.energy}%`}                    pct={metrics.energy}  />
        </div>

        <div className="strategy-card wide">
          <div className="strategy-card-title">Simulate Disruptions</div>
          <p className="strategy-hint">Trigger a scenario to see how the agent network responds and re-plans the route in real time.</p>
          <div className="scenario-grid">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button key={key} className="scenario-btn" onClick={() => runScenario(key)}>
                <span className="scenario-label">{s.label}</span>
                <span className="scenario-desc">{s.decision.trigger}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agents tab ───────────────────────────────────────────────────────────────

function AgentsView({ agents, selectedAgent, setSelectedAgent, allDecisions }: {
  agents: AgentRun[];
  selectedAgent: AgentRun;
  setSelectedAgent: (a: AgentRun) => void;
  allDecisions: Decision[];
}) {
  return (
    <div className="tab-view agents-view">
      <h2 className="view-title">Agent Network <span className="view-count">{agents.length} agents</span></h2>
      <div className="agents-layout">
        <div className="agents-grid">
          {agents.map((a) => (
            <button
              key={a.id}
              className={`agent-card clickable${selectedAgent.id === a.id ? " selected" : ""}${a.active ? " active" : ""}`}
              onClick={() => setSelectedAgent(a)}
            >
              <div className="agent-card-top">
                <Avatar initials={initials(a.name)} size="md" />
                <div>
                  <div className="agent-card-name">{a.name}</div>
                  <div className="agent-card-role">{a.role}</div>
                </div>
                <span className={a.active ? "run-pill running" : "run-pill done"}>{a.active ? "Live" : "Done"}</span>
              </div>
              <p className="agent-card-task">{a.task}</p>
              <div className="agent-card-meta">
                <Chip size="sm" variant="soft">{a.tag}</Chip>
                <span>{a.tokens} tokens</span>
                <span>{a.cost}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="agents-detail">
          <div className="view-subtitle">{selectedAgent.name} · Decision History</div>
          <div className="full-feed">
            {allDecisions
              .filter((d) => d.agent.includes(selectedAgent.role.replace("Agent", "")))
              .concat(allDecisions.filter((d) => !d.agent.includes(selectedAgent.role.replace("Agent", ""))))
              .slice(0, 15)
              .map((d) => (
                <article key={d.id} className="decision" style={{ borderLeftColor: severityBg(d.severity) }}>
                  <div className="decision-header"><b>{d.agent}</b></div>
                  <span className="decision-trigger">{d.trigger}</span>
                  <p>{d.action}</p>
                  <small>{d.outcome}</small>
                </article>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Activity tab ────────────────────────────────────────────────────────

function TeamActivityView({ allDecisions }: { allDecisions: Decision[] }) {
  return (
    <div className="tab-view team-view">
      <h2 className="view-title">Team Activity <span className="view-count">{allDecisions.length} events</span></h2>
      <div className="full-feed wide">
        {allDecisions.map((d) => (
          <article key={d.id} className="decision activity-row" style={{ borderLeftColor: severityBg(d.severity) }}>
            <div className="activity-sev" style={{ background: severityBg(d.severity) }}>{d.severity}</div>
            <div className="activity-body">
              <div className="decision-header"><b>{d.agent}</b></div>
              <span className="decision-trigger">{d.trigger}</span>
              <p>{d.action}</p>
              <small>{d.outcome}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Placeholder tab ──────────────────────────────────────────────────────────

function PlaceholderView({ label }: { label: string }) {
  return (
    <div className="tab-view placeholder-view">
      <div className="placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
      </div>
      <div className="placeholder-label">{label}</div>
      <p className="placeholder-sub">This workspace is being set up. Switch to the Map tab to see live orchestration.</p>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function StatusBadge({ wsStatus }: { wsStatus: string }) {
  const online = wsStatus === "open";
  return (
    <span className={`status-chip ${online ? "online" : "offline"}`}>
      <span className="status-dot" />
      {online ? "Connected" : wsStatus === "connecting" ? "Connecting…" : "Reconnecting…"}
    </span>
  );
}

function Metric({ value, label, tone }: { value: string | number; label: string; tone: string }) {
  return (
    <div className={`metric metric-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value" style={{ color }}>{value}</div>
      <div className="metric-card-sub">{sub}</div>
    </div>
  );
}

function Chip({
  children, color = "default", variant = "secondary", size = "md", className = "",
}: { children: ReactNode; color?: string; variant?: string; size?: string; className?: string }) {
  return <span className={`chip chip-${variant} chip-${color} chip-${size} ${className}`}>{children}</span>;
}

function Avatar({ initials, size = "md", className = "" }: { initials: string; size?: string; className?: string }) {
  return <span className={`agent-avatar agent-avatar-${size} ${className}`}>{initials}</span>;
}

function Constraint({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="constraint">
      <div className="constraint-row"><span>{label}</span><b>{value}</b></div>
      <span className="progress-line" role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className={`progress-fill ${pct > 75 ? "danger" : pct > 50 ? "warning" : "success"}`} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
