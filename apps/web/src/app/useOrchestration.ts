"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Decision, Metrics } from "./types";

const WS_URL = "ws://localhost:8000/ws/stream";
const SESSION_ID = `ses_${Math.random().toString(36).slice(2, 10)}`;

export type WsStatus = "connecting" | "open" | "closed" | "error";

export function useOrchestration(initialMetrics: Metrics) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => setWsStatus("open");

    ws.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data as string) as {
          type: string;
          data: Record<string, unknown>;
        };

        if (envelope.type === "decision") {
          const d = envelope.data;
          setDecisions((prev) =>
            [
              {
                id: (d.id as string) ?? `dec_${Date.now()}`,
                agent: d.agent as string,
                trigger: d.trigger as string,
                action: d.action as string,
                outcome: d.outcome as string,
                severity: (d.severity as Decision["severity"]) ?? "info",
                timestamp: d.timestamp as string | undefined,
              },
              ...prev,
            ].slice(0, 20)
          );

          // apply any constraint updates embedded in the decision
          const cu = d.constraint_update as Record<string, unknown> | undefined;
          if (cu && Object.keys(cu).length > 0) {
            setMetrics((prev) => ({
              ...prev,
              weather: (cu.weather_risk as number | undefined) ?? prev.weather,
              crowd: (cu.crowd_density as number | undefined) ?? prev.crowd,
              energy: (cu.energy_level as number | undefined) ?? prev.energy,
              budget: (cu.budget_remaining as number | undefined) ?? prev.budget,
              transport: (cu.transport_status as string | undefined) ?? prev.transport,
            }));
          }
        }

        if (envelope.type === "session") {
          const s = envelope.data;
          const c = s.constraints as Record<string, unknown> | undefined;
          if (c) {
            setMetrics((prev) => ({
              ...prev,
              weather: (c.weather_risk as number | undefined) ?? prev.weather,
              crowd: (c.crowd_density as number | undefined) ?? prev.crowd,
              energy: (c.energy_level as number | undefined) ?? prev.energy,
              budget: (c.budget_remaining as number | undefined) ?? prev.budget,
              transport: (c.transport_status as string | undefined) ?? prev.transport,
            }));
          }
          const activeRoute = s.active_route as Record<string, unknown> | null | undefined;
          if (activeRoute) {
            setMetrics((prev) => ({
              ...prev,
              routeName: (activeRoute.name as string | undefined) ?? prev.routeName,
              eta: (activeRoute.eta_minutes as number | undefined) ?? prev.eta,
            }));
          }
        }
      } catch {
        // malformed message — ignore
      }
    };

    ws.onclose = () => {
      setWsStatus("closed");
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setWsStatus("error");
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback(
    (actionType: string, payload: Record<string, unknown>) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          session_id: SESSION_ID,
          action_type: actionType,
          payload,
        })
      );
    },
    []
  );

  const sendVoice = useCallback(
    (text: string) => send("voice_input", { text }),
    [send]
  );

  const sendMoodChange = useCallback(
    (mood: string) => send("mood_change", { mood }),
    [send]
  );

  const sendDisruption = useCallback(
    (kind: string) => send("disruption", { kind }),
    [send]
  );

  return { decisions, metrics, setMetrics, wsStatus, sendVoice, sendMoodChange, sendDisruption };
}
