import { PORTFOLIO_URL } from "@/lib/site";
import Link from "next/link";

export default function MapPortfolioLink() {
  return (
    <Link
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto shrink-0 rounded-full border border-slate-900 bg-white/90 px-3 py-1.5 text-[11px] text-[#5b6775] no-underline shadow-xl backdrop-blur-md hover:text-[#122033] ml-10"
    >
      DeveloperPortfolio
      <span className="ml-1" aria-hidden>
        ↗
      </span>
    </Link>
  );
}
