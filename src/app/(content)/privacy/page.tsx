import type { Metadata } from "next";
import Link from "next/link";
import { getContactEmail, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE_NAME}. How we handle information, cookies, and third-party services.`,
};

export default function PrivacyPage() {
  const email = getContactEmail();
  const updated = "7 September 2026";

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[#667085]">Last updated {updated}</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#344054]">
        <p>
          This Privacy Policy explains how {SITE_NAME} (“we”, “the site”) handles information when
          you visit {SITE_NAME}. We operate a public map and directory of companies in Hyderabad,
          India. We do not sell personal data.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Who is responsible</h2>
        <p>
          The site is operated as an independent editorial project. For privacy requests use the{" "}
          <Link href="/contact" className="font-medium text-[#3d7a2f]">
            contact page
          </Link>
          {email ? (
            <>
              {" "}
              or email{" "}
              <a href={`mailto:${email}`} className="font-medium text-[#3d7a2f]">
                {email}
              </a>
            </>
          ) : null}
          .
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Information we collect</h2>
        <p>
          <strong>We do not require accounts.</strong> We do not run a login, newsletter, or payment
          form. We do not intentionally collect names, phone numbers, or precise device location
          from visitors.
        </p>
        <p>Technical data may be processed automatically by our hosting provider, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>IP address, browser type, and date/time of requests (server or CDN logs)</li>
          <li>The pages you request (for example / , /about, /companies)</li>
        </ul>
        <p>
          Company listings in our database are business information (name, industry, approximate
          coordinates, public website). They are not visitor profiles.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Cookies and local storage</h2>
        <p>
          We use a single <strong>essential</strong> localStorage value to remember that you
          dismissed the cookie notice, and a sessionStorage value if you hide the map advertisement
          tray. The site also loads <strong>Google Analytics</strong>, which uses cookies or similar
          identifiers to measure visits. When Google AdSense is enabled on the map, Google may set
          advertising cookies or identifiers as described in Google’s policies.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Third-party services</h2>
        <p>The site loads or talks to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>OpenFreeMap / MapLibre</strong> — map tiles and map rendering in your browser.
          </li>
          <li>
            <strong>Google Analytics</strong> — page-view measurement loaded on every page. Google’s
            privacy policy applies.
          </li>
          <li>
            <strong>Google favicon service</strong> — optional company logos on map pins, requested
            from Google using the company’s public website domain. Google’s own privacy policy
            applies to those requests.
          </li>
          <li>
            <strong>Google AdSense</strong> — may load on the map when a publisher ID and ad slots
            are configured in production. Ads may use cookies or identifiers as described by Google.
          </li>
        </ul>
        <p>
          Your browser may send standard request data to those providers. We do not control their
          independent processing.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Advertising</h2>
        <p>
          The map may display Google AdSense advertisements when advertising is enabled. Ads appear
          in a tray overlaid at the bottom of the map, not on directory or policy pages, and are
          labeled by Google. We
          do not ask visitors to click ads. Where required by law we will add a further consent
          mechanism; until then this notice and the cookie banner disclose Analytics and possible
          AdSense use.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Children</h2>
        <p>
          The site is intended for a general audience interested in Hyderabad businesses. It is not
          directed at children under 13, and we do not knowingly collect personal information from
          children.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Your choices</h2>
        <p>
          You can block third-party requests with your browser. You can clear localStorage to reset
          the cookie notice. For a correction or removal of a company listing, use the contact page
          and include the company name.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-[#122033]">Changes</h2>
        <p>
          We may update this policy. The “Last updated” date at the top will change when we do.
        </p>
        <p>
          See also our{" "}
          <Link href="/terms" className="font-medium text-[#3d7a2f]">
            Terms of Use
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
