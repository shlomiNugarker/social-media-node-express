const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectId = z.string().regex(objectIdRegex, "Invalid id");

const idParam = z.object({ id: objectId });

const position = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .nullable()
  .optional();

// Accepts a URL, an empty string (treated as cleared), null, or undefined.
// Empty strings are normalized to null so the DB stores a single canonical
// "no value" representation.
const url = z
  .union([
    z.literal(""),
    z.string().url().max(2000),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === "" ? null : v));

const safeText = (max) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .refine((s) => !/[\u0000-\u001F\u007F]/.test(s), "Invalid characters");

module.exports = {
  z,
  objectId,
  idParam,
  position,
  url,
  safeText,
};
