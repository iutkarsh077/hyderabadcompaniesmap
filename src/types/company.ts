export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: number;
  longitude: number;
  website?: string;
  logo?: string;
}

export function logoFor(website?: string) {
  if (!website) return undefined;
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(website).hostname}&sz=128`;
  } catch {
    return undefined;
  }
}
