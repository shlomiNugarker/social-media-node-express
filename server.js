const express = require("express");
const cors = require("cors");
const path = require("path");
const expressSession = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./services/logger.service");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
const http = require("http").createServer(app);

const isProd = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required");
}

if (isProd) {
  app.set("trust proxy", 1);
}

const session = expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (isProd) {
  app.use(express.static(path.resolve(__dirname, "public")));
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
} else {
  app.use(express.static("public"));
  app.use(
    cors({
      origin: [
        ...allowedOrigins,
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      credentials: true,
    })
  );
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(session);
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { err: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { err: "Too many auth attempts, please try again later" },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { err: "Too many uploads, please try again later" },
});

const authRoutes = require("./api/auth/auth.routes");
const userRoutes = require("./api/user/user.routes");
const postRoutes = require("./api/post/post.routes");
const commentRoutes = require("./api/comment/comment.routes");
const chatRoutes = require("./api/chat/chat.routes");
const activityRoutes = require("./api/activity/activity.routes");
const cloudinaryRoutes = require("./api/cloudinary/cloudinary.routes");
const { connectSockets } = require("./services/socket.service");
const setupAsyncLocalStorage = require("./middlewares/setupAls.middleware");

app.all("*", setupAsyncLocalStorage);

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/cloudinary", uploadLimiter, cloudinaryRoutes);

connectSockets(http, session);

module.exports = app;

app.get("/**", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3030;
http.listen(PORT, () => {
  logger.info(`Server is running on port: ${PORT}`);
});
