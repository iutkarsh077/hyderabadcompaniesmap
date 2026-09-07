"use client";

import type { Company } from "@/types/company";

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
      {company.website ? (
        <a
          className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#6fad3a] px-3 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#5c962e]"
          href={company.website}
          target="_blank"
          rel="noreferrer"
        >
          Visit Website
        </a>
      ) : null}
    </div>
  );
}
