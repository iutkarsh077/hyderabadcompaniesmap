import { Schema, model, models, type InferSchemaType } from "mongoose";
import { logoFor } from "@/types/company";
import type { BengaluruKind, BengaluruListing } from "@/types/bengaluru-listing";

const bengaluruListingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    kind: { type: String, required: true, enum: ["startup", "vc"] },
    description: { type: String, required: true, default: "" },
    industry: { type: String, required: true, default: "Other" },
    city: { type: String, required: true, default: "Bengaluru" },
    tagline: { type: String },
    stage: { type: String },
    hsrLocation: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    website: { type: String },
    logo: { type: String },
    founders: { type: String },
    foundedYear: { type: Number },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
  },
);

export type BengaluruListingDocument = InferSchemaType<typeof bengaluruListingSchema>;

export const BengaluruListingModel =
  models.BengaluruListing ??
  model("BengaluruListing", bengaluruListingSchema, "bengaluru_listings");

export function toBengaluruListing(doc: {
  id: string;
  name: string;
  kind: BengaluruKind;
  description: string;
  industry: string;
  city: string;
  tagline?: string | null;
  stage?: string | null;
  hsrLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  logo?: string | null;
  founders?: string | null;
  foundedYear?: number | null;
}): BengaluruListing {
  const website = doc.website ?? undefined;
  const logo = doc.logo ?? logoFor(website);
  const tagline = doc.tagline ?? undefined;
  const stage = doc.stage ?? undefined;
  const hsrLocation = doc.hsrLocation ?? undefined;
  const founders = doc.founders ?? undefined;
  const latitude = typeof doc.latitude === "number" ? doc.latitude : undefined;
  const longitude = typeof doc.longitude === "number" ? doc.longitude : undefined;
  const foundedYear = typeof doc.foundedYear === "number" ? doc.foundedYear : undefined;

  return {
    id: doc.id,
    name: doc.name,
    kind: doc.kind,
    description: doc.description,
    industry: doc.industry,
    city: doc.city,
    ...(tagline ? { tagline } : {}),
    ...(stage ? { stage } : {}),
    ...(hsrLocation ? { hsrLocation } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
    ...(founders ? { founders } : {}),
    ...(foundedYear !== undefined ? { foundedYear } : {}),
  };
}
