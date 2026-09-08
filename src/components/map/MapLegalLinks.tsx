import Link from "next/link";

export default function MapLegalLinks({
  directoryHref = "/companies",
}: {
  directoryHref?: string;
}) {
  const links = [
    { href: "/bengaluru", label: "Bengaluru" },
    { href: "/", label: "Hyderabad" },
    { href: directoryHref, label: "Directory" },
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <nav className="pointer-events-auto flex max-w-[min(100vw-32px,480px)] shrink-0 flex-wrap justify-end gap-x-3 gap-y-1 rounded-full border border-slate-900/10 bg-white/90 px-3 py-1.5 text-[11px] shadow-sm backdrop-blur-md">
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
