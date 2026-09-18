"use client";

import { useEffect, useId, useRef, useState } from "react";

type GeocodeHit = {
  latitude: number;
  longitude: number;
  label: string;
};

type GoToCoordsBoxProps = {
  city: string;
  onGo: (latitude: number, longitude: number) => void;
};

export default function GoToCoordsBox({ city, onGo }: GoToCoordsBoxProps) {
  const searchId = useId();
  const skipSearchRef = useRef(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToHit(hit: GeocodeHit) {
    skipSearchRef.current = true;
    setHits([]);
    setQuery(hit.label);
    setError(null);
    onGo(hit.latitude, hit.longitude);
  }

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
          setError(data?.error ?? "Search failed");
          return;
        }
        setError(null);
        setHits(data?.results ?? []);
      } catch {
        setHits([]);
        setError("Search failed");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(handle);
  }, [query, city]);

  return (
    <div
      className="relative flex w-full flex-col gap-2 rounded-2xl border border-slate-900/10 bg-white/90 px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"
      aria-label="Search location"
    >
      <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
        Search location
      </p>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={searchId}>
          Location
        </label>
        <input
          id={searchId}
          className="min-w-0 flex-1 rounded-lg border border-slate-900/12 bg-white px-2.5 py-1.5 text-[12px] text-[#122033] outline-none placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const first = hits[0];
            if (first) goToHit(first);
          }}
          placeholder="Neighbourhood or area"
          autoComplete="off"
        />
        <button
          type="button"
          className="shrink-0 rounded-lg bg-[#122033] px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1a2d44]"
          onClick={() => {
            const first = hits[0];
            if (first) goToHit(first);
            else if (!searching && query.trim().length >= 2) setError("No matching place");
          }}
        >
          Go
        </button>
      </div>
      {searching ? <p className="m-0 text-[11px] text-[#5b6775]">Searching…</p> : null}
      {error ? <p className="m-0 text-[11px] text-[#8a3a14]">{error}</p> : null}
      {hits.length > 0 ? (
        <ul className="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-900/10 bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          {hits.map((hit) => (
            <li key={`${hit.latitude},${hit.longitude},${hit.label}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[12px] text-[#122033] hover:bg-slate-50"
                onClick={() => goToHit(hit)}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
