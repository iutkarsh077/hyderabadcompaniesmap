import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const links = [
  { href: "/", label: "Map" },
  { href: "/companies", label: "Directory" },
  { href: "/bengaluru", label: "Bengaluru" },
  { href: "/gurugram-noida-delhi", label: "Delhi NCR" },
  { href: "/pune", label: "Pune" },
  { href: "/ahmedabad", label: "Ahmedabad" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-900/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[#122033] no-underline">
          {SITE_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#5b6775] no-underline hover:text-[#122033]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/add-company"
            className="rounded-lg bg-[#6fad3a] px-2.5 py-1 text-[13px] font-semibold text-white no-underline transition hover:bg-[#5c962e]"
          >
            Add your company
          </Link>
        </nav>
      </div>
    </header>
  );
}
