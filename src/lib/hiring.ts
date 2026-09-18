import DbConnect from "@/lib/mongodb";
import { HiringJobModel, toHiringJob } from "@/models/HiringJob";
import { HIRING_CITY_ORDER, type HiringJob } from "@/types/hiring-job";

export async function getHiringJobs(): Promise<HiringJob[]> {
  await DbConnect();
  const docs = await HiringJobModel.find().sort({ city: 1, companyName: 1, title: 1 }).lean();
  return docs.map((doc) =>
    toHiringJob({
      id: doc.id,
      source: doc.source,
      companyName: doc.companyName,
      companyId: doc.companyId,
      title: doc.title,
      city: doc.city,
      location: doc.location,
      url: doc.url,
      crawledAt: doc.crawledAt,
    }),
  );
}

export function groupHiringJobsByCity(jobs: HiringJob[]): [string, HiringJob[]][] {
  const groups = new Map<string, HiringJob[]>();
  for (const job of jobs) {
    const key = job.city || "Other";
    const list = groups.get(key) ?? [];
    list.push(job);
    groups.set(key, list);
  }

  const rank = new Map<string, number>(HIRING_CITY_ORDER.map((city, index) => [city, index]));
  return [...groups.entries()].sort(([a], [b]) => {
    const ra = rank.get(a) ?? HIRING_CITY_ORDER.length;
    const rb = rank.get(b) ?? HIRING_CITY_ORDER.length;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}
