const express = require("express");

const { log } = require("../../middlewares/logger.middleware");
const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const {
  addActivitySchema,
  updateActivitySchema,
  activityQuerySchema,
} = require("../../validators/activity.schemas");
const { idParam } = require("../../validators/common.schemas");
const {
  getActivties,
  addActivity,
  updateActivity,
  getActivitiesLength,
} = require("./activity.controller");
const router = express.Router();

router.use(requireAuth);

router.get("/", log, validate({ query: activityQuerySchema }), getActivties);
router.get(
  "/length",
  log,
  validate({ query: activityQuerySchema }),
  getActivitiesLength
);
router.post("/", validate({ body: addActivitySchema }), addActivity);
router.put(
  "/:id",
  validate({ params: idParam, body: updateActivitySchema }),
  updateActivity
);

module.exports = router;
