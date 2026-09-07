import { PORTFOLIO_URL } from "@/lib/site";

export default function MapPortfolioLink() {
  return (
    <a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto shrink-0 rounded-full border border-slate-900/10 bg-white/90 px-3 py-1.5 text-[11px] text-[#5b6775] no-underline shadow-sm backdrop-blur-md hover:text-[#122033]"
    >
      DeveloperPortfolio
      <span className="ml-1" aria-hidden>
        ↗
      </span>
    </a>
  );
}
