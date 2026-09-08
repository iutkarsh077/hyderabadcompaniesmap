import type { Metadata } from "next";
import StartupMap, { BENGALURU_CENTER } from "@/components/map/StartupMap";
import { getBengaluruMapCompanies } from "@/lib/bengaluru";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bengaluru map",
  description:
    "Interactive map of startups and VC firms in Bengaluru. Pins use known coordinates only.",
};

export default async function BengaluruMapPage() {
  try {
    const companies = await getBengaluruMapCompanies();
    return (
      <StartupMap
        companies={companies}
        center={BENGALURU_CENTER}
        zoom={10.8}
        minZoom={8}
        title="Companies in Bengaluru"
        mappedAcross="Bengaluru"
        directoryHref="/bengaluru/companies"
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="grid h-dvh place-items-center bg-[#e8eef3] p-6 text-[#122033]">
        <div className="max-w-md rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h1 className="m-0 text-lg font-semibold">Could not load Bengaluru listings</h1>
          <p className="mt-2 mb-0 text-sm text-[#5b6775]">
            Check <code>MONGODB_URI</code> in <code>.env</code> and that the Atlas cluster is
            reachable. {message}
          </p>
        </div>
      </div>
    );
  }
}
