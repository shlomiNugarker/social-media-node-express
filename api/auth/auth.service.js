const { OAuth2Client } = require("google-auth-library");
const userService = require("../user/user.service");
const logger = require("../../services/logger.service");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  logger.warn(
    "GOOGLE_OAUTH_CLIENT_ID is not set — Google sign-in will fail until configured"
  );
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

module.exports = {
  loginWithGoogle,
};

async function loginWithGoogle(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in is not configured on the server");
  }
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Missing Google id_token");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.warn("Google id_token verification failed: " + err.message);
    throw new Error("Invalid Google credentials");
  }

  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Google profile is missing required fields");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  const user = await userService.upsertFromGoogle({
    googleId: payload.sub,
    email: payload.email,
    fullname: payload.name || payload.email.split("@")[0],
    imgUrl: payload.picture,
  });

  return user;
}
