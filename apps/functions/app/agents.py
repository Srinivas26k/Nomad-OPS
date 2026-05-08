from app.schemas import AgentDecision, Mood, OrchestrationRequest, SessionState, Severity
from app.tools import route_for_mood, weather_risk_for_event


class BaseAgent:
    name: str

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        raise NotImplementedError


class OrchestratorAgent(BaseAgent):
    name = "OrchestratorAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        return [
            AgentDecision(
                agent=self.name,
                trigger=f"Received {request.action_type}",
                action="Scoped session, route, constraints, and event context for specialist agents",
                outcome="Workflow boundaries established",
                severity=Severity.info,
            )
        ]


class WeatherAgent(BaseAgent):
    name = "WeatherAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        disruption = request.payload.get("disruption_type") or request.payload.get("event_type")
        risk = weather_risk_for_event(disruption)
        session.constraints.weather_risk = risk
        severity = Severity.critical if risk >= 80 else Severity.warning if risk >= 70 else Severity.info
        return [
            AgentDecision(
                agent=self.name,
                trigger="Weather risk evaluation",
                action=f"Calculated rain and disruption risk at {risk}%",
                outcome="Indoor recovery required" if risk >= 70 else "Weather remains within route tolerance",
                severity=severity,
                constraint_update={"weather_risk": risk},
            )
        ]


class RoutingAgent(BaseAgent):
    name = "RoutingAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        disruption = request.payload.get("disruption_type") or request.payload.get("event_type")
        route = route_for_mood(session.mood, disruption=disruption)
        session.active_route = route
        return [
            AgentDecision(
                agent=self.name,
                trigger=f"Route recalculation for {session.mood.value} mode",
                action=f"Selected {route.name} with ETA {route.eta_minutes} min",
                outcome=f"{route.distance_km:.1f} km route active with risk score {route.risk_score:.2f}",
                severity=Severity.success,
                route_update=route,
            )
        ]


class BudgetAgent(BaseAgent):
    name = "BudgetAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        if request.payload.get("event_type") == "budget_alert":
            session.constraints.budget_remaining = 2250
            severity = Severity.critical
            action = "Replaced premium venues with free-entry alternatives"
            outcome = "Saved Rs 1400 and preserved 2.5 hours of activity"
            saved = 1400
        else:
            severity = Severity.info
            action = "Checked route and POI budget impact"
            outcome = f"Budget remaining Rs {session.constraints.budget_remaining}"
            saved = None
        return [
            AgentDecision(
                agent=self.name,
                trigger="Budget guardrail check",
                action=action,
                outcome=outcome,
                severity=severity,
                saved_amount=saved,
                constraint_update={"budget_remaining": session.constraints.budget_remaining},
            )
        ]


class ExperienceAgent(BaseAgent):
    name = "ExperienceAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        if request.action_type == "mood_change":
            requested = request.payload.get("mood")
            if requested in Mood._value2member_map_:
                session.mood = Mood(requested)
        if request.payload.get("event_type") == "crowd_spike":
            session.constraints.crowd_density = 90
            severity = Severity.warning
            outcome = "Switched to lower-density Anjuna route"
        elif request.payload.get("event_type") == "energy_drop":
            session.constraints.energy_level = 25
            severity = Severity.warning
            outcome = "Reduced walking distance and prioritized seated venues"
        else:
            severity = Severity.info
            outcome = f"Recommendations aligned to {session.mood.value} mood"
        return [
            AgentDecision(
                agent=self.name,
                trigger="Experience fit evaluation",
                action="Ranked POIs by mood, crowd, energy, weather, and budget",
                outcome=outcome,
                severity=severity,
                constraint_update={
                    "crowd_density": session.constraints.crowd_density,
                    "energy_level": session.constraints.energy_level,
                },
            )
        ]


class SocialAgent(BaseAgent):
    name = "SocialAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        if request.action_type != "group_join" and request.payload.get("event_type") != "group_join":
            return []
        session.group_size += 1
        return [
            AgentDecision(
                agent=self.name,
                trigger="New traveler preference joined the session",
                action="Merged nightlife and relaxed preferences into a hybrid plan",
                outcome="Compromise score 94%; both preferences represented",
                severity=Severity.info,
                constraint_update={"group_size": session.group_size},
            )
        ]


class RecoveryAgent(BaseAgent):
    name = "RecoveryAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        event = request.payload.get("event_type") or request.payload.get("disruption_type")
        if event not in {"rain_event", "crowd_spike", "transport_delay", "energy_drop", "budget_alert"}:
            return []
        if event == "transport_delay":
            session.constraints.transport_status = "DELAYED"
        return [
            AgentDecision(
                agent=self.name,
                trigger=f"Disruption threshold crossed: {event}",
                action="Activated recovery protocol and requested revised route constraints",
                outcome="Route remains operational under current disruption",
                severity=Severity.warning,
                constraint_update={"transport_status": session.constraints.transport_status},
            )
        ]


class ExplainabilityAgent(BaseAgent):
    name = "ExplainabilityAgent"

    def decide(self, session: SessionState, request: OrchestrationRequest) -> list[AgentDecision]:
        return [
            AgentDecision(
                agent=self.name,
                trigger="Agent workflow completed",
                action="Generated human-readable rationale for the command center feed",
                outcome="Decision feed synchronized with map and constraints",
                severity=Severity.success,
            )
        ]
