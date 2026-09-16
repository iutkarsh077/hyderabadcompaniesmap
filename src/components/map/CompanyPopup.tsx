"use client";

import type { Company } from "@/types/company";
import { requestCompanyLinks } from "@/lib/company-links-events";

type CompanyPopupProps = {
  company: Company;
};

export default function CompanyPopup({ company }: CompanyPopupProps) {
  const initial = company.name.trim().charAt(0).toUpperCase();

  return (
    <div className="w-[280px] text-[#122033]">
      <div className="mb-2.5 flex items-center gap-3">
        {company.logo ? (
          <img
            className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 bg-slate-50 object-contain"
            src={company.logo}
            alt=""
            onError={(event) => {
              const img = event.currentTarget;
              img.style.display = "none";
              const fallback = img.nextElementSibling;
              if (fallback instanceof HTMLElement) fallback.hidden = false;
            }}
          />
        ) : null}
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-slate-50 font-bold text-[#3d7a2f]"
          hidden={Boolean(company.logo)}
        >
          {initial}
        </div>
        <div>
          <h2 className="m-0 text-base leading-tight font-semibold">{company.name}</h2>
          <p className="mt-1 mb-0 text-xs text-[#667085]">
            {company.industry} · {company.city}
          </p>
        </div>
      </div>
      <p className="mb-3 text-[13px] leading-relaxed text-[#344054]">{company.description}</p>
      <div className="flex gap-2">
        {company.website ? (
          <a
            className="inline-flex min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#6fad3a] px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-white no-underline hover:bg-[#5c962e]"
            href={company.website}
            target="_blank"
            rel="noreferrer"
          >
            Visit Website
          </a>
        ) : (
          <span
            className="inline-flex min-w-0 flex-1 cursor-not-allowed items-center justify-center rounded-[10px] bg-[#6fad3a]/40 px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-white"
            title="No website on file"
          >
            Visit Website
          </span>
        )}
        <button
          type="button"
          onClick={() => requestCompanyLinks(company)}
          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-[10px] border border-slate-900/15 bg-white px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-[#122033] transition hover:bg-slate-50"
        >
          Get Links
        </button>
      </div>
    </div>
  );
}
