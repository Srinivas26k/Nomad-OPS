from pydantic import BaseModel, Field
from typing import List

class AgentDecision(BaseModel):
    agent: str
    trigger: str
    action: str
    outcome: str
    severity: str = "info" # info, warning, critical, success

class TravelState(BaseModel):
    messages: List[dict] = []
    current_location: str = "Panaji City Centre"
    destination: str = "Vagator Beach"
    budget_remaining: int = 15000
    weather_risk: int = 20
    crowd_density: int = 34
    energy_level: int = 78
    decisions: List[AgentDecision] = []
