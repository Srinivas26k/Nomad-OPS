from typing import Annotated, Sequence, TypedDict
import operator
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, END
from models import AgentDecision

# Define the state graph dictionary
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    decisions: Annotated[list, operator.add]

# Initialize Ollama model with requested model
llm = ChatOllama(model="kimi-k2.6:cloud", temperature=0)

def orchestrator_node(state: AgentState):
    sys_prompt = "You are the OrchestratorAgent. Analyze the user's situation. Which specialist agent should handle this? Output ONLY one word: ROUTING, WEATHER, BUDGET, EXPERIENCE, or DONE."
    
    response = llm.invoke([SystemMessage(content=sys_prompt)] + list(state["messages"]))
    decision_text = response.content.strip().upper()
    
    new_decision = AgentDecision(
        agent="OrchestratorAgent",
        trigger="Evaluated user request",
        action=f"Delegating to {decision_text} agent",
        outcome="Routed task successfully",
        severity="info"
    )
    
    return {"messages": [response], "decisions": [new_decision]}

def routing_node(state: AgentState):
    sys_prompt = "You are the RoutingAgent. Provide a concise route adjustment to avoid obstacles."
    response = llm.invoke([SystemMessage(content=sys_prompt)] + list(state["messages"]))
    
    new_decision = AgentDecision(
        agent="RoutingAgent",
        trigger="Orchestrator delegated routing",
        action=response.content[:80] + "...",
        outcome="Route recalculated safely",
        severity="success"
    )
    return {"messages": [response], "decisions": [new_decision]}

def weather_node(state: AgentState):
    sys_prompt = "You are the WeatherAgent. Provide a quick weather mitigation strategy."
    response = llm.invoke([SystemMessage(content=sys_prompt)] + list(state["messages"]))
    
    new_decision = AgentDecision(
        agent="WeatherAgent",
        trigger="Weather disruption simulated",
        action=response.content[:80] + "...",
        outcome="Switched to indoor routing",
        severity="warning"
    )
    return {"messages": [response], "decisions": [new_decision]}

# Build the LangGraph Orchestrator
workflow = StateGraph(AgentState)

workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("routing", routing_node)
workflow.add_node("weather", weather_node)

workflow.set_entry_point("orchestrator")

def route_next(state: AgentState):
    last_msg = state["messages"][-1].content.upper()
    if "ROUTING" in last_msg:
        return "routing"
    elif "WEATHER" in last_msg:
        return "weather"
    return END

workflow.add_conditional_edges("orchestrator", route_next, {
    "routing": "routing", 
    "weather": "weather", 
    END: END
})
workflow.add_edge("routing", END)
workflow.add_edge("weather", END)

app_graph = workflow.compile()
