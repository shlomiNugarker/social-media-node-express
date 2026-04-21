const { z, objectId, url } = require("./common.schemas");

const addCommentSchema = z.object({
  postId: objectId,
  userId: objectId,
  fullname: z.string().min(1).max(80),
  imgUrl: url,
  txt: z.string().min(1).max(2000),
});

const updateCommentSchema = z.object({
  _id: z.string().min(1).max(64),
  postId: objectId,
  userId: objectId.optional(),
  fullname: z.string().min(1).max(80).optional(),
  imgUrl: url,
  txt: z.string().min(1).max(2000),
  reactions: z.array(z.any()).optional(),
  replies: z.array(z.any()).optional(),
  createdAt: z.number().optional(),
});

const removeCommentSchema = z.object({
  _id: z.string().min(1).max(64),
  postId: objectId,
});

module.exports = {
  addCommentSchema,
  updateCommentSchema,
  removeCommentSchema,
};
