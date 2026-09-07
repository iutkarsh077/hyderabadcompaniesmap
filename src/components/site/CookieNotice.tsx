"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "hyd-map-cookie-notice";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "dismissed");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-2xl border border-slate-900/10 bg-white p-4 text-[13px] leading-relaxed text-[#344054] shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
      <p className="m-0">
        We use only essential storage for this notice. We do not run advertising or analytics
        cookies yet. Read the{" "}
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
          setVisible(false);
        }}
      >
        OK
      </button>
    </div>
  );
}
