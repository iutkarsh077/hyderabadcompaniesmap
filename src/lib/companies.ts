import DbConnect from "@/lib/mongodb";
import { CompanyModel, toCompany } from "@/models/Company";
import type { Company } from "@/types/company";

export async function getCompanies(): Promise<Company[]> {
  await DbConnect();
  const docs = await CompanyModel.find().sort({ name: 1 }).lean();
  return docs.map(toCompany);
}
