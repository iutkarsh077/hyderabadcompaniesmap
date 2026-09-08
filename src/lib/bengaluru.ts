import DbConnect from "@/lib/mongodb";
import { BengaluruListingModel, toBengaluruListing } from "@/models/BengaluruListing";
import type { BengaluruListing } from "@/types/bengaluru-listing";
import type { Company } from "@/types/company";

export function listingToMapCompany(listing: BengaluruListing): Company | null {
  const { latitude, longitude } = listing;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const industry =
    listing.kind === "vc"
      ? listing.industry && listing.industry !== "Other"
        ? `VC · ${listing.industry}`
        : "VC"
      : listing.industry;
  const description = listing.description || listing.tagline || "";

  return {
    id: listing.id,
    name: listing.name,
    description,
    industry,
    city: listing.city,
    latitude,
    longitude,
    ...(listing.website ? { website: listing.website } : {}),
    ...(listing.logo ? { logo: listing.logo } : {}),
  };
}

export async function getBengaluruListings(): Promise<BengaluruListing[]> {
  await DbConnect();
  const docs = await BengaluruListingModel.find().sort({ name: 1 }).lean();
  return docs.map((doc) =>
    toBengaluruListing({
      id: doc.id,
      name: doc.name,
      kind: doc.kind,
      description: doc.description,
      industry: doc.industry,
      city: doc.city,
      tagline: doc.tagline,
      stage: doc.stage,
      hsrLocation: doc.hsrLocation,
      latitude: doc.latitude,
      longitude: doc.longitude,
      website: doc.website,
      logo: doc.logo,
      founders: doc.founders,
      foundedYear: doc.foundedYear,
    }),
  );
}

export async function getBengaluruMapCompanies(): Promise<Company[]> {
  const listings = await getBengaluruListings();
  const companies: Company[] = [];
  for (const listing of listings) {
    const company = listingToMapCompany(listing);
    if (company) companies.push(company);
  }
  return companies;
}
