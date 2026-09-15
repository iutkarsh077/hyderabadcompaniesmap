import DbConnect from "@/lib/mongodb";
import { AhmedabadListingModel, toAhmedabadListing } from "@/models/AhmedabadListing";
import type { Company } from "@/types/company";

export async function getAhmedabadListings(): Promise<Company[]> {
  await DbConnect();
  const docs = await AhmedabadListingModel.find().sort({ name: 1 }).lean();
  return docs.map((doc) =>
    toAhmedabadListing({
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

export async function getAhmedabadMapCompanies(): Promise<Company[]> {
  const listings = await getAhmedabadListings();
  return listings.filter(
    (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude),
  );
}
