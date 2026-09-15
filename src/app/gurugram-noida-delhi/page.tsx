import type { Metadata } from "next";
import StartupMap, { GURUGRAM_NOIDA_DELHI_CENTER } from "@/components/map/StartupMap";
import { getGurugramNoidaDelhiMapCompanies } from "@/lib/gurugram-noida-delhi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delhi NCR map",
  description:
    "Interactive map of companies in Gurugram, Noida, and Delhi. Pins use known coordinates only.",
};

export default async function GurugramNoidaDelhiMapPage() {
  try {
    const companies = await getGurugramNoidaDelhiMapCompanies();
    return (
      <StartupMap
        companies={companies}
        center={GURUGRAM_NOIDA_DELHI_CENTER}
        zoom={10.5}
        minZoom={8}
        title="Companies in Gurugram, Noida & Delhi"
        mappedAcross="Gurugram, Noida & Delhi"
        directoryHref="/gurugram-noida-delhi/companies"
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="grid h-dvh place-items-center bg-[#e8eef3] p-6 text-[#122033]">
        <div className="max-w-md rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h1 className="m-0 text-lg font-semibold">Could not load Delhi NCR listings</h1>
          <p className="mt-2 mb-0 text-sm text-[#5b6775]">
            Check <code>MONGODB_URI</code> in <code>.env</code> and that the Atlas cluster is
            reachable. {message}
          </p>
        </div>
      </div>
    );
  }
}
