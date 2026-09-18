export interface HiringJob {
  id: string;
  source: string;
  companyName: string;
  companyId?: string;
  title: string;
  city: string;
  location?: string;
  url: string;
  crawledAt: string;
}

export const HIRING_CITY_ORDER = [
  "Hyderabad",
  "Bengaluru",
  "Delhi NCR",
  "Pune",
  "Ahmedabad",
] as const;
