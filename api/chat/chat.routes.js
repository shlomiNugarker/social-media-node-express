const express = require("express");

const { log } = require("../../middlewares/logger.middleware");
const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addChatSchema,
  updateChatSchema,
  chatQuerySchema,
} = require("../../validators/chat.schemas");
const { idParam } = require("../../validators/common.schemas");
const {
  getChats,
  getChatById,
  addChat,
  updateChat,
} = require("./chat.controller");
const router = express.Router();

router.use(requireAuth);

router.get("/", log, validate({ query: chatQuerySchema }), getChats);
router.get("/:id", validate({ params: idParam }), getChatById);
router.post("/", validate({ body: addChatSchema }), addChat);
router.put(
  "/:id",
  validate({ params: idParam, body: updateChatSchema }),
  updateChat
);

module.exports = router;
