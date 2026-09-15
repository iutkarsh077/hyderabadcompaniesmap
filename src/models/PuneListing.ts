import { Schema, model, models, type InferSchemaType } from "mongoose";
import { toCompany } from "@/models/Company";
import type { Company } from "@/types/company";

const puneListingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    city: { type: String, required: true, default: "Pune" },
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

export type PuneListingDocument = InferSchemaType<typeof puneListingSchema>;

export const PuneListingModel =
  models.PuneListing ?? model("PuneListing", puneListingSchema, "pune_listings");

export function toPuneListing(doc: {
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
