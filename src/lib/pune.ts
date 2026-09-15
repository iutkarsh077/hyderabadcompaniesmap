import DbConnect from "@/lib/mongodb";
import { PuneListingModel, toPuneListing } from "@/models/PuneListing";
import type { Company } from "@/types/company";

export async function getPuneListings(): Promise<Company[]> {
  await DbConnect();
  const docs = await PuneListingModel.find().sort({ name: 1 }).lean();
  return docs.map((doc) =>
    toPuneListing({
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

export async function getPuneMapCompanies(): Promise<Company[]> {
  const listings = await getPuneListings();
  return listings.filter(
    (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude),
  );
}
