import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="NOMAD OPS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
def health_check():
    return {"status": "operational", "agents_active": True}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # In a real scenario, this data triggers the Agent workflow
            # For the MVP, we echo it back as an Orchestrator decision
            payload = json.loads(data)
            
            # Simulate invoking the LangGraph agents
            await manager.broadcast(json.dumps({
                "type": "decision",
                "data": {
                    "agent": "OrchestratorAgent",
                    "trigger": f"Received event: {payload.get('event', 'unknown')}",
                    "action": "Routing request to specialized agents...",
                    "outcome": "Pending",
                    "severity": "info"
                }
            }))
            
            # Simulate delay for LLM reasoning
            await asyncio.sleep(1.5)
            
            await manager.broadcast(json.dumps({
                "type": "decision",
                "data": {
                    "agent": "RoutingAgent",
                    "trigger": "Orchestrator assigned routing task",
                    "action": "Calculating new optimal route via kimi-k2.6:cloud",
                    "outcome": "Route updated successfully",
                    "severity": "success"
                }
            }))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
