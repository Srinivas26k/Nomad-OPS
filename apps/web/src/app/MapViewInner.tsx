"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteStop } from "./types";

// OSRM public demo server — returns real road-following routes
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

type LatLng = [number, number];

async function fetchOSRMRoute(waypoints: RouteStop[]): Promise<LatLng[]> {
  const coords = waypoints.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM fetch failed");
  const data = await res.json();
  const coords2d: [number, number][] = data.routes[0].geometry.coordinates;
  // OSRM returns [lng, lat] — Leaflet needs [lat, lng]
  return coords2d.map(([lng, lat]) => [lat, lng]);
}

// alternate recovery route uses a different subset of waypoints
async function fetchAlternateRoute(waypoints: RouteStop[]): Promise<LatLng[]> {
  // skip baga, go direct panaji → anjuna → vagator for contrast
  const alt = [waypoints[0], waypoints[2], waypoints[3]];
  if (alt.some((s) => !s)) return [];
  const coords = alt.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const coords2d: [number, number][] = data.routes[0].geometry.coordinates;
  return coords2d.map(([lng, lat]) => [lat, lng]);
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [60, 60] });
    }
  }, [map, points]);
  return null;
}

const STOP_COLORS: Record<string, string> = {
  origin: "#22c55e",
  waypoint: "#3b82f6",
  destination: "#ef4444",
  recovery: "#f59e0b",
};

export default function MapViewInner({
  stops,
  weatherRisk,
  crowdDensity,
  overlay,
}: {
  stops: RouteStop[];
  weatherRisk: number;
  crowdDensity: number;
  overlay: string;
}) {
  const [mainRoute, setMainRoute] = useState<LatLng[]>([]);
  const [altRoute, setAltRoute] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true);
  const prevKey = useRef("");

  useEffect(() => {
    const key = stops.map((s) => `${s.lat},${s.lng}`).join("|");
    if (key === prevKey.current || stops.length < 2) return;
    prevKey.current = key;
    setLoading(true);
    Promise.all([fetchOSRMRoute(stops), fetchAlternateRoute(stops)])
      .then(([main, alt]) => {
        setMainRoute(main);
        setAltRoute(alt);
      })
      .finally(() => setLoading(false));
  }, [stops]);

  const center: LatLng = stops.length > 0
    ? [stops[Math.floor(stops.length / 2)].lat, stops[Math.floor(stops.length / 2)].lng]
    : [15.53, 73.78];

  // Route color shifts under high weather/crowd risk
  const mainColor = weatherRisk > 70 ? "#ef4444" : crowdDensity > 80 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        {overlay === "3d" ? (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {mainRoute.length > 1 && (
          <Polyline
            positions={mainRoute}
            pathOptions={{
              color: mainColor,
              weight: 6,
              opacity: 0.92,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {altRoute.length > 1 && (
          <Polyline
            positions={altRoute}
            pathOptions={{
              color: "#60a5fa",
              weight: 3,
              opacity: 0.7,
              dashArray: "10 12",
            }}
          />
        )}

        {stops.map((stop) => (
          <CircleMarker
            key={stop.name}
            center={[stop.lat, stop.lng]}
            radius={8}
            pathOptions={{
              color: "#111827",
              weight: 2,
              fillColor: "#fff",
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]} className="map-stop-label">
              {stop.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {mainRoute.length > 1 && <FitBounds points={mainRoute} />}
      </MapContainer>

      {loading && (
        <div className="map-route-loading">
          <span>Fetching road route…</span>
        </div>
      )}

      {overlay === "labels" && (
        <div className="map-overlay-badge">Labels active</div>
      )}
      {overlay === "dependencies" && (
        <div className="map-overlay-badge">Dependencies active</div>
      )}
      {overlay === "3d" && (
        <div className="map-overlay-badge">Topo terrain view</div>
      )}
    </div>
  );
}
