import { Schema, model, models, type InferSchemaType } from "mongoose";

const verifySecretSchema = new Schema(
  {
    slot: { type: Number, required: true, unique: true, enum: [1, 2, 3] },
    /** bcrypt hash of the plaintext secret — never store plaintext */
    hash: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type VerifySecretDocument = InferSchemaType<typeof verifySecretSchema>;

export const VerifySecretModel =
  models.VerifySecret ?? model("VerifySecret", verifySecretSchema, "verify_secrets");
