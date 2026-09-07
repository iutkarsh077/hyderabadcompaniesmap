import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const links = [
  { href: "/", label: "Map" },
  { href: "/companies", label: "Directory" },
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
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#5b6775] no-underline hover:text-[#122033]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
