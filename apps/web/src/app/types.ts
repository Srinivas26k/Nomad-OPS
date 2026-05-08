export type Severity = "info" | "success" | "warning" | "critical";
export type Mood = "nightlife" | "adventure" | "relaxed" | "budget" | "photography" | "social";

export type RouteStop = {
  name: string;
  lat: number;
  lng: number;
  kind: "origin" | "waypoint" | "destination" | "recovery";
};

export type Decision = {
  id: string;
  agent: string;
  trigger: string;
  action: string;
  outcome: string;
  severity: Severity;
  timestamp?: string;
};

export type AgentRun = {
  id: string;
  name: string;
  role: string;
  task: string;
  tokens: string;
  cost: string;
  active: boolean;
  tag: string;
};

export type Metrics = {
  budget: number;
  weather: number;
  crowd: number;
  energy: number;
  eta: number;
  group: number;
  transport: string;
  routeName: string;
};
