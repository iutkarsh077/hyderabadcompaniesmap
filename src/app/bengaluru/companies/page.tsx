import type { Metadata } from "next";
import Link from "next/link";
import { getBengaluruListings, listingToMapCompany } from "@/lib/bengaluru";
import type { BengaluruKind, BengaluruListing } from "@/types/bengaluru-listing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bengaluru directory",
  description:
    "Text directory of startups and VC firms in Bengaluru, grouped by sector, with short descriptions and websites.",
};

const KIND_SECTIONS: { kind: BengaluruKind; title: string }[] = [
  { kind: "startup", title: "Startups" },
  { kind: "vc", title: "Venture capital" },
];

function groupByIndustry(listings: BengaluruListing[]) {
  const groups = new Map<string, BengaluruListing[]>();
  for (const listing of listings) {
    const key = listing.industry || "Other";
    const list = groups.get(key) ?? [];
    list.push(listing);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function kindLabel(kind: BengaluruKind) {
  return kind === "vc" ? "VC" : "Startup";
}

export default async function BengaluruDirectoryPage() {
  let listings: BengaluruListing[] = [];
  let error: string | null = null;

  try {
    listings = await getBengaluruListings();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load listings";
  }

  const startups = listings.filter((row) => row.kind === "startup");
  const vcs = listings.filter((row) => row.kind === "vc");
  const mapped = listings.filter((row) => listingToMapCompany(row)).length;

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Bengaluru directory</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#344054]">
        This page is the readable version of the{" "}
        <Link href="/bengaluru" className="font-medium text-[#3d7a2f]">
          Bengaluru map
        </Link>
        . Only listings with known coordinates appear as pins. This site is independent of{" "}
        <a
          className="font-medium text-[#3d7a2f]"
          href="https://www.bangalorestartupmap.com/"
          target="_blank"
          rel="noreferrer"
        >
          Bangalore Startup Map
        </a>
        , which is a curated public source for many of these names. We are not affiliated with that
        site. For corrections, use the{" "}
        <Link href="/contact" className="font-medium text-[#3d7a2f]">
          contact page
        </Link>
        .
      </p>
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      ) : listings.length === 0 ? (
        <p className="mt-6 text-sm text-[#667085]">
          No Bengaluru listings in the database yet. Load a snapshot with{" "}
          <code className="text-[13px]">npm run import:bengaluru</code>.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#667085]">
            {listings.length} listings ({startups.length} startups, {vcs.length} VCs)
            {mapped ? ` · ${mapped} on the map` : ""}.
          </p>
          <div className="mt-10 space-y-16">
            {KIND_SECTIONS.map(({ kind, title }) => {
              const rows = listings.filter((row) => row.kind === kind);
              if (rows.length === 0) return null;
              const groups = groupByIndustry(rows);
              return (
                <div key={kind}>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#122033]">{title}</h2>
                  <p className="mt-1 text-sm text-[#667085]">{rows.length} listed.</p>
                  <div className="mt-8 space-y-12">
                    {groups.map(([industry, list]) => (
                      <section key={`${kind}-${industry}`}>
                        <h3 className="text-xl font-semibold text-[#122033]">{industry}</h3>
                        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                          {list.map((listing) => (
                            <li
                              key={listing.id}
                              className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm"
                            >
                              <h4 className="m-0 text-base font-semibold">{listing.name}</h4>
                              <p className="mt-1 mb-0 text-xs text-[#667085]">
                                {kindLabel(listing.kind)} · {listing.industry} · {listing.city}
                                {listing.stage ? ` · ${listing.stage}` : ""}
                              </p>
                              {listing.tagline ? (
                                <p className="mt-2 mb-0 text-[13px] font-medium leading-relaxed text-[#344054]">
                                  {listing.tagline}
                                </p>
                              ) : null}
                              {listing.description && listing.description !== listing.tagline ? (
                                <p className="mt-2 mb-0 text-[13px] leading-relaxed text-[#344054]">
                                  {listing.description}
                                </p>
                              ) : !listing.tagline ? (
                                <p className="mt-2 mb-0 text-[13px] leading-relaxed text-[#344054]">
                                  {listing.description}
                                </p>
                              ) : null}
                              {listing.founders ? (
                                <p className="mt-2 mb-0 text-xs text-[#667085]">
                                  Founders: {listing.founders}
                                  {listing.foundedYear ? ` · ${listing.foundedYear}` : ""}
                                </p>
                              ) : listing.foundedYear ? (
                                <p className="mt-2 mb-0 text-xs text-[#667085]">
                                  Founded {listing.foundedYear}
                                </p>
                              ) : null}
                              {listing.website ? (
                                <a
                                  className="mt-3 inline-block text-[13px] font-semibold text-[#3d7a2f]"
                                  href={listing.website}
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}
