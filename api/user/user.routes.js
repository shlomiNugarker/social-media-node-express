const express = require("express");
const {
  requireAuth,
  requireAdmin,
} = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addUserSchema,
  updateUserSchema,
  userQuerySchema,
} = require("../../validators/user.schemas");
const { idParam } = require("../../validators/common.schemas");
const {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  addUser,
  followUser,
  unfollowUser,
} = require("./user.controller");
const router = express.Router();

router.use(requireAuth);

router.get("/", validate({ query: userQuerySchema }), getUsers);
router.get("/:id", validate({ params: idParam }), getUser);
router.put("/:id", validate({ params: idParam, body: updateUserSchema }), updateUser);
router.post("/:id/follow", validate({ params: idParam }), followUser);
router.delete("/:id/follow", validate({ params: idParam }), unfollowUser);
router.post("/", requireAdmin, validate({ body: addUserSchema }), addUser);
router.delete("/:id", requireAdmin, validate({ params: idParam }), deleteUser);

module.exports = router;
