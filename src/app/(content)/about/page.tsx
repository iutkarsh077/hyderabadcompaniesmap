import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Hyderabad Companies Map — an independent, free directory of companies in Hyderabad, Telangana.",
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-semibold tracking-tight">About this site</h1>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        Hyderabad Companies Map is an independent, non-commercial discovery tool. It helps
        founders, job seekers, journalists, and residents see where technology, life-science, and
        services companies operate across Hyderabad, Telangana, India.
      </p>
      <h2 className="mt-8 text-xl font-semibold">What you can do here</h2>
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[#344054]">
        <li>
          Explore the{" "}
          <Link href="/" className="font-medium text-[#3d7a2f]">
            interactive map
          </Link>{" "}
          of company locations.
        </li>
        <li>
          Browse the{" "}
          <Link href="/companies" className="font-medium text-[#3d7a2f]">
            company directory
          </Link>{" "}
          as readable text, grouped by industry.
        </li>
        <li>Open a company popup on the map for a short description and website when available.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">How listings are compiled</h2>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        Listings are curated from public information about companies with a Hyderabad presence.
        Coordinates are approximate (business district or campus area), not surveyed building
        footprints. Names, industries, and descriptions may be incomplete or become outdated.
      </p>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        This site is not an official register, government database, or endorsement of any company.
        Inclusion does not imply a business relationship with the operator of this website.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Map technology</h2>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        The map is rendered with MapLibre GL JS and OpenFreeMap cartography. Company logos on pins,
        when shown, are loaded from Google’s public favicon service using each company’s website
        domain.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Advertising</h2>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        The site does not currently display third-party advertising. If ads are added later, they
        will be disclosed in the Privacy Policy and labeled as advertisements. We will not click our
        own ads or encourage anyone to do so.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        Questions, corrections, or removal requests:{" "}
        <Link href="/contact" className="font-medium text-[#3d7a2f]">
          contact page
        </Link>
        .
      </p>
    </article>
  );
}
