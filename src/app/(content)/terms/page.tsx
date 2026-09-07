import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of Use for ${SITE_NAME}.`,
};

export default function TermsPage() {
  const updated = "6 September 2026";

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-[#667085]">Last updated {updated}</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#344054]">
        <p>
          By using {SITE_NAME} (the “site”), you agree to these terms. If you do not agree, do not
          use the site.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">The service</h2>
        <p>
          The site provides a map and directory of companies associated with Hyderabad, Telangana,
          for informational purposes only. Listings, coordinates, and descriptions may be inaccurate
          or out of date. We do not guarantee completeness or fitness for any particular purpose,
          including investment, employment, or navigation.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Acceptable use</h2>
        <p>You may not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Scrape, overload, or attempt to disrupt the site or its map tiles</li>
          <li>Misrepresent the site as an official government or company product</li>
          <li>Use listings to harass individuals or send unsolicited bulk messages</li>
          <li>Attempt to click, inflate, or otherwise manipulate any advertisements if ads appear</li>
        </ul>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Intellectual property</h2>
        <p>
          Site design, original text, and compilation of the directory are provided by the operator.
          Company names, logos, and trademarks belong to their respective owners. Map cartography is
          provided by OpenFreeMap and related open-map data sources under their licenses.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">No professional advice</h2>
        <p>
          Nothing on the site is legal, financial, or career advice. Visit company websites and
          official sources before making decisions.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Liability</h2>
        <p>
          The site is provided “as is.” To the extent permitted by law, the operator is not liable
          for losses arising from use of the map, directory, or third-party websites linked from
          listings.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Privacy</h2>
        <p>
          Our{" "}
          <Link href="/privacy" className="font-medium text-[#3d7a2f]">
            Privacy Policy
          </Link>{" "}
          describes how information is handled.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Changes</h2>
        <p>We may change these terms. Continued use after an update means you accept the new terms.</p>
      </div>
    </article>
  );
}
