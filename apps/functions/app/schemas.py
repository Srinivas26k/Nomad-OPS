from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
from uuid import uuid4
from pydantic import BaseModel, Field


class Mood(str, Enum):
    adventure = "adventure"
    relaxed = "relaxed"
    nightlife = "nightlife"
    budget = "budget"
    photography = "photography"
    social = "social"


class Severity(str, Enum):
    info = "info"
    success = "success"
    warning = "warning"
    critical = "critical"


class Coordinates(BaseModel):
    lat: float
    lng: float


class RouteStop(BaseModel):
    name: str
    coords: Coordinates
    kind: str


class RouteObject(BaseModel):
    id: str = Field(default_factory=lambda: f"route_{uuid4().hex[:10]}")
    name: str
    polyline: list[Coordinates]
    eta_minutes: int
    distance_km: float
    risk_score: float = Field(ge=0, le=1)
    stops: list[RouteStop]


class ConstraintSnapshot(BaseModel):
    budget_remaining: int = 12400
    weather_risk: int = Field(default=20, ge=0, le=100)
    crowd_density: int = Field(default=34, ge=0, le=100)
    energy_level: int = Field(default=78, ge=0, le=100)
    transport_status: str = "ON TIME"
    route_coverage: int = Field(default=100, ge=0, le=100)


class AgentDecision(BaseModel):
    id: str = Field(default_factory=lambda: f"dec_{uuid4().hex[:10]}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    agent: str
    trigger: str
    action: str
    outcome: str
    severity: Severity = Severity.info
    saved_amount: int | None = None
    route_update: RouteObject | None = None
    constraint_update: dict[str, Any] = Field(default_factory=dict)


class SessionState(BaseModel):
    session_id: str = Field(default_factory=lambda: f"ses_{uuid4().hex[:8]}")
    destination: str = "Goa, India"
    current_location: Coordinates = Field(default_factory=lambda: Coordinates(lat=15.4909, lng=73.8278))
    mood: Mood = Mood.nightlife
    budget_total: int = 15000
    group_size: int = 1
    active_route: RouteObject | None = None
    constraints: ConstraintSnapshot = Field(default_factory=ConstraintSnapshot)
    decisions: list[AgentDecision] = Field(default_factory=list)


ActionType = Literal["plan_route", "mood_change", "disruption", "voice_input", "group_join"]


class OrchestrationRequest(BaseModel):
    session_id: str | None = None
    action_type: ActionType = "voice_input"
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: str | None = None


class OrchestrationResponse(BaseModel):
    session: SessionState
    decisions: list[AgentDecision]
    status: Literal["success", "partial", "failed"] = "success"


class RealtimeEnvelope(BaseModel):
    type: str
    data: dict[str, Any]

