const { z, objectId, position, url } = require("./common.schemas");

const categories = [
  "beach",
  "hiking",
  "city",
  "food",
  "culture",
  "nightlife",
  "adventure",
  "nature",
];

const postBaseSchema = z.object({
  userId: objectId,
  fullname: z.string().min(1).max(80),
  imgUrl: url,
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
  imgBodyUrl: url,
  videoBodyUrl: url,
  link: url,
  position,
  country: z.string().max(80).optional().nullable(),
  category: z.enum(categories).optional().nullable(),
});

const addPostSchema = postBaseSchema;

const updatePostSchema = postBaseSchema.partial().extend({
  _id: objectId,
});

const postQuerySchema = z
  .object({
    txt: z.string().max(200).optional(),
    userId: objectId.optional(),
    _id: objectId.optional(),
    category: z.string().max(200).optional(),
    country: z.string().max(80).optional(),
    page: z.coerce.number().int().min(0).max(10000).optional(),
    sort: z.enum(["1", "-1"]).optional(),
    dateFrom: z.coerce.number().int().optional(),
    dateTo: z.coerce.number().int().optional(),
    position: z.string().max(50).optional(),
    bbox: z.string().max(100).optional(),
    near: z.string().max(50).optional(),
    radius: z.coerce.number().min(0).max(20000).optional(),
  })
  .strict()
  .partial();

module.exports = {
  addPostSchema,
  updatePostSchema,
  postQuerySchema,
  categories,
};
