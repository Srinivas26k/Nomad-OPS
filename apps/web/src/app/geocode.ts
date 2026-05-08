import type { RouteStop } from "./types";

async function nominatim(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "NomadOps/1.0 (travel-agent-demo)" },
    });
    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      name: data[0].display_name.split(",")[0].trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Extract a from→to route from free-form text using Nominatim geocoding.
 * Returns null if no location pattern is detected or geocoding fails.
 */
export async function parseRouteFromText(text: string): Promise<RouteStop[] | null> {
  const t = text.trim();

  // Patterns: "from X to Y", "X to Y", "I'm at/in X going to Y", "X → Y"
  const patterns = [
    /from\s+(.+?)\s+to\s+(.+)/i,
    /(?:i(?:'m| am)\s+(?:at|in|near))\s+(.+?)\s+(?:going|heading|travelling|traveling)(?:\s+to)?\s+(.+)/i,
    /(.+?)\s+(?:→|->)\s+(.+)/,
    /(.+?)\s+to\s+(.+)/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;

    const [, rawOrigin, rawDest] = m;
    const origin = rawOrigin.replace(/[?.!,]+$/, "").trim();
    const dest   = rawDest.replace(/[?.!,]+$/, "").trim();

    if (origin.split(" ").length > 6 || dest.split(" ").length > 6) continue; // too vague

    const [og, dg] = await Promise.all([nominatim(origin), nominatim(dest)]);
    if (!og || !dg) continue;

    return [
      { name: og.name, lat: og.lat, lng: og.lng, kind: "origin" },
      { name: dg.name, lat: dg.lat, lng: dg.lng, kind: "destination" },
    ];
  }

  // Single location — set as origin with no destination change
  const singlePatterns = [
    /(?:i(?:'m| am)\s+(?:at|in|near))\s+(.+)/i,
    /(?:my location is|i'm currently in|starting from)\s+(.+)/i,
  ];
  for (const re of singlePatterns) {
    const m = t.match(re);
    if (!m) continue;
    const loc = m[1].replace(/[?.!,]+$/, "").trim();
    const g = await nominatim(loc);
    if (!g) continue;
    return [{ name: g.name, lat: g.lat, lng: g.lng, kind: "origin" }];
  }

  return null;
}
