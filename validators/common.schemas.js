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

const url = z.string().url().max(2000).optional().nullable();

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
