from app.schemas import AgentDecision, SessionState


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}

    def get_or_create(self, session_id: str | None = None) -> SessionState:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        session = SessionState(session_id=session_id) if session_id else SessionState()
        self._sessions[session.session_id] = session
        return session

    def save(self, session: SessionState) -> SessionState:
        self._sessions[session.session_id] = session
        return session

    def append_decisions(self, session: SessionState, decisions: list[AgentDecision]) -> SessionState:
        session.decisions.extend(decisions)
        return self.save(session)


session_store = SessionStore()

