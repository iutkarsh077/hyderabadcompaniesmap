const CLIENT_PREFIX = "ca-pub-";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function getAdsenseClient() {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
  if (!raw.startsWith(CLIENT_PREFIX) || raw.length <= CLIENT_PREFIX.length) {
    return "";
  }
  return raw;
}

export function getAdsensePublisherId() {
  const client = getAdsenseClient();
  if (!client) return "";
  return client.slice("ca-".length);
}

export function getAdsenseDisplaySlot(index: 1 | 2 | 3 | 4 | 5) {
  const slots = {
    1: process.env.NEXT_PUBLIC_ADSENSE_SLOT_1,
    2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_2,
    3: process.env.NEXT_PUBLIC_ADSENSE_SLOT_3,
    4: process.env.NEXT_PUBLIC_ADSENSE_SLOT_4,
    5: process.env.NEXT_PUBLIC_ADSENSE_SLOT_5,
  } as const;
  return slots[index]?.trim() ?? "";
}

export function getAdsenseTextSlot() {
  return process.env.NEXT_PUBLIC_ADSENSE_SLOT_TEXT?.trim() ?? "";
}

export function getAdsenseDisplaySlots() {
  return [
    getAdsenseDisplaySlot(1),
    getAdsenseDisplaySlot(2),
    getAdsenseDisplaySlot(3),
    getAdsenseDisplaySlot(4),
    getAdsenseDisplaySlot(5),
  ] as const;
}

export function hasAnyAdsenseSlot() {
  return getAdsenseDisplaySlots().some(Boolean) || Boolean(getAdsenseTextSlot());
}

export function isAdsenseEnabled() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(getAdsenseClient()) &&
    hasAnyAdsenseSlot()
  );
}
