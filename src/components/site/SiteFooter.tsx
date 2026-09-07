import Link from "next/link";
import { getContactEmail, SITE_NAME } from "@/lib/site";

export default function SiteFooter() {
  const email = getContactEmail();

  return (
    <footer className="mt-auto border-t border-slate-900/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-[#5b6775] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 font-semibold text-[#122033]">{SITE_NAME}</p>
          <p className="mt-1 mb-0 max-w-sm text-[13px] leading-relaxed">
            A free, public directory of companies in Hyderabad, Telangana. Not affiliated with
            Google or the companies listed.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-[13px]">
          <Link href="/about" className="text-[#5b6775] no-underline hover:text-[#122033]">
            About
          </Link>
          <Link href="/privacy" className="text-[#5b6775] no-underline hover:text-[#122033]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#5b6775] no-underline hover:text-[#122033]">
            Terms of Use
          </Link>
          <Link href="/contact" className="text-[#5b6775] no-underline hover:text-[#122033]">
            Contact
          </Link>
          {email ? (
            <a href={`mailto:${email}`} className="text-[#5b6775] no-underline hover:text-[#122033]">
              {email}
            </a>
          ) : null}
        </nav>
      </div>
    </footer>
  );
}
