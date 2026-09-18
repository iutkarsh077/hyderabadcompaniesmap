import { getContactEmail, getSiteUrl, SITE_NAME } from "@/lib/site";

const NOMINATIM_ORIGIN = "https://nominatim.openstreetmap.org";
const MIN_INTERVAL_MS = 1100;

export type GeocodeHit = {
  latitude: number;
  longitude: number;
  label: string;
};

type NominatimItem = {
  lat?: unknown;
  lon?: unknown;
  display_name?: unknown;
};

let lastNominatimAt = 0;

function nominatimHeaders() {
  const email = getContactEmail();
  const site = getSiteUrl();
  const contact = email || site;
  return {
    Accept: "application/json",
    "User-Agent": `${SITE_NAME}/1.0 (${contact})`,
  };
}

async function nominatimGet(path: string, params: Record<string, string>) {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastNominatimAt));
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimAt = Date.now();

  const url = new URL(path, NOMINATIM_ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: nominatimHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }
  return response.json();
}

function toHit(item: NominatimItem): GeocodeHit | null {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  const label = typeof item.display_name === "string" ? item.display_name.trim() : "";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !label) return null;
  return { latitude, longitude, label };
}

export async function searchPlaces(query: string, city?: string): Promise<GeocodeHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const cityName = city?.trim() ?? "";
  const q =
    cityName && !trimmed.toLowerCase().includes(cityName.toLowerCase())
      ? `${trimmed} ${cityName}`
      : trimmed;

  const data = (await nominatimGet("/search", {
    q,
    format: "json",
    limit: "6",
    countrycodes: "in",
    addressdetails: "0",
  })) as unknown;

  if (!Array.isArray(data)) return [];
  return data
    .map((item) => toHit(item as NominatimItem))
    .filter((hit): hit is GeocodeHit => hit !== null);
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeHit | null> {
  const data = (await nominatimGet("/reverse", {
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    zoom: "16",
    addressdetails: "0",
  })) as NominatimItem;

  const hit = toHit(data);
  if (hit) return hit;
  return {
    latitude,
    longitude,
    label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}
