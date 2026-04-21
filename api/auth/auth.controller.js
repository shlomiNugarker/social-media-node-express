const authService = require("./auth.service");
const logger = require("../../services/logger.service");

module.exports = {
  loginWithGoogle,
  logout,
};

async function loginWithGoogle(req, res) {
  try {
    const { credential } = req.body;
    const user = await authService.loginWithGoogle(credential);
    req.session.user = user;
    res.json(user);
  } catch (err) {
    logger.warn("Google sign-in failed: " + err.message);
    res.status(401).send({ err: err.message || "Google sign-in failed" });
  }
}

async function logout(req, res) {
  try {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.send({ msg: "Logged out successfully" });
    });
  } catch (err) {
    logger.error("Failed to logout: " + err.message);
    res.status(500).send({ err: "Failed to logout" });
  }
}
