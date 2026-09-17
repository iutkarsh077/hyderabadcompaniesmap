import type { Metadata } from "next";
import VerifyCompanyPanel from "@/components/company/VerifyCompanyPanel";

export const metadata: Metadata = {
  title: "Verify company",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyCompanyPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
        Operator only
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#122033]">
        Verify company
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#344054]">
        Review public submissions and publish them into the matching city collection.
      </p>
      <div className="mt-8">
        <VerifyCompanyPanel />
      </div>
    </article>
  );
}
