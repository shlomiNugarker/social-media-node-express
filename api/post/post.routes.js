const express = require("express");

const { log } = require("../../middlewares/logger.middleware");
const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addPostSchema,
  updatePostSchema,
  postQuerySchema,
} = require("../../validators/post.schemas");
const { idParam } = require("../../validators/common.schemas");
const {
  getPosts,
  getPostById,
  addPost,
  updatePost,
  removePost,
  getPostsLength,
  reactToPost,
  unreactToPost,
} = require("./post.controller");
const router = express.Router();

router.get("/", log, validate({ query: postQuerySchema }), getPosts);
router.get("/length", log, validate({ query: postQuerySchema }), getPostsLength);
router.get("/:id", validate({ params: idParam }), getPostById);
router.post("/", requireAuth, validate({ body: addPostSchema }), addPost);
router.put(
  "/:id",
  requireAuth,
  validate({ params: idParam, body: updatePostSchema }),
  updatePost
);
router.delete("/:id", requireAuth, validate({ params: idParam }), removePost);
router.post(
  "/:id/react",
  requireAuth,
  validate({ params: idParam }),
  reactToPost
);
router.delete(
  "/:id/react",
  requireAuth,
  validate({ params: idParam }),
  unreactToPost
);

module.exports = router;
