import type { Metadata } from "next";
import StartupMap, { PUNE_CENTER } from "@/components/map/StartupMap";
import { getPuneMapCompanies } from "@/lib/pune";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pune map",
  description:
    "Interactive map of startups and companies in Pune. Pins use known coordinates only.",
};

export default async function PuneMapPage() {
  try {
    const companies = await getPuneMapCompanies();
    return (
      <StartupMap
        companies={companies}
        center={PUNE_CENTER}
        zoom={11}
        minZoom={9}
        title="Companies in Pune"
        mappedAcross="Pune"
        directoryHref="/pune/companies"
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="grid h-dvh place-items-center bg-[#e8eef3] p-6 text-[#122033]">
        <div className="max-w-md rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h1 className="m-0 text-lg font-semibold">Could not load Pune listings</h1>
          <p className="mt-2 mb-0 text-sm text-[#5b6775]">
            Check <code>MONGODB_URI</code> in <code>.env</code> and that the Atlas cluster is
            reachable. {message}
          </p>
        </div>
      </div>
    );
  }
}
