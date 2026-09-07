"use client";

import { useCallback, useEffect, useRef } from "react";
import AdTray from "@/components/ads/AdTray";
import MapLegalLinks from "./MapLegalLinks";
import MapPortfolioLink from "./MapPortfolioLink";

const OFFSET_VAR = "--map-ad-tray-offset";

export default function MapBottomBar() {
  const barRef = useRef<HTMLDivElement | null>(null);

  const applyOffset = useCallback(() => {
    const el = barRef.current;
    if (!el) return;
    document.documentElement.style.setProperty(OFFSET_VAR, `${el.offsetHeight + 16}px`);
  }, []);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    applyOffset();
    const observer = new ResizeObserver(applyOffset);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(OFFSET_VAR);
    };
  }, [applyOffset]);

  return (
    <div
      ref={barRef}
      className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-end gap-3"
    >
      <MapPortfolioLink />
      <div className="min-w-0 flex-1">
        <AdTray />
      </div>
      <MapLegalLinks />
    </div>
  );
}
