const { z, objectId } = require("./common.schemas");

const addCommentSchema = z.object({
  postId: objectId,
  txt: z.string().min(1).max(2000),
});

const updateCommentSchema = z.object({
  postId: objectId,
  txt: z.string().min(1).max(2000),
});

const removeCommentSchema = z.object({
  postId: objectId,
});

const reactCommentSchema = z.object({
  postId: objectId,
});

const addReplySchema = z.object({
  postId: objectId,
  txt: z.string().min(1).max(2000),
});

const updateReplySchema = z.object({
  postId: objectId,
  txt: z.string().min(1).max(2000),
});

const removeReplySchema = z.object({
  postId: objectId,
});

module.exports = {
  addCommentSchema,
  updateCommentSchema,
  removeCommentSchema,
  reactCommentSchema,
  addReplySchema,
  updateReplySchema,
  removeReplySchema,
};
