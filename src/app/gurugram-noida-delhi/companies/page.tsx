import type { Metadata } from "next";
import Link from "next/link";
import { getGurugramNoidaDelhiListings } from "@/lib/gurugram-noida-delhi";
import type { Company } from "@/types/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delhi NCR directory",
  description:
    "Text directory of companies in Gurugram, Noida, and Delhi, grouped by industry, with short descriptions and websites.",
};

function groupByIndustry(companies: Company[]) {
  const groups = new Map<string, Company[]>();
  for (const company of companies) {
    const key = company.industry || "Other";
    const list = groups.get(key) ?? [];
    list.push(company);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default async function GurugramNoidaDelhiDirectoryPage() {
  let companies: Company[] = [];
  let error: string | null = null;

  try {
    companies = await getGurugramNoidaDelhiListings();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load companies";
  }

  const groups = groupByIndustry(companies);

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Delhi NCR directory</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#344054]">
        This page is the readable version of the{" "}
        <Link href="/gurugram-noida-delhi" className="font-medium text-[#3d7a2f]">
          Gurugram, Noida &amp; Delhi map
        </Link>
        . Each entry is a company with a known or approximate location in the Delhi NCR. Coordinates
        on the map are district-level, not exact street addresses. These listings are not shown on
        the Hyderabad or Bengaluru maps. This site is independent of{" "}
        <a
          className="font-medium text-[#3d7a2f]"
          href="https://www.delhistartupmap.com/"
          target="_blank"
          rel="noreferrer"
        >
          Delhi Startup Map
        </a>
        .
      </p>
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      ) : companies.length === 0 ? (
        <p className="mt-6 text-sm text-[#667085]">
          No Delhi NCR listings in the database yet. Load a snapshot with{" "}
          <code className="text-[13px]">npm run import:gurugram-noida-delhi</code>.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#667085]">{companies.length} companies listed.</p>
          <div className="mt-10 space-y-12">
            {groups.map(([industry, list]) => (
              <section key={industry}>
                <h2 className="text-xl font-semibold text-[#122033]">{industry}</h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {list.map((company) => (
                    <li
                      key={company.id}
                      className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm"
                    >
                      <h3 className="m-0 text-base font-semibold">{company.name}</h3>
                      <p className="mt-1 mb-0 text-xs text-[#667085]">
                        {company.industry} · {company.city}
                      </p>
                      <p className="mt-2 mb-0 text-[13px] leading-relaxed text-[#344054]">
                        {company.description}
                      </p>
                      {company.website ? (
                        <a
                          className="mt-3 inline-block text-[13px] font-semibold text-[#3d7a2f]"
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Website
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
