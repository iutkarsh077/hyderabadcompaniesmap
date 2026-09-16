export type CompanyLinkSearchInput = {
  id?: string;
  name: string;
  description?: string;
  industry?: string;
  city?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
};

export type CompanyLinkResult = {
  id: string;
  title: string;
  url: string;
  content: string;
  score: number;
  favicon?: string;
  publishedDate?: string;
};

/** Max characters shown per text field (title, snippet, answer). */
export const COMPANY_LINK_SNIPPET_LENGTH = 50;

const AGGREGATOR_HOST_RE =
  /(?:^|\.)(linkedin|wikipedia|crunchbase|tracxn|twitter|x\.com|instagram|facebook|youtube|bloomberg|reuters|glassdoor|indeed|ambitionbox|moneycontrol|economictimes)\b/i;

const CORPORATE_SUBDOMAINS = new Set([
  "careers",
  "jobs",
  "investor",
  "investors",
  "ir",
  "about",
  "blog",
  "news",
  "shop",
  "store",
  "support",
  "docs",
  "www",
]);

/**
 * Clips text to a fixed length so each section stays scannable in the bot UI.
 */
export function clipSnippet(
  text: string | null | undefined,
  maxLength = COMPANY_LINK_SNIPPET_LENGTH,
): string {
  const value = text?.replace(/\s+/g, " ").trim() ?? "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function isGenericLabel(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === "other" || normalized === "n/a";
}

function normalizeUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Turn a company page URL into the likely official homepage root. */
export function officialHomepageFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (AGGREGATOR_HOST_RE.test(parsed.hostname)) return null;

    let host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const labels = host.split(".");
    if (labels.length > 2 && CORPORATE_SUBDOMAINS.has(labels[0])) {
      host = labels.slice(1).join(".");
    }

    return `https://www.${host}`;
  } catch {
    return null;
  }
}

function websiteFromAnswer(answer: string | undefined) {
  if (!answer) return null;
  const httpsMatch = answer.match(/https?:\/\/[^\s)>"']+/i);
  if (httpsMatch) return officialHomepageFromUrl(httpsMatch[0]);

  const wwwMatch = answer.match(/\bwww\.[a-z0-9.-]+\.[a-z]{2,}\b/i);
  if (wwwMatch) return officialHomepageFromUrl(`https://${wwwMatch[0]}`);

  return null;
}

/**
 * Ensures the official company website appears first in the links list.
 * Uses DB website when present, otherwise answer text or inferred corporate domains.
 */
export function ensureOfficialWebsiteLink(
  company: CompanyLinkSearchInput,
  links: CompanyLinkResult[],
  answer?: string | null,
): CompanyLinkResult[] {
  const fromDb = company.website?.trim()
    ? officialHomepageFromUrl(company.website) ?? company.website.trim()
    : null;
  const fromAnswer = websiteFromAnswer(answer ?? undefined);
  const fromResults = links
    .map((link) => officialHomepageFromUrl(link.url))
    .find((url): url is string => Boolean(url));

  const official = fromDb || fromAnswer || fromResults;
  if (!official) return links;

  const officialKey = normalizeUrlKey(official);
  const officialHost = hostnameOf(official);
  const withoutDupes = links.filter((link) => {
    const key = normalizeUrlKey(link.url);
    if (key === officialKey) return false;
    // Drop bare duplicates of the same homepage with trailing slash variants
    return normalizeUrlKey(link.url.replace(/\/+$/, "")) !== officialKey;
  });

  const alreadyListedAsRoot = withoutDupes.some((link) => {
    try {
      const parsed = new URL(link.url);
      const path = parsed.pathname.replace(/\/+$/, "") || "/";
      return hostnameOf(link.url) === officialHost && (path === "/" || path === "/en");
    } catch {
      return false;
    }
  });

  if (alreadyListedAsRoot) return withoutDupes;

  return [
    {
      id: "official-website",
      title: clipSnippet(`${company.name} — Official website`),
      url: official,
      content: clipSnippet("Official company website"),
      score: 1,
    },
    ...withoutDupes,
  ];
}

/**
 * Builds the Tavily search query used to find high-signal links for a company
 * shown on the map (official site, careers, LinkedIn, news, funding, etc.).
 */
export function buildCompanyLinksSearchQuery(company: CompanyLinkSearchInput): string {
  const name = company.name.trim();
  const industry = company.industry?.trim();
  const city = company.city?.trim();
  const website = company.website?.trim();
  const description = company.description?.trim();
  const coords =
    typeof company.latitude === "number" &&
    typeof company.longitude === "number" &&
    Number.isFinite(company.latitude) &&
    Number.isFinite(company.longitude)
      ? `${company.latitude}, ${company.longitude}`
      : null;

  const contextParts = [
    company.id ? `id: ${company.id}` : null,
    !isGenericLabel(industry) ? `industry: ${industry}` : null,
    !isGenericLabel(city) ? `location: ${city}, India` : "location: India",
    website ? `known website: ${website}` : null,
    coords ? `map coordinates: ${coords}` : null,
    description ? `description: ${description}` : null,
  ].filter(Boolean);

  return [
    `Find the most important official and reputable links for the company "${name}".`,
    contextParts.length > 0 ? `Company context — ${contextParts.join("; ")}.` : null,
    "Always include the official company homepage URL (root website, e.g. https://www.example.com).",
    "Prioritize:",
    "1) Official company homepage / website URL",
    "2) Careers or jobs page",
    "3) Official LinkedIn company page",
    "4) Official Twitter, Instagram, or similar social media pages",
    "5) Crunchbase, Tracxn, or similar company profile",
    "6) Recent reputable news, funding, or product announcements",
    "Prefer primary sources over aggregators and directory spam.",
    "Exclude unrelated companies with a similar name.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Shared Tavily options for company-link lookups. */
export const COMPANY_LINKS_SEARCH_OPTIONS = {
  searchDepth: "advanced" as const,
  topic: "general" as const,
  maxResults: 8,
  includeAnswer: "basic" as const,
  includeFavicon: true,
  country: "india",
};
