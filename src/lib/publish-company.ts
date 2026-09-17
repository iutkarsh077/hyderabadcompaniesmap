import { AhmedabadListingModel } from "@/models/AhmedabadListing";
import { BengaluruListingModel } from "@/models/BengaluruListing";
import { CompanyModel } from "@/models/Company";
import { GurugramNoidaDelhiListingModel } from "@/models/GurugramNoidaDelhiListing";
import { PuneListingModel } from "@/models/PuneListing";
import { logoFor } from "@/types/company";

export type PublishableCompany = {
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  logo?: string | null;
};

type ListingModel = {
  updateOne: (
    filter: { id: string },
    update: { $set: Record<string, unknown> },
    options: { upsert: boolean },
  ) => Promise<unknown>;
};

type CityTarget = {
  collection: string;
  model: ListingModel;
};

export function resolveCityTarget(city: string): CityTarget {
  const normalized = city.trim().toLowerCase();

  if (normalized.includes("bengaluru") || normalized.includes("bangalore")) {
    return { collection: "bengaluru_listings", model: BengaluruListingModel };
  }
  if (normalized.includes("pune")) {
    return { collection: "pune_listings", model: PuneListingModel };
  }
  if (normalized.includes("ahmedabad")) {
    return { collection: "ahmedabad_listings", model: AhmedabadListingModel };
  }
  if (
    normalized.includes("gurugram") ||
    normalized.includes("gurgaon") ||
    normalized.includes("noida") ||
    normalized.includes("delhi")
  ) {
    return {
      collection: "gurugram_noida_delhi_listings",
      model: GurugramNoidaDelhiListingModel,
    };
  }

  return { collection: "companies", model: CompanyModel };
}

export async function publishCompanyToCityCollection(company: PublishableCompany) {
  const target = resolveCityTarget(company.city);
  const website = company.website?.trim() || undefined;
  const logo = company.logo?.trim() || logoFor(website) || undefined;

  const doc = {
    id: company.id.trim(),
    name: company.name.trim(),
    description: company.description.trim(),
    industry: company.industry.trim(),
    city: company.city.trim(),
    latitude: company.latitude,
    longitude: company.longitude,
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
  };

  await target.model.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });

  return target.collection;
}
