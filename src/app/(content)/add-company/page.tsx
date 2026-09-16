import type { Metadata } from "next";
import Link from "next/link";
import AddCompanyForm from "@/components/company/AddCompanyForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add company",
  description: `Suggest a company listing on ${SITE_NAME}. Submissions are reviewed before publishing.`,
};

export default function AddCompanyPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
        Contribute
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122033]">Add a company</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#344054]">
        Share a listing for the public maps. Fields mirror what we store for each company document.
        Submissions are held for review and published into the matching city map after verification.
      </p>
      <p className="mt-2 text-[13px] text-[#5b6775]">
        Prefer email?{" "}
        <Link href="/contact" className="font-medium text-[#3d7a2f] no-underline hover:underline">
          Contact us
        </Link>{" "}
        instead.
      </p>

      <div className="mt-10">
        <AddCompanyForm />
      </div>
    </article>
  );
}
