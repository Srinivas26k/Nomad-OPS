"use client";

import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { AgentRun, Decision, Metrics, Mood, RouteStop, Severity } from "./types";
import { useOrchestration } from "./useOrchestration";
import MapView from "./MapView";

// ─── Static seed data ────────────────────────────────────────────────────────

const GOA_STOPS: RouteStop[] = [
  { name: "Panaji", lat: 15.4909, lng: 73.8278, kind: "origin" },
  { name: "Baga", lat: 15.5532, lng: 73.7521, kind: "waypoint" },
  { name: "Anjuna", lat: 15.5733, lng: 73.7403, kind: "waypoint" },
  { name: "Vagator", lat: 15.5985, lng: 73.7444, kind: "destination" },
];

const agentsSeed: AgentRun[] = [
  { id: "orchestrator", name: "Maya", role: "OrchestratorAgent", task: "Coordinating all travel agents", tokens: "15.6k", cost: "$0.089", active: true, tag: "ORCH" },
  { id: "routing", name: "Rena", role: "RoutingAgent", task: "Calculating Panaji to Vagator route", tokens: "9.2k", cost: "$0.042", active: true, tag: "ROUTE" },
  { id: "weather", name: "Kanya", role: "WeatherAgent", task: "Monitoring rain risk near Baga", tokens: "4.1k", cost: "$0.011", active: false, tag: "WX" },
  { id: "budget", name: "Aina", role: "BudgetAgent", task: "Tracking Rs 15k trip budget", tokens: "3.8k", cost: "$0.009", active: false, tag: "COST" },
  { id: "experience", name: "Mateo", role: "ExperienceAgent", task: "Ranking nightlife and low-crowd POIs", tokens: "6.4k", cost: "$0.028", active: false, tag: "EXP" },
  { id: "social", name: "Priya", role: "SocialAgent", task: "Watching group preference conflicts", tokens: "2.1k", cost: "$0.005", active: false, tag: "SOC" },
  { id: "recovery", name: "Darius", role: "RecoveryAgent", task: "Standing by for disruption recovery", tokens: "1.2k", cost: "$0.003", active: false, tag: "RCV" },
  { id: "explain", name: "Amira", role: "ExplainabilityAgent", task: "Preparing judge-readable rationales", tokens: "2.8k", cost: "$0.007", active: false, tag: "WHY" },
];

const initialDecisions: Decision[] = [
  {
    id: "dec_init",
    agent: "OrchestratorAgent → RoutingAgent",
    trigger: "Session initialized for Goa, India",
    action: "Generated nightlife route from Panaji through Baga and Anjuna",
    outcome: "ETA 28 min · 12.4 km · route coverage 100%",
    severity: "success",
  },
  {
    id: "dec_weather",
    agent: "WeatherAgent",
    trigger: "Open-Meteo fallback baseline",
    action: "Weather risk held at 20%",
    outcome: "Outdoor route remains valid",
    severity: "info",
  },
];

const initialMetrics: Metrics = {
  budget: 12400,
  weather: 20,
  crowd: 34,
  energy: 78,
  eta: 28,
  group: 1,
  transport: "ON TIME",
  routeName: "Nightlife operations route",
};

const MOODS: Mood[] = ["nightlife", "adventure", "relaxed", "budget", "photography", "social"];

const SCENARIO_LABELS: Record<string, string> = {
  rain: "Rain alert",
  crowd: "Crowd surge",
  delay: "Transport delay",
  group: "Group join",
  energy: "Low energy",
  budget: "Budget limit",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function severityClass(severity: Severity) {
  return `decision decision-${severity}`;
}

function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [agents, setAgents] = useState<AgentRun[]>(agentsSeed);
  const [selectedAgent, setSelectedAgent] = useState<AgentRun>(agentsSeed[0]);
  const [localDecisions, setLocalDecisions] = useState<Decision[]>(initialDecisions);
  const [mood, setMood] = useState<Mood>("nightlife");
  const [message, setMessage] = useState("");
  const [overlay, setMpOverlay] = useState("routes");
  const [clock, setClock] = useState(now);

  // Real-time orchestration via WebSocket
  const { decisions: wsDecisions, metrics, setMetrics, wsStatus, sendVoice, sendMoodChange, sendDisruption } =
    useOrchestration(initialMetrics);

  // Merge: ws decisions take priority, local decisions as fallback
  const allDecisions = wsDecisions.length > 0
    ? [...wsDecisions, ...localDecisions].slice(0, 20)
    : localDecisions;

  const latest = allDecisions[0];
  const activeCount = agents.filter((a) => a.active).length;

  // Keep clock ticking
  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  function activateAgent(agentId: string) {
    setAgents((items) =>
      items.map((a) => ({ ...a, active: a.id === agentId || a.id === "orchestrator" }))
    );
    const next = agentsSeed.find((a) => a.id === agentId);
    if (next) setSelectedAgent(next);
  }

  function pushLocal(decision: Decision, updates: Partial<Metrics> = {}) {
    setLocalDecisions((prev) => [{ ...decision, id: `${decision.id}_${Date.now()}` }, ...prev].slice(0, 12));
    setMetrics((m) => ({ ...m, ...updates }));
    const matched = agentsSeed.find((a) => decision.agent.includes(a.role));
    activateAgent(matched?.id ?? "orchestrator");
  }

  function changeMood(nextMood: Mood) {
    setMood(nextMood);
    sendMoodChange(nextMood);
    pushLocal(
      {
        id: "dec_mood",
        agent: "ExperienceAgent → RoutingAgent",
        trigger: `Mood changed to ${nextMood}`,
        action: "Reweighted POIs, walking load, crowd tolerance, and route priority",
        outcome: `${nextMood} route synchronized to map`,
        severity: "info",
      },
      { routeName: `${nextMood.charAt(0).toUpperCase()}${nextMood.slice(1)} adaptive route` }
    );
  }

  function runScenario(key: string) {
    sendDisruption(key);
    const scenarios: Record<string, { decision: Omit<Decision, "id">; updates: Partial<Metrics> }> = {
      rain: {
        decision: { agent: "WeatherAgent → RecoveryAgent", trigger: "Rain probability 82% near Baga Beach", action: "Activated indoor recovery route via Anjuna cafe corridor", outcome: "Avoided 40 min delay, new ETA 22 min", severity: "critical" },
        updates: { weather: 82, eta: 22, routeName: "Indoor recovery route" },
      },
      crowd: {
        decision: { agent: "ExperienceAgent → RoutingAgent", trigger: "Crowd density crossed 90% at Tito's Lane", action: "Shifted stop priority to Curlies and lower-density beach roads", outcome: "Experience score protected", severity: "warning" },
        updates: { crowd: 90, routeName: "Lower-density nightlife route" },
      },
      delay: {
        decision: { agent: "RoutingAgent → RecoveryAgent", trigger: "Transport delay detected on NH-66", action: "Switched transfer plan to taxi plus short walk", outcome: "Recovered 18 min · Rs 180 budget impact", severity: "warning" },
        updates: { transport: "DELAYED", eta: 35 },
      },
      group: {
        decision: { agent: "SocialAgent → OrchestratorAgent", trigger: "Friend joined with relaxed preference", action: "Merged nightlife and relaxed modes into a hybrid itinerary", outcome: "Compromise score 94%", severity: "info" },
        updates: { group: 2, routeName: "Hybrid group route" },
      },
      energy: {
        decision: { agent: "ExperienceAgent → RoutingAgent", trigger: "Energy dropped to 25%", action: "Reduced walking distance, prioritized seated venues", outcome: "Comfort improved · 3 fewer km walking", severity: "warning" },
        updates: { energy: 25, eta: 31 },
      },
      budget: {
        decision: { agent: "BudgetAgent → ExperienceAgent", trigger: "Budget threshold reached", action: "Replaced two premium venues with free-entry alternatives", outcome: "Saved Rs 1400 · remaining Rs 2250", severity: "critical" },
        updates: { budget: 2250 },
      },
    };
    const s = scenarios[key];
    if (s) pushLocal({ id: `dec_${key}`, ...s.decision }, s.updates);
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    sendVoice(text);
    const lower = text.toLowerCase();
    const updates: Partial<Metrics> = {};
    if (lower.includes("rain")) updates.weather = 82;
    if (lower.includes("tired")) updates.energy = 25;
    if (lower.includes("budget")) updates.budget = Math.min(metrics.budget, 3200);
    pushLocal(
      {
        id: "dec_voice",
        agent: "OrchestratorAgent → ExperienceAgent",
        trigger: `Traveler: "${text}"`,
        action: "Parsed natural-language constraint, updated orchestration context",
        outcome: "Travel plan adapting in real-time",
        severity: Object.keys(updates).length ? "warning" : "info",
      },
      updates
    );
    setMessage("");
  }

  return (
    <main className="shell">
      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <nav className="top-nav" aria-label="Main navigation">
        <div className="brand">NOMAD OPS</div>
        <StatusChip online={wsStatus === "open"} />
        <span className="billing-chip">Usage billing $0.0112 tracked</span>
        <nav className="nav-tabs" aria-label="Top navigation tabs">
          {["Overview", "Strategy", "Agents", "Apps", "Collections", "Workspace Ops"].map((item) => (
            <button className={item === "Workspace Ops" ? "nav-tab active" : "nav-tab"} key={item}>{item}</button>
          ))}
        </nav>
        <span className="review-chip">3 awaiting review</span>
        <AgentAvatar initials="SN" size="sm" />
      </nav>

      {/* ── Agent strip ─────────────────────────────────────────────────── */}
      <section className="agent-strip" aria-label="Active AI agents">
        {Array.from({ length: 44 }).map((_, i) => {
          const agent = agentsSeed[i % agentsSeed.length];
          return (
            <span className={agent.active ? "avatar-status active" : "avatar-status"} key={`${agent.id}-${i}`}>
              <AgentAvatar initials={avatarInitials(agent.name)} size="sm" className="strip-avatar" />
            </span>
          );
        })}
      </section>

      {/* ── Workspace tabs ──────────────────────────────────────────────── */}
      <section className="tab-row" aria-label="Workspace sections">
        {["Overview", "Strategy", "Agents 51", "Team Activity 59", "Results 59", "Inbox 0", "Autonomy", "Data Sources 6", "Calendar", "Map"].map((item) => (
          <button className={item === "Map" ? "workspace-tab selected" : "workspace-tab"} key={item}>{item}</button>
        ))}
      </section>

      {/* ── Main workspace ──────────────────────────────────────────────── */}
      <section className="workspace">

        {/* LEFT: Dispatch panel */}
        <aside className="dispatch-panel" aria-label="Dispatch and active runs">
          <div className="panel-title-row">
            <span>DISPATCH</span>
            <Chip color="success" variant="soft" size="sm">LIVE</Chip>
          </div>

          <button className="location-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Goa, India · Panaji to Vagator
          </button>

          <div className="stats-grid">
            <Metric value={activeCount} label="ON ROUTE" tone="blue" />
            <Metric value={0} label="APPROVE" tone="red" />
            <Metric value={0} label="QUEUED" tone="muted" />
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
          <Constraint label="Budget" value={`Rs ${metrics.budget.toLocaleString()}`} pct={Math.round((metrics.budget / 15000) * 100)} />
          <Constraint label="Weather Risk" value={`${metrics.weather}%`} pct={metrics.weather} />
          <Constraint label="Crowd Density" value={`${metrics.crowd}%`} pct={metrics.crowd} />
          <Constraint label="Energy" value={`${metrics.energy}%`} pct={metrics.energy} />

          <div className="section-label">ACTIVE RUNS {agents.length}</div>
          <div className="agent-list">
            {agents.map((agent) => (
              <button
                className={selectedAgent.id === agent.id ? "agent-row selected" : "agent-row"}
                key={agent.id}
                onClick={() => { setSelectedAgent(agent); activateAgent(agent.id); }}
              >
                <AgentAvatar initials={avatarInitials(agent.name)} size="sm" />
                <span className="agent-copy">
                  <span className="agent-name">{agent.name} <b>{agent.tokens}</b></span>
                  <span className="agent-task">{agent.task}</span>
                  <span className="agent-meta">
                    <Chip size="sm" variant="soft">{agent.tag}</Chip>
                    <span className="meta-cost">{agent.cost}</span>
                    <span className={agent.active ? "run-status running" : "run-status done"}>{agent.active ? "running" : "done"}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: Real Leaflet map */}
        <section className="map-panel" aria-label="Spatial intelligence map">
          <div className="map-toolbar">
            {["routes", "labels", "dependencies", "3d"].map((item) => (
              <button
                key={item}
                className={overlay === item ? "toolbar-btn active" : "toolbar-btn"}
                onClick={() => setMpOverlay(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="clock-chip">{clock}</div>

          <div className="map-surface">
            <MapView
              stops={GOA_STOPS}
              weatherRisk={metrics.weather}
              crowdDensity={metrics.crowd}
              overlay={overlay}
            />
          </div>

          <form className="chat-overlay" onSubmit={submitMessage}>
            <span className="chat-signed">Signed in to chat with Maya · WebSocket {wsStatus}</span>
            <div className="chat-row">
              <input
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                placeholder="Ask to replan: I am tired and it is raining…"
              />
              <button type="submit" className="chat-send" aria-label="Send">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT: Agent detail + decisions */}
        <aside className="detail-panel" aria-label="Selected agent and route details">
          <div className="operator-card">
            <AgentAvatar initials={avatarInitials(selectedAgent.name)} size="md" />
            <div>
              <h2 className="operator-name">{selectedAgent.name}</h2>
              <p className="operator-role">{selectedAgent.role}</p>
            </div>
          </div>

          <Chip color="success" variant="soft" size="sm">DELIVERED</Chip>

          <h3 className="detail-task">{selectedAgent.task}</h3>
          {latest && <p className="detail-copy">{latest.action}</p>}

          <div className="score-grid">
            <Metric value={`${metrics.eta}m`} label="ETA · BASED ON P50" tone="muted" />
            <Metric value="100%" label="ROUTE COVERAGE" tone="green" />
          </div>

          <div className="section-label">ROUTE</div>
          <ol className="timeline">
            <li>
              <b>PICKUP · ORIGIN</b>
              <span>Panaji City Centre</span>
              <em>Dispatched by Maya</em>
            </li>
            <li>
              <b>TRANSIT · {metrics.transport}</b>
              <span>{metrics.routeName}</span>
            </li>
            <li>
              <b>DROPOFF · DESTINATION</b>
              <span>Vagator Beach</span>
              <em>Artifact lands in workspace library</em>
            </li>
          </ol>

          <div className="fare-meter">
            <div className="fare-row">
              <span>COST</span>
              <b className="fare-val">{selectedAgent.cost}</b>
            </div>
            <div className="fare-row">
              <span>TOKENS</span>
              <b className="fare-val token">{selectedAgent.tokens}</b>
            </div>
          </div>

          <div className="section-label">AI DECISION FEED</div>
          <div className="decision-feed">
            {allDecisions.map((d) => (
              <article className={severityClass(d.severity)} key={d.id}>
                <b>{d.agent}</b>
                <span className="decision-trigger">{d.trigger}</span>
                <p>{d.action}</p>
                <small>{d.outcome}</small>
              </article>
            ))}
          </div>

          <div className="section-label">SIMULATE EVENTS</div>
          <div className="event-grid">
            {Object.entries(SCENARIO_LABELS).map(([key, label]) => (
              <button key={key} className="event-btn" onClick={() => runScenario(key)}>
                {label}
              </button>
            ))}
          </div>
        </aside>
      </section>

      {/* ── Review footer ────────────────────────────────────────────────── */}
      <footer className="review-footer" role="status">
        <Chip color="danger" size="sm">3</Chip>
        <span>Needs review</span>
      </footer>
    </main>
  );
}

// ─── UI components ────────────────────────────────────────────────────────────

function StatusChip({ online }: { online: boolean }) {
  return (
    <span className={`status-chip ${online ? "online" : "offline"}`}>
      <span className="status-dot" />
      {online ? "Connected" : "Connecting…"}
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

function Chip({
  children,
  color = "default",
  variant = "secondary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  color?: "default" | "accent" | "success" | "warning" | "danger";
  variant?: "primary" | "secondary" | "tertiary" | "soft";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return <span className={`chip chip-${variant} chip-${color} chip-${size} ${className}`}>{children}</span>;
}

function AgentAvatar({ initials, size = "md", className = "" }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return <span className={`agent-avatar agent-avatar-${size} ${className}`}>{initials}</span>;
}

function Constraint({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="constraint">
      <div className="constraint-row">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <span
        className="progress-line"
        role="meter"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className={`progress-fill ${pct > 75 ? "danger" : pct > 50 ? "warning" : "success"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "outline";
  size?: "sm" | "md";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`} {...props}>
      {children}
    </button>
  );
}

// keep Button in scope to avoid lint error
void Button;
