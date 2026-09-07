"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "hyd-map-cookie-notice";
const NOTICE_EVENT = "hyd-map-cookie-notice";

function subscribeNotice(onStoreChange: () => void) {
  window.addEventListener(NOTICE_EVENT, onStoreChange);
  return () => window.removeEventListener(NOTICE_EVENT, onStoreChange);
}

function noticeIsVisible() {
  return window.localStorage.getItem(STORAGE_KEY) !== "dismissed";
}

export default function CookieNotice() {
  const visible = useSyncExternalStore(subscribeNotice, noticeIsVisible, () => false);

  if (!visible) return null;

  return (
    <div
      className="fixed left-4 z-50 max-w-sm rounded-2xl border border-slate-900/10 bg-white p-4 text-[13px] leading-relaxed text-[#344054] shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
      style={{ bottom: "calc(1rem + var(--map-ad-tray-offset, 0px))" }}
    >
      <p className="m-0">
        We use essential storage for this notice and Google Analytics to understand visits. Google
        AdSense advertisements may appear on the map. Read the{" "}
        <Link href="/privacy" className="font-semibold text-[#3d7a2f]">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        type="button"
        className="mt-3 rounded-[10px] bg-[#6fad3a] px-3 py-1.5 text-[13px] font-semibold text-white"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "dismissed");
          window.dispatchEvent(new Event(NOTICE_EVENT));
        }}
      >
        OK
      </button>
    </div>
  );
}
