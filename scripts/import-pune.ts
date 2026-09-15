import { readFile } from "node:fs/promises";
import path from "node:path";
import { logoFor } from "../src/types/company";
import DbConnect from "../src/lib/mongodb";
import { PuneListingModel } from "../src/models/PuneListing";

type SourceRow = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  industry?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  website?: unknown;
  logo?: unknown;
};

function isPresent(value: unknown): value is string | number {
  if (value === null || value === undefined) return false;
  if (value === "$undefined") return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return false;
}

function asString(value: unknown): string | undefined {
  if (!isPresent(value)) return undefined;
  return String(value).trim();
}

function asNumber(value: unknown): number | undefined {
  if (!isPresent(value)) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(row: SourceRow) {
  const id = asString(row.id);
  const name = asString(row.name);
  const latitude = asNumber(row.latitude);
  const longitude = asNumber(row.longitude);
  if (!id || !name) return null;
  if (latitude === undefined || longitude === undefined) return null;

  const website = asString(row.website);
  const storedLogo = asString(row.logo);
  const logo = storedLogo || logoFor(website);

  return {
    id,
    name,
    description: asString(row.description) || "",
    industry: asString(row.industry) || "Other",
    city: asString(row.city) || "Pune",
    latitude,
    longitude,
    ...(website ? { website } : {}),
    ...(logo ? { logo } : {}),
  };
}

async function main() {
  const sourcePath = path.join(process.cwd(), "data", "pune-source.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch {
    console.error(
      `Missing or invalid snapshot at ${sourcePath}. Run npm run extract:pune-startup-map first.`,
    );
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error("pune-source.json must be a JSON array.");
    process.exit(1);
  }

  const docs = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const mapped = mapRow(row as SourceRow);
    if (!mapped || seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    docs.push(mapped);
  }

  if (docs.length === 0) {
    console.error("No valid listings in snapshot.");
    process.exit(1);
  }

  await DbConnect();

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await PuneListingModel.bulkWrite(ops, { ordered: false });
  console.log(
    `Upserted Pune listings: matched=${result.matchedCount} upserted=${result.upsertedCount} modified=${result.modifiedCount} total=${docs.length}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
