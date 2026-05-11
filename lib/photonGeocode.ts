/**
 * Forward geocode (city, area, postal codes) via Photon (Komoot).
 * Suitable for mobile + web (CORS-friendly). Debounce callers to stay polite.
 */

export type LocationSuggestion = {
  id: string;
  /** One-line label for the picker */
  label: string;
  city: string;
  country: string;
};

type PhotonProps = {
  osm_id?: number;
  osm_type?: string;
  type?: string;
  name?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  county?: string;
  locality?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

type PhotonFeature = {
  properties: PhotonProps;
};

function pickCity(p: PhotonProps): string {
  const fromAdmin =
    p.city ?? p.town ?? p.village ?? p.district ?? p.locality ?? p.county ?? "";
  if (typeof fromAdmin === "string" && fromAdmin.trim()) return fromAdmin.trim();
  const t = String(p.type ?? "");
  const n = String(p.name ?? "").trim();
  if (n && (t === "city" || t === "town" || t === "village" || t === "district" || t === "locality")) return n;
  return n;
}

function buildLabel(city: string, country: string, p: PhotonProps): string {
  const name = String(p.name ?? "").trim();
  const state = String(p.state ?? "").trim();
  const pc = String(p.postcode ?? "").trim();
  const parts: string[] = [];
  if (name && name !== city) parts.push(name);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (pc && !parts.some((x) => x.includes(pc))) parts.push(pc);
  if (country) parts.push(country);
  return parts.length > 0 ? parts.join(", ") : [city, country].filter(Boolean).join(", ");
}

/**
 * Search places; works for city names, regions, and many postal codes worldwide.
 */
export async function searchPhotonLocations(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=12&lang=en`;
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  let data: { features?: PhotonFeature[] };
  try {
    data = (await res.json()) as { features?: PhotonFeature[] };
  } catch {
    return [];
  }
  const features = data.features;
  if (!Array.isArray(features)) return [];

  const seen = new Set<string>();
  const out: LocationSuggestion[] = [];

  for (const f of features) {
    const p = f.properties ?? {};
    const country = String(p.country ?? "").trim();
    let city = pickCity(p);
    if (!city && country) {
      city = String(p.name ?? "").trim();
    }
    if (!city && !country) continue;

    const dedupeKey = `${city.toLowerCase()}|${country.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const label = buildLabel(city, country, p);
    const id = `${p.osm_id ?? "x"}-${String(p.osm_type ?? "")}-${String(p.type ?? "")}-${dedupeKey}`;
    out.push({
      id,
      label: label || `${city}, ${country}`.trim(),
      city,
      country,
    });
    if (out.length >= 8) break;
  }

  return out;
}

export function composeHomeLocationLine(city: string, country: string): string {
  const c = city.trim();
  const co = country.trim();
  if (!c && !co) return "";
  if (!c) return co;
  if (!co) return c;
  return `${c}, ${co}`;
}
