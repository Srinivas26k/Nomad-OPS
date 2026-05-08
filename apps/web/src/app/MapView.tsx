"use client";

import dynamic from "next/dynamic";
import type { RouteStop } from "./types";

const MapViewInner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <span>Loading map…</span>
    </div>
  ),
});

export default function MapView({
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
  return <MapViewInner stops={stops} weatherRisk={weatherRisk} crowdDensity={crowdDensity} overlay={overlay} />;
}
