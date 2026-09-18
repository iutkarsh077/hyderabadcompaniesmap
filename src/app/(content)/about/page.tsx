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
        Hyderabad Companies Map is an independent, free discovery tool. It helps founders, job
        seekers, journalists, and residents see where technology, life-science, and services
        companies operate across Hyderabad, Telangana, India. There are also separate maps and
        directories for{" "}
        <Link href="/bengaluru" className="font-medium text-[#3d7a2f]">
          Bengaluru
        </Link>
        ,{" "}
        <Link href="/gurugram-noida-delhi" className="font-medium text-[#3d7a2f]">
          Gurugram, Noida &amp; Delhi
        </Link>
        , and{" "}
        <Link href="/pune" className="font-medium text-[#3d7a2f]">
          Pune
        </Link>
        , and{" "}
        <Link href="/ahmedabad" className="font-medium text-[#3d7a2f]">
          Ahmedabad
        </Link>
        ; those listings are not shown on the Hyderabad map.
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
        <li>
          Browse the{" "}
          <Link href="/bengaluru" className="font-medium text-[#3d7a2f]">
            Bengaluru map
          </Link>{" "}
          and{" "}
          <Link href="/bengaluru/companies" className="font-medium text-[#3d7a2f]">
            Bengaluru directory
          </Link>{" "}
          of startups and VC firms.
        </li>
        <li>
          Browse the{" "}
          <Link href="/gurugram-noida-delhi" className="font-medium text-[#3d7a2f]">
            Delhi NCR map
          </Link>{" "}
          and{" "}
          <Link href="/gurugram-noida-delhi/companies" className="font-medium text-[#3d7a2f]">
            directory
          </Link>{" "}
          for Gurugram, Noida, and Delhi.
        </li>
        <li>
          Browse the{" "}
          <Link href="/pune" className="font-medium text-[#3d7a2f]">
            Pune map
          </Link>{" "}
          and{" "}
          <Link href="/pune/companies" className="font-medium text-[#3d7a2f]">
            Pune directory
          </Link>
          .
        </li>
        <li>
          Browse the{" "}
          <Link href="/ahmedabad" className="font-medium text-[#3d7a2f]">
            Ahmedabad map
          </Link>{" "}
          and{" "}
          <Link href="/ahmedabad/companies" className="font-medium text-[#3d7a2f]">
            Ahmedabad directory
          </Link>{" "}
          for Ahmedabad and GIFT City.
        </li>
        <li>Open a company popup on the map for a short description and website when available.</li>
        <li>
          Browse{" "}
          <Link href="/hiring" className="font-medium text-[#3d7a2f]">
            companies hiring
          </Link>{" "}
          by city. Those roles are filled by a local Python crawl into MongoDB, not while the page
          loads.
        </li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">How listings are compiled</h2>
      <p className="text-[15px] leading-relaxed text-[#344054]">
        Listings are curated from public information about companies with a Hyderabad presence.
        Coordinates are approximate (business district or campus area), not surveyed building
        footprints. Names, industries, and descriptions may be incomplete or become outdated.
        Bengaluru, Delhi NCR, Pune, and Ahmedabad listings each live in a separate collection and
        appear only on their own maps, not on the Hyderabad map.
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
        The map may display Google AdSense advertisements when advertising is enabled. Ads are
        labeled by Google. Details are in the{" "}
        <Link href="/privacy" className="font-medium text-[#3d7a2f]">
          Privacy Policy
        </Link>
        . We will not click our own ads or encourage anyone to do so.
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
