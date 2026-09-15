import { Schema, model, models, type InferSchemaType } from "mongoose";
import { toCompany } from "@/models/Company";
import type { Company } from "@/types/company";

const gurugramNoidaDelhiListingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    city: { type: String, required: true, default: "Gurugram" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    website: { type: String },
    logo: { type: String },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
  },
);

export type GurugramNoidaDelhiListingDocument = InferSchemaType<
  typeof gurugramNoidaDelhiListingSchema
>;

export const GurugramNoidaDelhiListingModel =
  models.GurugramNoidaDelhiListing ??
  model(
    "GurugramNoidaDelhiListing",
    gurugramNoidaDelhiListingSchema,
    "gurugram_noida_delhi_listings",
  );

export function toGurugramNoidaDelhiListing(doc: {
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  logo?: string | null;
}): Company {
  return toCompany(doc);
}
