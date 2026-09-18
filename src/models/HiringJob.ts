import { Schema, model, models, type InferSchemaType } from "mongoose";
import type { HiringJob } from "@/types/hiring-job";

const hiringJobSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true },
    companyName: { type: String, required: true },
    companyId: { type: String },
    title: { type: String, required: true },
    city: { type: String, required: true, index: true },
    location: { type: String },
    url: { type: String, required: true },
    crawledAt: { type: Date, required: true },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
  },
);

export type HiringJobDocument = InferSchemaType<typeof hiringJobSchema>;

export const HiringJobModel =
  models.HiringJob ?? model("HiringJob", hiringJobSchema, "hiring_jobs");

export function toHiringJob(doc: {
  id: string;
  source: string;
  companyName: string;
  companyId?: string | null;
  title: string;
  city: string;
  location?: string | null;
  url: string;
  crawledAt: Date | string;
}): HiringJob {
  const crawledAt =
    doc.crawledAt instanceof Date ? doc.crawledAt.toISOString() : doc.crawledAt;
  const companyId = doc.companyId ?? undefined;
  const location = doc.location ?? undefined;
  return {
    id: doc.id,
    source: doc.source,
    companyName: doc.companyName,
    title: doc.title,
    city: doc.city,
    url: doc.url,
    crawledAt,
    ...(companyId ? { companyId } : {}),
    ...(location ? { location } : {}),
  };
}
