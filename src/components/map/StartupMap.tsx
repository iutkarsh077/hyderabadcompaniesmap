"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Company } from "@/types/company";
import CompanyPopup from "./CompanyPopup";
import MapLegalLinks from "./MapLegalLinks";

const HYDERABAD: [number, number] = [78.4867, 17.385];
const SOURCE_ID = "companies";
const CLUSTER_GLOW_LAYER = "clusters-glow";
const CLUSTER_LAYER = "clusters";
const CLUSTER_COUNT_LAYER = "cluster-count";
const COMPANY_POINTS_LAYER = "company-points";

const clusterColor: maplibregl.ExpressionSpecification = [
  "step",
  ["get", "point_count"],
  "#7cb342",
  11,
  "#c6b93a",
  51,
  "#f08a24",
];

function createMarkerElement(company: Company) {
  const button = document.createElement("button");
  button.className = "company-marker";
  button.type = "button";
  button.setAttribute("aria-label", company.name);

  const disc = document.createElement("span");
  disc.className = "company-marker__disc";

  const letter = document.createElement("span");
  letter.className = "company-marker__letter";
  letter.textContent = company.name.trim().charAt(0).toUpperCase();

  if (company.logo) {
    const img = document.createElement("img");
    img.className = "company-marker__logo";
    img.src = company.logo;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      img.remove();
      disc.append(letter);
    });
    disc.append(img);
  } else {
    disc.append(letter);
  }

  button.append(disc);
  return button;
}

export default function StartupMap({ companies }: { companies: Company[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const companiesById = new Map(companies.map((company) => [company.id, company]));
    const companiesGeoJSON = {
      type: "FeatureCollection" as const,
      features: companies.map((company) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [company.longitude, company.latitude],
        },
        properties: company,
      })),
    };

    // Same idea as Vite's optimizeDeps.exclude: don't use the bundled worker.
    // MapLibre resolves the worker next to this URL (and it imports maplibre-gl-shared.mjs).
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    const map = new maplibregl.Map({
      container,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: HYDERABAD,
      zoom: 11.15,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    const markerIndex = new Map<string, maplibregl.Marker>();
    const markersOnScreen = new Map<string, maplibregl.Marker>();
    const popupRoots = new Map<string, Root>();
    let activePopup: maplibregl.Popup | null = null;

    const closePopup = () => {
      activePopup?.remove();
      activePopup = null;
    };

    const openCompanyPopup = (company: Company, lngLat: maplibregl.LngLatLike) => {
      closePopup();

      const node = document.createElement("div");
      const root = createRoot(node);
      root.render(<CompanyPopup company={company} />);
      popupRoots.set(company.id, root);

      activePopup = new maplibregl.Popup({
        offset: 28,
        closeButton: true,
        maxWidth: "320px",
      })
        .setLngLat(lngLat)
        .setDOMContent(node)
        .addTo(map);

      activePopup.on("close", () => {
        root.unmount();
        popupRoots.delete(company.id);
        if (activePopup) activePopup = null;
      });
    };

    const syncLogoMarkers = () => {
      if (!map.loaded() || !map.getLayer(COMPANY_POINTS_LAYER)) return;

      let features: ReturnType<maplibregl.Map["querySourceFeatures"]> = [];
      try {
        features = map.querySourceFeatures(SOURCE_ID, {
          filter: ["!", ["has", "point_count"]],
        });
      } catch {
        return;
      }

      const nextVisible = new Map<string, maplibregl.Marker>();

      for (const feature of features) {
        const id = feature.properties?.id as string | undefined;
        if (!id || nextVisible.has(id)) continue;

        const company = companiesById.get(id);
        if (!company || feature.geometry.type !== "Point") continue;

        let marker = markerIndex.get(id);
        if (!marker) {
          const element = createMarkerElement(company);
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            openCompanyPopup(company, [company.longitude, company.latitude]);
          });
          marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([
            company.longitude,
            company.latitude,
          ]);
          markerIndex.set(id, marker);
        }

        if (!markersOnScreen.has(id)) marker.addTo(map);
        nextVisible.set(id, marker);
      }

      for (const [id, marker] of markersOnScreen) {
        if (!nextVisible.has(id)) marker.remove();
      }

      markersOnScreen.clear();
      for (const [id, marker] of nextVisible) markersOnScreen.set(id, marker);
    };

    const onClusterClick = async (event: maplibregl.MapMouseEvent) => {
      const clusterFeatures = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTER_LAYER, CLUSTER_GLOW_LAYER],
      });
      const cluster = clusterFeatures[0];
      if (!cluster || cluster.geometry.type !== "Point") return;

      const clusterId = cluster.properties?.cluster_id as number | undefined;
      const source = map.getSource(SOURCE_ID);
      if (clusterId == null || !(source instanceof maplibregl.GeoJSONSource)) return;

      const expansionZoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: cluster.geometry.coordinates as [number, number],
        zoom: expansionZoom,
        duration: 650,
      });
    };

    map.on("error", (event) => {
      console.error("MapLibre error:", event.error);
    });

    map.on("load", () => {
      map.resize();

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: companiesGeoJSON,
        cluster: true,
        clusterRadius: 56,
        clusterMaxZoom: 16,
      });

      map.addLayer({
        id: CLUSTER_GLOW_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": clusterColor,
          "circle-opacity": 0.22,
          "circle-radius": ["step", ["get", "point_count"], 28, 11, 38, 51, 50],
        },
      });

      map.addLayer({
        id: CLUSTER_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": clusterColor,
          "circle-opacity": 0.88,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.9)",
          "circle-radius": ["step", ["get", "point_count"], 18, 11, 24, 51, 32],
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#1f2a1a",
        },
      });

      map.addLayer({
        id: COMPANY_POINTS_LAYER,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 8,
          "circle-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#1f2933",
          "circle-opacity": 0.15,
        },
      });

      map.on("click", CLUSTER_LAYER, onClusterClick);
      map.on("click", CLUSTER_GLOW_LAYER, onClusterClick);
      map.on("click", COMPANY_POINTS_LAYER, (event) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id as string | undefined;
        const company = id ? companiesById.get(id) : undefined;
        if (!company) return;
        openCompanyPopup(company, event.lngLat);
      });

      map.on("mouseenter", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", COMPANY_POINTS_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", COMPANY_POINTS_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("render", syncLogoMarkers);
      syncLogoMarkers();
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.off("render", syncLogoMarkers);
      closePopup();
      for (const root of popupRoots.values()) root.unmount();
      popupRoots.clear();
      for (const marker of markerIndex.values()) marker.remove();
      markerIndex.clear();
      markersOnScreen.clear();
      map.remove();
    };
  }, [companies]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#e8eef3]">
      <aside className="absolute top-4 left-4 z-10 flex max-w-[min(360px,calc(100vw-32px))] flex-col gap-1 rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
          Startup discovery
        </p>
        <h1 className="m-0 text-lg leading-tight text-[#122033]">Companies in Hyderabad</h1>
        <p className="m-0 text-[13px] text-[#5b6775]">
          {companies.length} companies mapped across Hyderabad
        </p>
      </aside>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <MapLegalLinks />
    </div>
  );
}
