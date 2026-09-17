"use client";

import { useId, useState, type FormEvent } from "react";

type GoToCoordsBoxProps = {
  onGo: (latitude: number, longitude: number) => void;
};

export default function GoToCoordsBox({ onGo }: GoToCoordsBoxProps) {
  const formId = useId();
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Enter valid numbers");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Out of range");
      return;
    }

    setError(null);
    onGo(lat, lng);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-2 rounded-2xl border border-slate-900/10 bg-white/90 px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"
      aria-label="Go to coordinates"
    >
      <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
        Go to coords
      </p>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`${formId}-lat`}>
          Latitude
        </label>
        <input
          id={`${formId}-lat`}
          className="min-w-0 flex-1 rounded-lg border border-slate-900/12 bg-white px-2.5 py-1.5 font-mono text-[12px] text-[#122033] outline-none placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20"
          type="number"
          inputMode="decimal"
          step="any"
          value={latitude}
          onChange={(e) => {
            setLatitude(e.target.value);
            setError(null);
          }}
          placeholder="Lat"
        />
        <label className="sr-only" htmlFor={`${formId}-lng`}>
          Longitude
        </label>
        <input
          id={`${formId}-lng`}
          className="min-w-0 flex-1 rounded-lg border border-slate-900/12 bg-white px-2.5 py-1.5 font-mono text-[12px] text-[#122033] outline-none placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20"
          type="number"
          inputMode="decimal"
          step="any"
          value={longitude}
          onChange={(e) => {
            setLongitude(e.target.value);
            setError(null);
          }}
          placeholder="Lng"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#122033] px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#1a2d44]"
        >
          Go
        </button>
      </div>
      {error ? <p className="m-0 text-[11px] text-[#8a3a14]">{error}</p> : null}
    </form>
  );
}
