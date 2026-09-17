import Link from "next/link";

export default function AddCompanyMapLink() {
  return (
    <Link
      href="/add-company"
      className="absolute top-4 right-14 z-10 rounded-xl border border-slate-900/10 bg-white/90 px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-[#122033] shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md no-underline transition hover:bg-white hover:text-[#3d7a2f]"
    >
      Add your company
    </Link>
  );
}
