import { Schema, model, models, type InferSchemaType } from "mongoose";
import { logoFor, type Company } from "@/types/company";

const companySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    city: { type: String, required: true, default: "Hyderabad" },
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

export type CompanyDocument = InferSchemaType<typeof companySchema>;

export const CompanyModel =
  models.Company ?? model("Company", companySchema, "companies");

export function toCompany(doc: {
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
  const website = doc.website ?? undefined;
  const logo = doc.logo ?? logoFor(website);
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    industry: doc.industry,
    city: doc.city,
    latitude: doc.latitude,
    longitude: doc.longitude,
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
  };
}
