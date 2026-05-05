const express = require("express");

const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addCommentSchema,
  updateCommentSchema,
  removeCommentSchema,
  reactCommentSchema,
  addReplySchema,
  updateReplySchema,
  removeReplySchema,
} = require("../../validators/comment.schemas");
const {
  addComment,
  updateComment,
  removeComment,
  reactComment,
  unreactComment,
  addReply,
  updateReply,
  removeReply,
  reactReply,
  unreactReply,
} = require("./comment.controller");

const router = express.Router();

router.use(requireAuth);

router.post("/", validate({ body: addCommentSchema }), addComment);
router.put("/:id", validate({ body: updateCommentSchema }), updateComment);
router.delete(
  "/:id",
  validate({ body: removeCommentSchema }),
  removeComment
);

router.post(
  "/:id/react",
  validate({ body: reactCommentSchema }),
  reactComment
);
router.delete(
  "/:id/react",
  validate({ body: reactCommentSchema }),
  unreactComment
);

router.post("/:id/reply", validate({ body: addReplySchema }), addReply);
router.put(
  "/:id/reply/:replyId",
  validate({ body: updateReplySchema }),
  updateReply
);
router.delete(
  "/:id/reply/:replyId",
  validate({ body: removeReplySchema }),
  removeReply
);

router.post(
  "/:id/reply/:replyId/react",
  validate({ body: reactCommentSchema }),
  reactReply
);
router.delete(
  "/:id/reply/:replyId/react",
  validate({ body: reactCommentSchema }),
  unreactReply
);

module.exports = router;
