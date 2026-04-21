const { z, objectId, url } = require("./common.schemas");

const activityBase = z.object({
  createdTo: objectId,
  createdBy: objectId.optional(),
  body: z.string().min(1).max(500),
  fullname: z.string().max(80).optional(),
  imgUrl: url,
  title: z.string().max(200).optional(),
  linkTo: z.string().max(500).optional(),
  postId: objectId.optional(),
  position: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional()
    .nullable(),
  isRead: z.boolean().optional(),
  type: z.string().max(50).optional(),
});

const addActivitySchema = activityBase;
const updateActivitySchema = activityBase.partial().extend({ _id: objectId });

const activityQuerySchema = z
  .object({
    userId: objectId.optional(),
    createdTo: objectId.optional(),
    createdBy: objectId.optional(),
    txt: z.string().max(200).optional(),
    isRead: z.coerce.boolean().optional(),
  })
  .strict()
  .partial();

module.exports = {
  addActivitySchema,
  updateActivitySchema,
  activityQuerySchema,
};
