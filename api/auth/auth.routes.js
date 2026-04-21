const express = require("express");
const { loginWithGoogle, logout } = require("./auth.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { googleLoginSchema } = require("../../validators/auth.schemas");

const router = express.Router();

router.post("/google", validate({ body: googleLoginSchema }), loginWithGoogle);
router.post("/logout", logout);

module.exports = router;
