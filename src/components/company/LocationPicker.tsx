"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useId, useRef, useState } from "react";

type GeocodeHit = {
  latitude: number;
  longitude: number;
  label: string;
};

type LocationPickerProps = {
  city: string;
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
};

const CITY_CENTERS: Record<string, [number, number]> = {
  Hyderabad: [78.4867, 17.385],
  Bengaluru: [77.5946, 12.9716],
  Pune: [73.8567, 18.5204],
  Ahmedabad: [72.5714, 23.0225],
  Gurugram: [77.0266, 28.4595],
  Noida: [77.391, 28.5355],
  Delhi: [77.209, 28.6139],
};

function centerForCity(city: string): [number, number] {
  return CITY_CENTERS[city] ?? CITY_CENTERS.Hyderabad;
}

function parseCoord(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function LocationPicker({
  city,
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const searchId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const reverseSeq = useRef(0);
  const skipSearchRef = useRef(false);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  onChangeRef.current = onChange;

  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const hasPin = lat !== null && lng !== null;

  function setMarker(map: maplibregl.Map, nextLat: number, nextLng: number) {
    const lngLat: [number, number] = [nextLng, nextLat];
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ color: "#6fad3a", draggable: true })
        .setLngLat(lngLat)
        .addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        onChangeRef.current(String(pos.lat), String(pos.lng));
        void lookupAddress(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(lngLat);
    }
  }

  async function lookupAddress(nextLat: number, nextLng: number) {
    const seq = ++reverseSeq.current;
    setHits([]);
    setLookupError(null);
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(nextLat)}&lng=${encodeURIComponent(nextLng)}`,
      );
      const data = (await response.json().catch(() => null)) as
        | { result?: GeocodeHit; error?: string }
        | null;
      if (seq !== reverseSeq.current) return;
      if (!response.ok || !data?.result) {
        setLabel(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
        setLookupError(data?.error ?? "Could not resolve address");
        return;
      }
      setLabel(data.result.label);
    } catch {
      if (seq !== reverseSeq.current) return;
      setLabel(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
      setLookupError("Could not resolve address");
    }
  }

  function applyHit(hit: GeocodeHit, fly: boolean) {
    skipSearchRef.current = true;
    setHits([]);
    setQuery(hit.label);
    setLabel(hit.label);
    setLookupError(null);
    onChangeRef.current(String(hit.latitude), String(hit.longitude));
    const map = mapRef.current;
    if (!map) return;
    setMarker(map, hit.latitude, hit.longitude);
    if (fly) {
      map.easeTo({ center: [hit.longitude, hit.latitude], zoom: 15, duration: 700 });
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    const map = new maplibregl.Map({
      container,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: centerForCity(city),
      zoom: 11.2,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.on("load", () => map.resize());

    map.on("click", (event) => {
      const { lat: clickLat, lng: clickLng } = event.lngLat;
      setMarker(map, clickLat, clickLng);
      onChangeRef.current(String(clickLat), String(clickLng));
      void lookupAddress(clickLat, clickLng);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // City is applied in a separate effect so changing the dropdown does not rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (hasPin) {
      setMarker(map, lat, lng);
      return;
    }
    markerRef.current?.remove();
    markerRef.current = null;
    setLabel(null);
    setQuery("");
    setHits([]);
  }, [hasPin, lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || hasPin) return;
    map.easeTo({ center: centerForCity(city), zoom: 11.2, duration: 600 });
  }, [city, hasPin]);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setHits([]);
      setSearching(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: trimmed, city });
        const response = await fetch(`/api/geocode/search?${params}`);
        const data = (await response.json().catch(() => null)) as
          | { results?: GeocodeHit[]; error?: string }
          | null;
        if (!response.ok) {
          setHits([]);
          setLookupError(data?.error ?? "Search failed");
          return;
        }
        setLookupError(null);
        setHits(data?.results ?? []);
      } catch {
        setHits([]);
        setLookupError("Search failed");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(handle);
  }, [query, city]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="block text-[12px] font-medium tracking-wide text-[#5b6775]" htmlFor={searchId}>
          Search location
        </label>
        <input
          id={searchId}
          className="mt-1.5 w-full rounded-xl border border-slate-900/12 bg-white px-3.5 py-2.5 text-[14px] text-[#122033] outline-none transition placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const first = hits[0];
            if (first) applyHit(first, true);
          }}
          placeholder={`Madhapur, ${city}`}
          autoComplete="off"
        />
        {hits.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-900/10 bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            {hits.map((hit) => (
              <li key={`${hit.latitude},${hit.longitude},${hit.label}`}>
                <button
                  type="button"
                  className="w-full px-3.5 py-2 text-left text-[13px] text-[#122033] hover:bg-slate-50"
                  onClick={() => applyHit(hit, true)}
                >
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {searching ? <p className="mt-1.5 text-[11px] text-[#5b6775]">Searching…</p> : null}
      </div>

      <p className="m-0 text-[13px] text-[#5b6775]">Click the map to place a pin, or drag it to adjust.</p>

      <div className="overflow-hidden rounded-2xl border border-slate-900/10">
        <div ref={containerRef} className="h-72 w-full bg-[#e8eef3]" />
      </div>

      {hasPin ? (
        <p className="m-0 text-[13px] leading-relaxed text-[#122033]">
          <span className="font-medium">{label ?? "Selected pin"}</span>
          <span className="mt-0.5 block font-mono text-[12px] text-[#5b6775]">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </p>
      ) : (
        <p className="m-0 text-[13px] text-[#5b6775]">No location selected yet.</p>
      )}
      {lookupError ? <p className="m-0 text-[12px] text-[#8a3a14]">{lookupError}</p> : null}
    </div>
  );
}
