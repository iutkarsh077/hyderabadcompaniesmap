import DbConnect from "@/lib/mongodb";
import {
  GurugramNoidaDelhiListingModel,
  toGurugramNoidaDelhiListing,
} from "@/models/GurugramNoidaDelhiListing";
import type { Company } from "@/types/company";

export async function getGurugramNoidaDelhiListings(): Promise<Company[]> {
  await DbConnect();
  const docs = await GurugramNoidaDelhiListingModel.find().sort({ name: 1 }).lean();
  return docs.map((doc) =>
    toGurugramNoidaDelhiListing({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      industry: doc.industry,
      city: doc.city,
      latitude: doc.latitude,
      longitude: doc.longitude,
      website: doc.website,
      logo: doc.logo,
    }),
  );
}

export async function getGurugramNoidaDelhiMapCompanies(): Promise<Company[]> {
  const listings = await getGurugramNoidaDelhiListings();
  return listings.filter(
    (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude),
  );
}
