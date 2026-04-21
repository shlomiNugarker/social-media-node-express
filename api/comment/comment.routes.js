const express = require("express");

const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addCommentSchema,
  updateCommentSchema,
  removeCommentSchema,
} = require("../../validators/comment.schemas");
const {
  addComment,
  updateComment,
  removeComment,
} = require("./comment.controller");
const router = express.Router();

router.post("/", requireAuth, validate({ body: addCommentSchema }), addComment);
router.put(
  "/:id",
  requireAuth,
  validate({ body: updateCommentSchema }),
  updateComment
);
router.delete(
  "/:id",
  requireAuth,
  validate({ body: removeCommentSchema }),
  removeComment
);

module.exports = router;
