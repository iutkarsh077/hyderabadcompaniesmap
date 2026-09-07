import Link from "next/link";

const links = [
  { href: "/companies", label: "Directory" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export default function MapLegalLinks() {
  return (
    <nav className="absolute right-4 bottom-4 z-10 flex max-w-[min(100vw-32px,420px)] flex-wrap justify-end gap-x-3 gap-y-1 rounded-full border border-slate-900/10 bg-white/90 px-3 py-1.5 text-[11px] shadow-sm backdrop-blur-md">
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
  );
}
