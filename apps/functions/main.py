import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_core.messages import HumanMessage
from agents import app_graph

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
            payload = json.loads(data)
            user_input = payload.get("message", "")
            
            if not user_input:
                continue

            # Stream Orchestrator starting
            await manager.broadcast(json.dumps({
                "type": "decision",
                "data": {
                    "agent": "System",
                    "trigger": "Input received",
                    "action": "Starting Orchestrator flow...",
                    "outcome": "Pending",
                    "severity": "info"
                }
            }))

            # Execute LangGraph asynchronously
            # Note: For production, this should run in a threadpool to not block the async event loop
            try:
                state_input = {"messages": [HumanMessage(content=user_input)], "decisions": []}
                # Invoke graph synchronously for demo purposes
                final_state = app_graph.invoke(state_input)
                
                # Stream the decisions back to the UI
                for decision in final_state.get("decisions", []):
                    await manager.broadcast(json.dumps({
                        "type": "decision",
                        "data": decision.dict()
                    }))
            except Exception as e:
                await manager.broadcast(json.dumps({
                    "type": "decision",
                    "data": {
                        "agent": "ErrorAgent",
                        "trigger": "Graph execution failed",
                        "action": str(e),
                        "outcome": "Failed",
                        "severity": "critical"
                    }
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
