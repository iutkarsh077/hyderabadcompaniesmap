"use client";

import { useEffect, useRef } from "react";

function AdPlaceholder({
  className,
  horizontal = false,
}: {
  className?: string;
  horizontal?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="rounded bg-slate-500 px-1 py-px text-[8px] font-bold tracking-wide text-white uppercase">
        AD
      </span>
    </div>
  );
}

export default function AdSlot({
  client,
  slot,
  format,
  ready,
  className,
}: {
  client: string;
  slot: string;
  format: "rectangle" | "horizontal";
  ready: boolean;
  className?: string;
}) {
  const pushed = useRef(false);
  const live = Boolean(client && slot && ready);

  useEffect(() => {
    if (!live || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      pushed.current = false;
    }
  }, [live]);

  if (!slot) {
    return <AdPlaceholder className={className} horizontal={format === "horizontal"} />;
  }

  return (
    <ins
      className={`adsbygoogle block overflow-hidden rounded-md ${className ?? ""}`}
      style={{ display: "block", width: "100%", height: "100%" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format === "horizontal" ? "horizontal" : "rectangle"}
      data-full-width-responsive="false"
    />
  );
}
