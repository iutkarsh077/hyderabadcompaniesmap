export type BengaluruKind = "startup" | "vc";

export interface BengaluruListing {
  id: string;
  name: string;
  kind: BengaluruKind;
  description: string;
  industry: string;
  city: string;
  tagline?: string;
  stage?: string;
  hsrLocation?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  logo?: string;
  founders?: string;
  foundedYear?: number;
}
