"use client";

import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

type Severity = "info" | "success" | "warning" | "critical";
type Mood = "nightlife" | "adventure" | "relaxed" | "budget" | "photography" | "social";

type Decision = {
  id: string;
  agent: string;
  trigger: string;
  action: string;
  outcome: string;
  severity: Severity;
};

type AgentRun = {
  id: string;
  name: string;
  role: string;
  task: string;
  tokens: string;
  cost: string;
  active: boolean;
  tag: string;
};

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
    agent: "OrchestratorAgent -> RoutingAgent",
    trigger: "Session initialized for Goa, India",
    action: "Generated nightlife route from Panaji through Baga and Anjuna",
    outcome: "ETA 28 min, 12.4 km, route coverage 100%",
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

const scenarios: Record<string, Decision & { updates: Partial<Metrics>; agent: string }> = {
  rain: {
    id: "dec_rain",
    agent: "WeatherAgent -> RecoveryAgent",
    trigger: "Rain probability 82% near Baga Beach",
    action: "Activated indoor recovery route via Anjuna cafe corridor",
    outcome: "Avoided 40 min delay, new ETA 22 min",
    severity: "critical",
    updates: { weather: 82, eta: 22, routeName: "Indoor recovery route" },
  },
  crowd: {
    id: "dec_crowd",
    agent: "ExperienceAgent -> RoutingAgent",
    trigger: "Crowd density crossed 90% at Tito's Lane",
    action: "Shifted stop priority to Curlies and lower-density beach roads",
    outcome: "Experience score protected, walking load unchanged",
    severity: "warning",
    updates: { crowd: 90, routeName: "Lower-density nightlife route" },
  },
  delay: {
    id: "dec_delay",
    agent: "RoutingAgent -> RecoveryAgent",
    trigger: "Transport delay detected on NH-66",
    action: "Switched transfer plan to taxi plus short walk",
    outcome: "Recovered 18 min with Rs 180 budget impact",
    severity: "warning",
    updates: { transport: "DELAYED", eta: 35 },
  },
  group: {
    id: "dec_group",
    agent: "SocialAgent -> OrchestratorAgent",
    trigger: "Friend joined with relaxed preference",
    action: "Merged nightlife and relaxed modes into a hybrid itinerary",
    outcome: "Compromise score 94%",
    severity: "info",
    updates: { group: 2, routeName: "Hybrid group route" },
  },
  energy: {
    id: "dec_energy",
    agent: "ExperienceAgent -> RoutingAgent",
    trigger: "Energy dropped to 25%",
    action: "Reduced walking distance and prioritized seated venues",
    outcome: "Comfort improved with 3 fewer km walking",
    severity: "warning",
    updates: { energy: 25, eta: 31 },
  },
  budget: {
    id: "dec_budget",
    agent: "BudgetAgent -> ExperienceAgent",
    trigger: "Budget threshold reached",
    action: "Replaced two premium venues with free-entry alternatives",
    outcome: "Saved Rs 1400, remaining Rs 2250",
    severity: "critical",
    updates: { budget: 2250 },
  },
};

type Metrics = {
  budget: number;
  weather: number;
  crowd: number;
  energy: number;
  eta: number;
  group: number;
  transport: string;
  routeName: string;
};

const moods: Mood[] = ["nightlife", "adventure", "relaxed", "budget", "photography", "social"];

function severityClass(severity: Severity) {
  return `decision decision-${severity}`;
}

function avatarInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function Home() {
  const [agents, setAgents] = useState(agentsSeed);
  const [selectedAgent, setSelectedAgent] = useState(agentsSeed[0]);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [mood, setMood] = useState<Mood>("nightlife");
  const [message, setMessage] = useState("");
  const [metrics, setMetrics] = useState<Metrics>({
    budget: 12400,
    weather: 20,
    crowd: 34,
    energy: 78,
    eta: 28,
    group: 1,
    transport: "ON TIME",
    routeName: "Nightlife operations route",
  });
  const [overlay, setOverlay] = useState("routes");

  const activeCount = agents.filter((agent) => agent.active).length;
  const latest = decisions[0];

  const routePath = useMemo(() => {
    if (metrics.weather > 70) return "M 120 440 C 280 310, 360 250, 530 230 S 770 210, 890 120";
    if (metrics.crowd > 80) return "M 120 440 C 250 370, 390 360, 520 270 S 720 250, 890 120";
    return "M 120 440 C 260 330, 360 280, 490 310 S 690 255, 890 120";
  }, [metrics.weather, metrics.crowd]);

  function activate(agentId: string) {
    setAgents((items) => items.map((agent) => ({ ...agent, active: agent.id === agentId || agent.id === "orchestrator" })));
    const next = agents.find((agent) => agent.id === agentId);
    if (next) setSelectedAgent(next);
  }

  function pushDecision(decision: Decision, updates: Partial<Metrics> = {}) {
    setDecisions((items) => [{ ...decision, id: `${decision.id}_${Date.now()}` }, ...items].slice(0, 12));
    setMetrics((current) => ({ ...current, ...updates }));
    const matched = agents.find((agent) => decision.agent.includes(agent.role));
    activate(matched?.id ?? "orchestrator");
  }

  function runScenario(key: keyof typeof scenarios) {
    const { updates, ...decision } = scenarios[key];
    pushDecision(decision, updates);
  }

  function changeMood(nextMood: Mood) {
    setMood(nextMood);
    pushDecision(
      {
        id: "dec_mood",
        agent: "ExperienceAgent -> RoutingAgent",
        trigger: `Mood changed to ${nextMood}`,
        action: "Reweighted POIs, walking load, crowd tolerance, and route priority",
        outcome: `${nextMood} route synchronized to map`,
        severity: "info",
      },
      { routeName: `${nextMood.charAt(0).toUpperCase()}${nextMood.slice(1)} adaptive route` },
    );
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const updates: Partial<Metrics> = {};
    if (lower.includes("rain")) updates.weather = 82;
    if (lower.includes("tired")) updates.energy = 25;
    if (lower.includes("budget")) updates.budget = Math.min(metrics.budget, 3200);
    pushDecision(
      {
        id: "dec_voice",
        agent: "OrchestratorAgent -> ExperienceAgent",
        trigger: `Traveler command: "${text}"`,
        action: "Parsed natural-language constraint and updated orchestration context",
        outcome: "Travel plan adapted in realtime",
        severity: Object.keys(updates).length ? "warning" : "info",
      },
      updates,
    );
    setMessage("");
  }

  return (
    <main className="shell">
      <nav className="top-nav" aria-label="Main navigation">
        <div className="brand">NOMAD OPS</div>
        <Chip color="success" variant="soft" size="sm">Status</Chip>
        <Chip variant="secondary" size="sm">Usage billing $0.0112 tracked</Chip>
        <div className="nav-tabs">
          {["Overview", "Strategy", "Agents", "Apps", "Collections", "Workspace Ops"].map((item) => (
            <button className={item === "Workspace Ops" ? "nav-tab active" : "nav-tab"} key={item}>{item}</button>
          ))}
        </div>
        <Chip color="danger" variant="soft" size="sm">3 awaiting review</Chip>
        <AgentAvatar initials="SN" size="sm" />
      </nav>

      <section className="agent-strip" aria-label="Active AI agents">
        {Array.from({ length: 42 }).map((_, index) => {
          const agent = agents[index % agents.length];
          return (
            <span className={agent.active ? "avatar-status active" : "avatar-status"} key={`${agent.id}-${index}`}>
              <AgentAvatar className="strip-avatar" initials={avatarInitials(agent.name)} size="sm" />
            </span>
          );
        })}
      </section>

      <section className="tab-row" aria-label="Workspace sections">
        {["Overview", "Strategy", "Agents 51", "Team Activity 59", "Results 59", "Inbox 0", "Autonomy", "Data Sources 6", "Calendar", "Map"].map((item) => (
          <button className={item === "Map" ? "workspace-tab selected" : "workspace-tab"} key={item}>{item}</button>
        ))}
      </section>

      <section className="workspace">
        <aside className="dispatch-panel" aria-label="Dispatch and active runs">
          <div className="panel-title-row">
            <span>DISPATCH</span>
            <Chip color="success" variant="soft" size="sm">LIVE</Chip>
          </div>
          <Button className="location-button" variant="outline">Goa, India - Panaji to Vagator</Button>
          <div className="stats-grid">
            <Metric value={activeCount} label="ON ROUTE" tone="blue" />
            <Metric value={0} label="APPROVE" tone="red" />
            <Metric value={0} label="QUEUED" tone="muted" />
            <Metric value={decisions.length} label="DELIVERED" tone="green" />
          </div>

          <div className="mood-grid">
            {moods.map((item) => (
              <Button key={item} size="sm" variant={mood === item ? "primary" : "outline"} onClick={() => changeMood(item)}>
                {item}
              </Button>
            ))}
          </div>

          <div className="section-label">CONSTRAINTS</div>
          <Constraint label="Budget" value={`Rs ${metrics.budget}`} pct={Math.round((metrics.budget / 15000) * 100)} />
          <Constraint label="Weather Risk" value={`${metrics.weather}%`} pct={metrics.weather} />
          <Constraint label="Crowd Density" value={`${metrics.crowd}%`} pct={metrics.crowd} />
          <Constraint label="Energy" value={`${metrics.energy}%`} pct={metrics.energy} />

          <div className="section-label">ACTIVE RUNS {agents.length}</div>
          <div className="agent-list">
            {agents.map((agent) => (
              <button className={selectedAgent.id === agent.id ? "agent-row selected" : "agent-row"} key={agent.id} onClick={() => { setSelectedAgent(agent); activate(agent.id); }}>
                <AgentAvatar initials={avatarInitials(agent.name)} size="sm" />
                <span className="agent-copy">
                  <span className="agent-name">{agent.name} <b>{agent.tokens}</b></span>
                  <span className="agent-task">{agent.task}</span>
                  <span className="agent-meta"><Chip size="sm" variant="soft">{agent.tag}</Chip><span>{agent.cost}</span><span>{agent.active ? "running" : "done"}</span></span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="map-panel" aria-label="Spatial intelligence map">
          <div className="map-toolbar">
            {["routes", "labels", "dependencies", "3d"].map((item) => (
              <Button key={item} size="sm" variant={overlay === item ? "primary" : "tertiary"} onClick={() => setOverlay(item)}>
                {item}
              </Button>
            ))}
          </div>
          <Chip className="clock-chip" variant="soft">15:28:19 local</Chip>
          <div className={`map-surface overlay-${overlay}`}>
            <svg className="route-layer" viewBox="0 0 1000 560" role="img" aria-label="Active adaptive travel route">
              <path className="route-alt" d="M 140 430 C 300 390, 420 180, 550 210 S 720 280, 870 160" />
              <path className="route-main" d={routePath} />
              {[
                [120, 440, "Panaji"],
                [350, 300, "Baga"],
                [520, 270, "Anjuna"],
                [720, 250, "Vagator"],
                [890, 120, "Recovery"],
              ].map(([x, y, label]) => (
                <g key={label}>
                  <circle className="route-node" cx={x} cy={y} r="7" />
                  <text x={Number(x) + 12} y={Number(y) - 8}>{label}</text>
                </g>
              ))}
            </svg>
          </div>
          <form className="chat-overlay" onSubmit={submitMessage}>
            <span>Signed in to chat with Maya in this public demo.</span>
            <input className="chat-input" value={message} onChange={(event) => setMessage(event.currentTarget.value)} placeholder="Ask to replan: I am tired and it is raining" />
            <Button type="submit" variant="primary" aria-label="Send replan command">Send</Button>
          </form>
        </section>

        <aside className="detail-panel" aria-label="Selected agent and route details">
          <div className="operator-card">
            <AgentAvatar initials={avatarInitials(selectedAgent.name)} />
            <div>
              <h2>{selectedAgent.name}</h2>
              <p>{selectedAgent.role}</p>
            </div>
          </div>
          <Chip color="success" variant="soft">DELIVERED</Chip>
          <h3>{selectedAgent.task}</h3>
          <p className="detail-copy">{latest.action}</p>
          <div className="score-grid">
            <Metric value={`${metrics.eta}s`} label="ETA - BASED ON P50" tone="muted" />
            <Metric value="100%" label="ROUTE COVERAGE" tone="green" />
          </div>
          <div className="section-label">ROUTE</div>
          <ol className="timeline">
            <li><b>PICKUP - ORIGIN</b><span>Panaji City Centre</span></li>
            <li><b>TRANSIT - {metrics.transport}</b><span>{metrics.routeName}</span></li>
            <li><b>DROPOFF - DESTINATION</b><span>Vagator Beach</span></li>
          </ol>
          <div className="section-label">AI DECISION FEED</div>
          <div className="decision-feed">
            {decisions.map((decision) => (
              <article className={severityClass(decision.severity)} key={decision.id}>
                <b>{decision.agent}</b>
                <span>{decision.trigger}</span>
                <p>{decision.action}</p>
                <small>{decision.outcome}</small>
              </article>
            ))}
          </div>
          <div className="event-grid">
            {Object.keys(scenarios).map((key) => (
              <Button key={key} size="sm" variant="outline" onClick={() => runScenario(key as keyof typeof scenarios)}>
                {key}
              </Button>
            ))}
          </div>
        </aside>
      </section>

      <footer className="review-footer">
        <Chip color="danger" size="sm">3</Chip>
        <span>Needs review</span>
      </footer>
    </main>
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

function AgentAvatar({ initials, size = "md", className = "" }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return <span className={`agent-avatar agent-avatar-${size} ${className}`}>{initials}</span>;
}

function Constraint({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="constraint">
      <div><span>{label}</span><b>{value}</b></div>
      <span className="progress-line" aria-label={label} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className={pct > 75 ? "progress-fill danger" : pct > 50 ? "progress-fill warning" : "progress-fill success"} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
