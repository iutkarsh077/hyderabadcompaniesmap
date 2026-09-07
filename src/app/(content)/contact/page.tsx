import type { Metadata } from "next";
import { getContactEmail, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the operator of ${SITE_NAME} for listing corrections, privacy requests, or questions.`,
};

export default function ContactPage() {
  const email = getContactEmail();

  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#344054]">
        Use this page to request a listing correction or removal, ask a privacy question, or report
        a technical issue. We are not a customer-support desk for the companies shown on the map —
        contact those organizations through their own websites.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Email</h2>
      {email ? (
        <p className="mt-2 text-[15px] leading-relaxed text-[#344054]">
          Write to{" "}
          <a href={`mailto:${email}`} className="font-medium text-[#3d7a2f]">
            {email}
          </a>
          . Please include the company name and what should change.
        </p>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed text-[#344054]">
          Set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CONTACT_EMAIL</code> in{" "}
          <code className="rounded bg-slate-100 px-1">.env</code> so this page can show a public
          contact address. Google AdSense review expects a reachable contact method.
        </p>
      )}
      <h2 className="mt-8 text-xl font-semibold">What to include</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-[#344054]">
        <li>Company name as it appears on the map</li>
        <li>Whether you want an update, a correction, or removal</li>
        <li>A public source we can check (company website or news page)</li>
      </ul>
    </article>
  );
}
