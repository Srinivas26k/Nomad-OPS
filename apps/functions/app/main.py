import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.realtime import manager
from app.schemas import OrchestrationRequest
from app.workflow import workflow


settings = get_settings()
app = FastAPI(title="NOMAD OPS Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, object]:
    return {"status": "operational", "service": "nomad-ops", "model_provider": "ollama"}


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "live_tools": settings.feature_live_tools}


@app.post("/api/orchestrate")
def orchestrate(request: OrchestrationRequest):
    return workflow.run(request)


@app.post("/api/simulate-event")
def simulate_event(request: OrchestrationRequest):
    request.action_type = "disruption"
    return workflow.run(request)


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)
            request = OrchestrationRequest(
                session_id=payload.get("session_id"),
                action_type=payload.get("action_type", "voice_input"),
                payload=payload.get("payload") or {"text": payload.get("message", "")},
            )
            response = workflow.run(request)
            await manager.stream_response(websocket, response)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        await manager.send_json(
            websocket,
            {
                "type": "error",
                "data": {
                    "agent": "System",
                    "trigger": "Realtime orchestration failed",
                    "action": str(exc),
                    "outcome": "Request was not applied",
                    "severity": "critical",
                },
            },
        )
        manager.disconnect(websocket)

