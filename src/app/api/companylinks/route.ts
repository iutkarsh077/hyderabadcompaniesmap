import { NextResponse } from "next/server";
import { tavily } from "@tavily/core";
import {
  buildCompanyLinksSearchQuery,
  clipSnippet,
  COMPANY_LINKS_SEARCH_OPTIONS,
  ensureOfficialWebsiteLink,
  type CompanyLinkSearchInput,
} from "@/lib/masterprompt";

type CompanyLinksRequest = {
  apiKey?: string;
  company?: CompanyLinkSearchInput;
};

function toCompanyContext(input: CompanyLinkSearchInput): CompanyLinkSearchInput | null {
  const name = input.name?.trim();
  if (!name) return null;

  return {
    name,
    ...(input.id?.trim() ? { id: input.id.trim() } : {}),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.industry?.trim() ? { industry: input.industry.trim() } : {}),
    ...(input.city?.trim() ? { city: input.city.trim() } : {}),
    ...(input.website?.trim() ? { website: input.website.trim() } : {}),
    ...(input.logo?.trim() ? { logo: input.logo.trim() } : {}),
    ...(typeof input.latitude === "number" && Number.isFinite(input.latitude)
      ? { latitude: input.latitude }
      : {}),
    ...(typeof input.longitude === "number" && Number.isFinite(input.longitude)
      ? { longitude: input.longitude }
      : {}),
  };
}

export async function POST(request: Request) {
  let body: CompanyLinksRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (!body.company) {
    return NextResponse.json({ error: "Company context is required" }, { status: 400 });
  }

  const company = toCompanyContext(body.company);
  if (!company) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const query = buildCompanyLinksSearchQuery(company);

  try {
    const tvly = tavily({ apiKey });
    const response = await tvly.search(query, COMPANY_LINKS_SEARCH_OPTIONS);

    const links = ensureOfficialWebsiteLink(
      company,
      (response.results ?? []).map((result) => ({
        id: result.id,
        title: clipSnippet(result.title),
        url: result.url,
        content: clipSnippet(result.content),
        score: result.score,
        favicon: result.favicon,
        publishedDate: result.publishedDate,
      })),
      response.answer,
    );

    return NextResponse.json({
      company,
      query,
      answer: response.answer ? clipSnippet(response.answer) : null,
      links,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get company links";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
