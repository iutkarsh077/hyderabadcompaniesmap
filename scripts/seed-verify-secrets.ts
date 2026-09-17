import bcrypt from "bcryptjs";
import DbConnect from "../src/lib/mongodb";
import { VerifySecretModel } from "../src/models/VerifySecret";

async function main() {
  const secrets = [
    process.env.VERIFY_SECRET_1,
    process.env.VERIFY_SECRET_2,
    process.env.VERIFY_SECRET_3,
  ];

  if (secrets.some((secret) => !secret?.trim())) {
    throw new Error(
      "Set VERIFY_SECRET_1, VERIFY_SECRET_2, and VERIFY_SECRET_3 in .env before seeding.",
    );
  }

  await DbConnect();

  for (let i = 0; i < 3; i += 1) {
    const slot = (i + 1) as 1 | 2 | 3;
    const hash = await bcrypt.hash(secrets[i]!.trim(), 12);
    await VerifySecretModel.findOneAndUpdate(
      { slot },
      { $set: { slot, hash } },
      { upsert: true, new: true },
    );
    console.log(`Upserted bcrypt hash for verify secret slot ${slot}`);
  }

  console.log("Done. Plaintext secrets are not stored — only hashes in verify_secrets.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
