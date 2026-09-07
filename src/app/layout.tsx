import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieNotice from "@/components/site/CookieNotice";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Free public map and directory of startups and companies in Hyderabad, Telangana, India. Explore offices across HITEC City, Gachibowli, and Genome Valley.",
  openGraph: {
    title: SITE_NAME,
    description:
      "Interactive map and directory of companies based in Hyderabad, Telangana.",
    url: siteUrl,
    siteName: SITE_NAME,
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh bg-[#e8eef3] font-sans text-[#122033]">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9NR8WZV4R3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9NR8WZV4R3');
          `}
        </Script>
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
