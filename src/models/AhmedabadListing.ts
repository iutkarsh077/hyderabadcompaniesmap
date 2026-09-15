import { Schema, model, models, type InferSchemaType } from "mongoose";
import { toCompany } from "@/models/Company";
import type { Company } from "@/types/company";

const ahmedabadListingSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    city: { type: String, required: true, default: "Ahmedabad" },
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

export type AhmedabadListingDocument = InferSchemaType<typeof ahmedabadListingSchema>;

export const AhmedabadListingModel =
  models.AhmedabadListing ??
  model("AhmedabadListing", ahmedabadListingSchema, "ahmedabad_listings");

export function toAhmedabadListing(doc: {
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
