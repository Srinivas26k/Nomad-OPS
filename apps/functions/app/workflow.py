from app.agents import (
    BudgetAgent,
    ExperienceAgent,
    ExplainabilityAgent,
    OrchestratorAgent,
    RecoveryAgent,
    RoutingAgent,
    SocialAgent,
    WeatherAgent,
)
from app.memory import session_store
from app.schemas import AgentDecision, OrchestrationRequest, OrchestrationResponse


class TravelWorkflow:
    def __init__(self) -> None:
        self.agents = [
            OrchestratorAgent(),
            WeatherAgent(),
            ExperienceAgent(),
            RecoveryAgent(),
            RoutingAgent(),
            BudgetAgent(),
            SocialAgent(),
            ExplainabilityAgent(),
        ]

    def run(self, request: OrchestrationRequest) -> OrchestrationResponse:
        session = session_store.get_or_create(request.session_id)
        decisions: list[AgentDecision] = []
        for agent in self.agents:
            decisions.extend(agent.decide(session, request))
        session_store.append_decisions(session, decisions)
        return OrchestrationResponse(session=session, decisions=decisions)


workflow = TravelWorkflow()

