import json
from fastapi import WebSocket
from app.schemas import AgentDecision, OrchestrationResponse


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, payload: dict) -> None:
        await websocket.send_text(json.dumps(payload))

    async def stream_response(self, websocket: WebSocket, response: OrchestrationResponse) -> None:
        await self.send_json(websocket, {"type": "session", "data": response.session.model_dump(mode="json")})
        for decision in response.decisions:
            await self.send_decision(websocket, decision)

    async def send_decision(self, websocket: WebSocket, decision: AgentDecision) -> None:
        await self.send_json(websocket, {"type": "decision", "data": decision.model_dump(mode="json")})


manager = ConnectionManager()

