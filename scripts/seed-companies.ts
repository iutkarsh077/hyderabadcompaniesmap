/**
 * Company listings live in MongoDB (collection: companies).
 * src/data/companies.ts was removed; do not import a local seed array.
 *
 * To add listings, insert documents with the Company fields (id, name,
 * description, industry, city, latitude, longitude, website?, logo?).
 */
console.error(
  "npm run seed is disabled: there is no local companies.ts. Data is stored in MongoDB.",
);
process.exit(1);
