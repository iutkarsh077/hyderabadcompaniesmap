"use client";

import { useState, useSyncExternalStore } from "react";
import Script from "next/script";
import AdSlot from "./AdSlot";
import {
  getAdsenseClient,
  getAdsenseDisplaySlots,
  getAdsenseTextSlot,
  isAdsenseEnabled,
} from "@/lib/adsense";

const STORAGE_KEY = "hyd-map-ad-tray";
const TRAY_EVENT = "hyd-map-ad-tray";

function subscribeTray(onStoreChange: () => void) {
  window.addEventListener(TRAY_EVENT, onStoreChange);
  return () => window.removeEventListener(TRAY_EVENT, onStoreChange);
}

function trayIsOpen() {
  return window.sessionStorage.getItem(STORAGE_KEY) !== "dismissed";
}

export default function AdTray() {
  const open = useSyncExternalStore(subscribeTray, trayIsOpen, () => true);
  const [scriptReady, setScriptReady] = useState(false);
  const enabled = isAdsenseEnabled();
  const client = getAdsenseClient();
  const displaySlots = getAdsenseDisplaySlots();
  const textSlot = getAdsenseTextSlot();

  if (!open) return null;

  return (
    <aside className="mx-auto w-full max-w-[560px]" aria-label="Advertisements">
      {enabled ? (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}
      <div className="pointer-events-auto rounded-2xl border border-slate-900/10 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-1.5">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {displaySlots.map((slot, index) => (
              <div key={index} className="h-[28px] min-h-[28px] min-w-[72px] flex-1">
                <AdSlot
                  client={client}
                  slot={enabled ? slot : ""}
                  format="rectangle"
                  ready={scriptReady}
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1.5 border-t border-slate-200 pt-1.5">
          <div className="h-[28px] w-full overflow-hidden">
            <AdSlot
              client={client}
              slot={enabled ? textSlot : ""}
              format="horizontal"
              ready={scriptReady}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
