"use client";

import { useId, useState, type FormEvent } from "react";
import LocationPicker from "./LocationPicker";

type FormState = {
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: string;
  longitude: string;
  website: string;
  logo: string;
};

const INITIAL: FormState = {
  id: "",
  name: "",
  description: "",
  industry: "",
  city: "Hyderabad",
  latitude: "",
  longitude: "",
  website: "",
  logo: "",
};

const CITY_OPTIONS = [
  "Hyderabad",
  "Bengaluru",
  "Pune",
  "Ahmedabad",
  "Gurugram",
  "Noida",
  "Delhi",
] as const;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-900/12 bg-white px-3.5 py-2.5 text-[14px] text-[#122033] outline-none transition placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20";

const labelClass = "block text-[12px] font-medium tracking-wide text-[#5b6775]";

export default function AddCompanyForm() {
  const formId = useId();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [idTouched, setIdTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !idTouched) {
        next.id = slugify(String(value));
      }
      return next;
    });
    setSubmitted(false);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!form.id.trim() || !form.name.trim() || !form.description.trim() || !form.industry.trim()) {
      setError("Please fill in every required field.");
      return;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Select a location on the map.");
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Coordinates out of range.");
      return;
    }

    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      industry: form.industry.trim(),
      city: form.city.trim(),
      latitude,
      longitude,
      ...(form.website.trim() ? { website: form.website.trim() } : {}),
      ...(form.logo.trim() ? { logo: form.logo.trim() } : {}),
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/company-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Could not submit company");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Could not submit company");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(INITIAL);
    setIdTouched(false);
    setSubmitted(false);
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <header>
          <h2 className="m-0 text-base font-semibold text-[#122033]">Company</h2>
          <p className="mt-1 text-[13px] text-[#5b6775]">
            Core fields stored on each listing document.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`${formId}-name`}>
              Name <span className="text-[#c45c26]">*</span>
            </label>
            <input
              id={`${formId}-name`}
              className={fieldClass}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Acme Robotics"
              required
              autoComplete="organization"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`${formId}-id`}>
              ID <span className="text-[#c45c26]">*</span>
            </label>
            <input
              id={`${formId}-id`}
              className={`${fieldClass} font-mono text-[13px]`}
              value={form.id}
              onChange={(e) => {
                setIdTouched(true);
                update("id", e.target.value);
              }}
              placeholder="acme-robotics"
              required
              spellCheck={false}
            />
            <p className="mt-1.5 text-[11px] text-[#5b6775]">
              Unique document key. Auto-filled from the name; edit if needed.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor={`${formId}-description`}>
              Description <span className="text-[#c45c26]">*</span>
            </label>
            <textarea
              id={`${formId}-description`}
              className={`${fieldClass} min-h-28 resize-y`}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What the company builds, who it serves, and where it operates."
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${formId}-industry`}>
              Industry <span className="text-[#c45c26]">*</span>
            </label>
            <input
              id={`${formId}-industry`}
              className={fieldClass}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="SaaS, Fintech, Biotech…"
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor={`${formId}-city`}>
              City <span className="text-[#c45c26]">*</span>
            </label>
            <select
              id={`${formId}-city`}
              className={fieldClass}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            >
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-900/8 pt-8">
        <header>
          <h2 className="m-0 text-base font-semibold text-[#122033]">Map location</h2>
          <p className="mt-1 text-[13px] text-[#5b6775]">
            Search a neighbourhood, then click or drag the pin. Coordinates are saved from that point.
          </p>
        </header>

        <LocationPicker
          city={form.city}
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={(nextLat, nextLng) => {
            setForm((prev) => ({ ...prev, latitude: nextLat, longitude: nextLng }));
            setSubmitted(false);
            setError(null);
          }}
        />
      </section>

      <section className="space-y-4 border-t border-slate-900/8 pt-8">
        <header>
          <h2 className="m-0 text-base font-semibold text-[#122033]">Web presence</h2>
          <p className="mt-1 text-[13px] text-[#5b6775]">
            Optional. Logo can be left blank and derived from the website later.
          </p>
        </header>

        <div className="grid gap-4">
          <div>
            <label className={labelClass} htmlFor={`${formId}-website`}>
              Website
            </label>
            <input
              id={`${formId}-website`}
              className={fieldClass}
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              autoComplete="url"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${formId}-logo`}>
              Logo URL
            </label>
            <input
              id={`${formId}-logo`}
              className={fieldClass}
              type="url"
              value={form.logo}
              onChange={(e) => update("logo", e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
        </div>
      </section>

      {error ? (
        <p className="m-0 rounded-xl border border-[#c45c26]/25 bg-[#c45c26]/8 px-3.5 py-2.5 text-[13px] text-[#8a3a14]">
          {error}
        </p>
      ) : null}

      {submitted ? (
        <p className="m-0 rounded-xl border border-[#6fad3a]/30 bg-[#6fad3a]/10 px-3.5 py-2.5 text-[13px] text-[#2f5c24]">
          Submitted for review. It will appear on the map after an operator publishes it.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-900/8 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-[10px] bg-[#6fad3a] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#5c962e] disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit company"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center rounded-[10px] border border-slate-900/12 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#122033] transition hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
