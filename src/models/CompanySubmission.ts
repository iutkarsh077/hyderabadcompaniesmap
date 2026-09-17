import { Schema, model, models, type InferSchemaType } from "mongoose";

const companySubmissionSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    website: { type: String },
    logo: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["pending", "published"],
      default: "pending",
      index: true,
    },
    publishedCollection: { type: String },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type CompanySubmissionDocument = InferSchemaType<typeof companySubmissionSchema>;

export const CompanySubmissionModel =
  models.CompanySubmission ??
  model("CompanySubmission", companySubmissionSchema, "company_submissions");
