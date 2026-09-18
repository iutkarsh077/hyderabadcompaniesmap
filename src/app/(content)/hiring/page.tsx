import type { Metadata } from "next";
import Link from "next/link";
import { getHiringJobs, groupHiringJobsByCity } from "@/lib/hiring";
import type { HiringJob } from "@/types/hiring-job";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hiring",
  description:
    "Open roles at companies on this map, grouped by city. Listings are refreshed from company career boards on a local crawl, not while you load the page.",
};

function formatCrawledAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default async function HiringPage() {
  let jobs: HiringJob[] = [];
  let error: string | null = null;

  try {
    jobs = await getHiringJobs();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load hiring listings";
  }

  const groups = groupHiringJobsByCity(jobs);
  const latest = jobs.reduce<string | null>((max, job) => {
    if (!max || job.crawledAt > max) return job.crawledAt;
    return max;
  }, null);
  const latestLabel = latest ? formatCrawledAt(latest) : null;

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Companies hiring</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[#344054]">
        Open roles tied to companies already listed on the Hyderabad, Bengaluru, Delhi NCR, Pune,
        and Ahmedabad maps. This page only reads Database. A Python crawl on the operator’s machine
        discovers Greenhouse, Lever, and Ashby boards from company websites and writes{" "}
        <code className="text-[13px]">it in DB</code>. It does not scrape this site at request
        time.
      </p>
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      ) : jobs.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-900/10 bg-white p-4 text-sm text-[#344054]">
          No hiring listings yet. On the machine that has DB access.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#667085]">
            {jobs.length} open roles
            {latestLabel ? ` · last crawl ${latestLabel}` : null}.
          </p>
          <div className="mt-10 space-y-12">
            {groups.map(([city, list]) => (
              <section key={city}>
                <h2 className="text-xl font-semibold text-[#122033]">{city}</h2>
                <p className="mt-1 mb-0 text-sm text-[#667085]">{list.length} roles</p>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {list.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-sm"
                    >
                      <h3 className="m-0 text-base font-semibold">{job.title}</h3>
                      <p className="mt-1 mb-0 text-xs text-[#667085]">
                        {job.companyName}
                        {job.location ? ` · ${job.location}` : ` · ${job.city}`}
                      </p>
                      <a
                        className="mt-3 inline-block text-[13px] font-semibold text-[#3d7a2f]"
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View role
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
      <p className="mt-10 text-sm text-[#667085]">
        Roles come from public career-board APIs after a local crawl. Postings can close quickly.
        Inclusion is not a job offer or an endorsement.{" "}
        <Link href="/companies" className="font-medium text-[#3d7a2f]">
          Companies directory
        </Link>
      </p>
    </article>
  );
}
