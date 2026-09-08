import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/companies`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/bengaluru`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${base}/bengaluru/companies`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];
}
