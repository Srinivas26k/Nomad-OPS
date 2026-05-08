/* =================================================================
   NOMAD OPS — script.js
   MapLibre GL + Mock Agent Pipeline + Live Decision Feed
   ================================================================= */

'use strict';

// ─────────────────────────────────────────────
// 1. GOA MOCK DATA
// ─────────────────────────────────────────────
const GOA_CENTER = [74.124, 15.2993]; // [lng, lat]

const WAYPOINTS = [
  { name: 'Panaji City Centre',  coords: [73.8278, 15.4909] },
  { name: "Tito's Lane, Baga",   coords: [73.7519, 15.5568] },
  { name: 'Curlies, Anjuna',     coords: [73.7350, 15.5738] },
  { name: 'Vagator Beach',       coords: [73.7385, 15.6013] },
];

const ROUTE_COORDS = [
  [73.8278, 15.4909],
  [73.7900, 15.5100],
  [73.7700, 15.5300],
  [73.7519, 15.5568],
  [73.7400, 15.5650],
  [73.7350, 15.5738],
  [73.7385, 15.6013],
];

const ALT_ROUTE_COORDS = [
  [73.8278, 15.4909],
  [73.8000, 15.5200],
  [73.7750, 15.5400],
  [73.7519, 15.5568],
  [73.7385, 15.6013],
];

// Pre-seeded demo decisions (mock fallback)
const DEMO_DECISIONS = [
  {
    agent: 'OrchestratorAgent → RoutingAgent',
    trigger: 'Session initialized — destination: Goa, mood: Nightlife',
    action: 'Generated optimal nightlife route: Panaji → Baga → Vagator',
    outcome: 'Route calculated · 12.4 km · ETA 28 min',
    severity: 'info',
    timestamp: null, // will be set on insert
  },
  {
    agent: 'WeatherAgent → RoutingAgent',
    trigger: 'Rain probability 82% detected near Baga Beach',
    action: 'Switched to indoor café route via Anjuna',
    outcome: 'Saved 40-min delay · budget impact: +₹120',
    severity: 'warning',
  },
  {
    agent: 'ExperienceAgent',
    trigger: 'Crowd density 90% at Tito\'s Lane',
    action: 'Rerouted to Curlies, Anjuna — crowd: 34%',
    outcome: 'Better experience score +18 pts',
    severity: 'critical',
  },
  {
    agent: 'BudgetAgent',
    trigger: 'Spend threshold 80% approaching (₹12,000 of ₹15,000)',
    action: 'Swapped 2 premium venues to free-entry alternatives',
    outcome: 'Saved ₹1,200 · remaining: ₹3,200',
    severity: 'warning',
  },
  {
    agent: 'SocialAgent → OrchestratorAgent',
    trigger: 'Friend joined — preference: relaxed vs your: nightlife',
    action: 'Hybrid itinerary: clubs until 11 PM, beach chill after',
    outcome: 'Compromise score 94% · both preferences satisfied',
    severity: 'info',
  },
];

const EVENT_SCENARIOS = {
  'evt-rain': {
    agent: 'WeatherAgent → RecoveryAgent',
    trigger: 'Simulated: Rain 82% probability at Baga Beach',
    action: 'Emergency reroute to indoor venues — Infantaria Café, Anjuna',
    outcome: 'Avoided 40-min delay · new ETA: 22 min',
    severity: 'critical',
    gaugeUpdates: { weather: 82, weatherBadge: 'HIGH', weatherBadgeClass: 'danger' },
    rerouteAlt: true,
  },
  'evt-crowd': {
    agent: 'ExperienceAgent → RoutingAgent',
    trigger: "Simulated: Crowd density 90% at Tito's Lane",
    action: 'Switching to Curlies Beach Club — crowd: 28%',
    outcome: 'Experience score preserved · ETA adjusted to 35 min',
    severity: 'warning',
    gaugeUpdates: { crowd: 90, crowdValue: '90%' },
  },
  'evt-delay': {
    agent: 'RoutingAgent → RecoveryAgent',
    trigger: 'Simulated: Bus delay 25 min on NH-66',
    action: 'Switched to auto-rickshaw + local taxi combination',
    outcome: 'Recovered 18 min · additional cost: ₹180',
    severity: 'warning',
    gaugeUpdates: { transport: 'DELAYED', transportClass: 'danger' },
  },
  'evt-group': {
    agent: 'SocialAgent → OrchestratorAgent',
    trigger: 'Simulated: Priya joined group — mood preference: relaxed',
    action: 'Negotiating hybrid plan: nightlife + beach chill split',
    outcome: 'Compromise score: 94% · hybrid route active',
    severity: 'info',
  },
  'evt-energy': {
    agent: 'ExperienceAgent → RoutingAgent',
    trigger: 'Simulated: Energy level dropped to 25%',
    action: 'Switched to low-energy venues · shorter walking distances',
    outcome: 'Route optimized for comfort · 3 fewer km walking',
    severity: 'warning',
    gaugeUpdates: { energy: 25, energyValue: '25%' },
  },
  'evt-budget': {
    agent: 'BudgetAgent → ExperienceAgent',
    trigger: 'Simulated: Budget threshold 85% reached (₹12,750 spent)',
    action: 'Replaced 2 premium venues with free alternatives',
    outcome: 'Saved ₹1,400 · 2.5 hrs of activity preserved',
    severity: 'critical',
    gaugeUpdates: { budget: 15, budgetValue: '₹2,250' },
  },
};

const AGENT_ROWS = [
  { id: 'orchestrator', name: 'OrchestratorAgent', task: 'Coordinating all sub-agents', tag: 'tag-orchestrate', tagLabel: 'ORCHESTRATE', tokens: '⚡ 15.6k', cost: '$0.089', active: true, avatarBg: '#1DB954', avatarColor: '#0F1117', initials: 'OR' },
  { id: 'routing',      name: 'RoutingAgent',      task: 'Calculating Panaji → Vagator route', tag: 'tag-routing', tagLabel: 'ROUTING', tokens: '⚡ 9.2k', cost: '$0.042', active: true, avatarBg: '#3B82F6', avatarColor: '#fff', initials: 'RO' },
  { id: 'weather',      name: 'WeatherAgent',      task: 'Monitoring Baga weather (15-min)', tag: 'tag-weather', tagLabel: 'WEATHER', tokens: '⚡ 4.1k', cost: '$0.011', active: false, avatarBg: '#8B5CF6', avatarColor: '#fff', initials: 'WX' },
  { id: 'budget',       name: 'BudgetAgent',       task: 'Budget: ₹12,400 remaining of ₹15k', tag: 'tag-budget', tagLabel: 'BUDGET', tokens: '⚡ 3.8k', cost: '$0.009', active: false, avatarBg: '#F59E0B', avatarColor: '#0F1117', initials: 'BU' },
  { id: 'experience',   name: 'ExperienceAgent',   task: 'Ranking nightlife POIs near Vagator', tag: 'tag-experience', tagLabel: 'EXPERIENCE', tokens: '⚡ 6.4k', cost: '$0.028', active: false, avatarBg: '#EC4899', avatarColor: '#fff', initials: 'EX' },
  { id: 'social',       name: 'SocialAgent',       task: 'Monitoring group preferences', tag: 'tag-social', tagLabel: 'SOCIAL', tokens: '⚡ 2.1k', cost: '$0.005', active: false, avatarBg: '#14B8A6', avatarColor: '#fff', initials: 'SO' },
  { id: 'recovery',     name: 'RecoveryAgent',     task: 'Standby — disruption threshold 0.4', tag: 'tag-recovery', tagLabel: 'RECOVERY', tokens: '⚡ 1.2k', cost: '$0.003', active: false, avatarBg: '#EF4444', avatarColor: '#fff', initials: 'RC' },
];

// ─────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────
const state = {
  decisions: [],
  decisionCount: 0,
  budgetPct: 82,
  weatherPct: 20,
  crowdPct: 34,
  energyPct: 78,
  map: null,
  activeAgent: 'orchestrator',
  sessionStart: Date.now(),
};

// ─────────────────────────────────────────────
// 3. MAP INIT
// ─────────────────────────────────────────────
function initMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/dark',
    center: [73.7519, 15.5400],
    zoom: 11.5,
    attributionControl: false,
  });

  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

  state.map = map;

  map.on('load', () => {
    drawRoutes();
    addWaypointMarkers();
    addHeatmapLayer();
  });
}

function drawRoutes() {
  const map = state.map;

  // Primary route source
  map.addSource('route-primary', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: ROUTE_COORDS },
    },
  });

  // Alt route source
  map.addSource('route-alt', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: ALT_ROUTE_COORDS },
    },
  });

  // Alt route layer (dashed, purple)
  map.addLayer({
    id: 'layer-route-alt',
    type: 'line',
    source: 'route-alt',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#A78BFA',
      'line-width': 2,
      'line-opacity': 0.5,
      'line-dasharray': [3, 3],
    },
  });

  // Primary route layer (solid green)
  map.addLayer({
    id: 'layer-route-primary',
    type: 'line',
    source: 'route-primary',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#22C55E',
      'line-width': 3.5,
      'line-opacity': 1,
    },
  });
}

function addWaypointMarkers() {
  WAYPOINTS.forEach((wp, i) => {
    const el = document.createElement('div');
    el.style.cssText = `
      width:14px; height:14px; border-radius:50%;
      background:#fff; border:2.5px solid #22C55E;
      cursor:pointer; transition:transform 0.12s;
      box-shadow: 0 0 6px rgba(34,197,94,0.5);
    `;
    el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.4)');
    el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');

    const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
      .setHTML(`<div style="font-family:DM Sans,sans-serif;font-size:12px;font-weight:600;color:#1A1D27;padding:4px 8px;">${wp.name}</div>`);

    new maplibregl.Marker({ element: el })
      .setLngLat(wp.coords)
      .setPopup(popup)
      .addTo(state.map);
  });
}

function addHeatmapLayer() {
  state.map.addSource('crowd-heat', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [73.7519, 15.5568] }, properties: { weight: 0.34 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [73.7350, 15.5738] }, properties: { weight: 0.2 } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [73.7385, 15.6013] }, properties: { weight: 0.15 } },
      ],
    },
  });

  state.map.addLayer({
    id: 'layer-crowd-heat',
    type: 'heatmap',
    source: 'crowd-heat',
    layout: { visibility: 'none' },
    paint: {
      'heatmap-weight': ['get', 'weight'],
      'heatmap-intensity': 1.5,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.2, 'rgba(59,130,246,0.4)',
        0.6, 'rgba(245,158,11,0.6)',
        1, 'rgba(239,68,68,0.8)',
      ],
      'heatmap-radius': 40,
      'heatmap-opacity': 0.7,
    },
  });
}

function animateReroute(newCoords) {
  const map = state.map;
  if (!map) return;

  // Flash the map panel
  const mapPanel = document.querySelector('.map-panel');
  mapPanel.classList.add('rerouting');
  setTimeout(() => mapPanel.classList.remove('rerouting'), 600);

  // Pulse overlay
  const pulse = document.getElementById('reroute-pulse');
  pulse.classList.remove('active');
  void pulse.offsetWidth;
  pulse.classList.add('active');
  setTimeout(() => pulse.classList.remove('active'), 1000);

  // Update route source
  const src = map.getSource('route-primary');
  if (src) {
    src.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: newCoords },
    });
  }

  // Fit bounds
  const bounds = newCoords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(newCoords[0], newCoords[0]));
  map.fitBounds(bounds, { padding: 60, duration: 800 });
}

// ─────────────────────────────────────────────
// 4. DECISION FEED
// ─────────────────────────────────────────────
function addDecision(d) {
  state.decisionCount++;
  const now = new Date();
  const ts = now.toTimeString().split(' ')[0];

  const feed = document.getElementById('decision-feed');
  const card = document.createElement('div');
  card.className = `decision-card decision-card--${d.severity}`;
  card.innerHTML = `
    <div class="dec-header">
      <span class="dec-agent">${d.agent}</span>
      <span class="dec-time mono">${ts}</span>
    </div>
    <div class="dec-trigger">${d.trigger}</div>
    <div class="dec-action">${d.action}</div>
    <div class="dec-outcome">${d.outcome}</div>
  `;
  feed.insertBefore(card, feed.firstChild);

  // Update log count badge
  document.getElementById('log-count').textContent = state.decisionCount;
  document.getElementById('review-count').textContent = Math.max(1, Math.floor(state.decisionCount * 0.5));

  // Update delivered stat
  document.getElementById('stat-delivered').textContent = state.decisionCount;

  // Update latency badge (mock)
  const latency = 280 + Math.floor(Math.random() * 200);
  document.getElementById('review-latency').textContent = `Latency: ${latency}ms`;
}

// ─────────────────────────────────────────────
// 5. AGENT LIST RENDER
// ─────────────────────────────────────────────
function renderAgentList() {
  const list = document.getElementById('agent-list');
  list.innerHTML = '';
  AGENT_ROWS.forEach(agent => {
    const row = document.createElement('div');
    row.className = `agent-row${agent.active ? ' agent-row--running' : ''}${agent.id === state.activeAgent ? ' agent-row--active' : ''}`;
    row.id = `agent-row-${agent.id}`;
    row.innerHTML = `
      <div class="agent-avatar" style="background:${agent.avatarBg};color:${agent.avatarColor}">${agent.initials}</div>
      <div class="agent-content">
        <div class="agent-row-top">
          <span class="agent-name">${agent.name}</span>
          <span class="agent-tokens mono">${agent.tokens}</span>
        </div>
        <div class="agent-task">${agent.task}</div>
        <div class="agent-meta">
          <span class="tag-pill ${agent.tag}">${agent.tagLabel}</span>
          <span class="agent-cost mono">${agent.cost}</span>
          <span class="agent-done">${agent.active ? 'RUNNING' : 'done'}</span>
        </div>
      </div>
    `;
    row.addEventListener('click', () => {
      state.activeAgent = agent.id;
      renderAgentList();
    });
    list.appendChild(row);
  });
}

// ─────────────────────────────────────────────
// 6. GAUGE UPDATERS
// ─────────────────────────────────────────────
function updateGauge(id, pct, clamp = true) {
  const el = document.getElementById(id);
  if (!el) return;
  const val = clamp ? Math.min(100, Math.max(0, pct)) : pct;
  el.style.width = val + '%';

  // Colour shift
  if (val > 75) {
    el.className = el.className.replace(/gauge-fill--\w+/, 'gauge-fill--danger');
  } else if (val > 50) {
    el.className = el.className.replace(/gauge-fill--\w+/, 'gauge-fill--warning');
  } else {
    // keep default
  }
}

function applyGaugeUpdates(updates) {
  if (!updates) return;
  if (updates.weather !== undefined) {
    updateGauge('weather-gauge', updates.weather);
    state.weatherPct = updates.weather;
  }
  if (updates.weatherBadge) {
    const b = document.getElementById('weather-badge');
    b.textContent = updates.weatherBadge;
    b.className = `constraint-badge constraint-badge--${updates.weatherBadgeClass || 'info'}`;
  }
  if (updates.crowd !== undefined) {
    updateGauge('crowd-gauge', updates.crowd);
    document.getElementById('crowd-value').textContent = (updates.crowdValue || updates.crowd + '%');
  }
  if (updates.energy !== undefined) {
    updateGauge('energy-gauge', updates.energy);
    document.getElementById('energy-value').textContent = (updates.energyValue || updates.energy + '%');
  }
  if (updates.budget !== undefined) {
    updateGauge('budget-gauge', updates.budget);
    document.getElementById('budget-value').textContent = updates.budgetValue || '';
  }
  if (updates.transport) {
    const b = document.getElementById('transport-badge');
    b.textContent = updates.transport;
    b.className = `constraint-badge constraint-badge--${updates.transportClass || 'warning'}`;
  }
}

// ─────────────────────────────────────────────
// 7. EVENT SIMULATION BUTTONS
// ─────────────────────────────────────────────
function setupEventButtons() {
  Object.entries(EVENT_SCENARIOS).forEach(([btnId, scenario]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.style.opacity = '0.5';

      setTimeout(() => {
        addDecision(scenario);
        applyGaugeUpdates(scenario.gaugeUpdates);

        if (scenario.rerouteAlt) {
          animateReroute(ALT_ROUTE_COORDS);
          document.getElementById('step-transit-name').textContent = 'Infantaria Café, Anjuna';
          document.getElementById('step-transit-sub').textContent = 'ETA 22 min · 10.1 km (Indoor)';
        }

        // Mark recovery agent as active for disruptions
        if (['evt-rain', 'evt-crowd', 'evt-delay'].includes(btnId)) {
          AGENT_ROWS.find(a => a.id === 'recovery').active = true;
          AGENT_ROWS.find(a => a.id === 'recovery').task = 'Executing recovery protocol';
          renderAgentList();
        }

        btn.disabled = false;
        btn.style.opacity = '1';
      }, 900 + Math.random() * 400);
    });
  });
}

// ─────────────────────────────────────────────
// 8. MOOD SELECTOR
// ─────────────────────────────────────────────
function setupMoodSelector() {
  document.querySelectorAll('.mood-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('mood-chip--active'));
      chip.classList.add('mood-chip--active');
      const mood = chip.dataset.mood;
      addDecision({
        agent: 'ExperienceAgent → RoutingAgent',
        trigger: `Mood changed to: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`,
        action: `Recalculating POI ranking weights for ${mood} mode`,
        outcome: 'New route suggestions generated · feed updated',
        severity: 'info',
      });
    });
  });
}

// ─────────────────────────────────────────────
// 9. MAP TOOLBAR TOGGLES
// ─────────────────────────────────────────────
function setupMapToolbar() {
  document.getElementById('btn-heat').addEventListener('click', (e) => {
    const active = e.target.getAttribute('aria-pressed') === 'true';
    e.target.setAttribute('aria-pressed', String(!active));
    e.target.classList.toggle('toolbar-btn--active', !active);
    if (state.map && state.map.getLayer('layer-crowd-heat')) {
      state.map.setLayoutProperty('layer-crowd-heat', 'visibility', active ? 'none' : 'visible');
    }
  });

  ['btn-routes', 'btn-labels', 'btn-3d'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('toolbar-btn--active');
      btn.classList.toggle('toolbar-btn--active', !wasActive);
      btn.setAttribute('aria-pressed', String(!wasActive));
    });
  });
}

// ─────────────────────────────────────────────
// 10. CLOCK & SESSION TIMER
// ─────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    document.getElementById('clock-chip').textContent = now.toTimeString().split(' ')[0];

    const elapsed = Math.floor((Date.now() - state.sessionStart) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('session-timer').textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ─────────────────────────────────────────────
// 11. CHAT / VOICE INPUT
// ─────────────────────────────────────────────
function setupChat() {
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  function handleVoice() {
    const text = input.value.trim();
    if (!text) return;
    addDecision({
      agent: 'ExperienceAgent (Voice)',
      trigger: `Voice input: "${text}"`,
      action: 'Parsing intent and updating session constraints',
      outcome: 'Route adapted to natural language preference',
      severity: 'info',
    });
    input.value = '';
  }

  send.addEventListener('click', handleVoice);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleVoice(); });
}

// ─────────────────────────────────────────────
// 12. AUTO-STREAM INITIAL DECISIONS
// ─────────────────────────────────────────────
function streamInitialDecisions() {
  DEMO_DECISIONS.forEach((d, i) => {
    setTimeout(() => addDecision(d), (i + 1) * 1200);
  });
}

// ─────────────────────────────────────────────
// 13. INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderAgentList();
  setupEventButtons();
  setupMoodSelector();
  setupMapToolbar();
  startClock();
  setupChat();

  // Stream initial decisions after map settles
  setTimeout(streamInitialDecisions, 1000);

  // Random micro-updates to feel alive
  setInterval(() => {
    // Slight crowd flicker
    const newCrowd = state.crowdPct + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4);
    state.crowdPct = Math.min(99, Math.max(5, newCrowd));
    updateGauge('crowd-gauge', state.crowdPct);
    document.getElementById('crowd-value').textContent = state.crowdPct + '%';

    // Rotate active agent
    const runners = AGENT_ROWS.filter(a => a.active);
    if (runners.length) {
      runners.forEach(a => a.active = false);
      const next = AGENT_ROWS[Math.floor(Math.random() * AGENT_ROWS.length)];
      next.active = true;
      renderAgentList();
    }
  }, 4000);
});
