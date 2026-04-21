const express = require("express");
const cloudinary = require("cloudinary").v2;
const vision = require("@google-cloud/vision");

const { requireAuth } = require("../../middlewares/requireAuth.middleware");
const logger = require("../../services/logger.service");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const visionClient = process.env.GOOGLE_PRIVATE_KEY
  ? new vision.ImageAnnotatorClient({
      credentials: {
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
    })
  : null;

const UPLOAD_PRESET = process.env.CLOUD_UPLOAD_PRESET || "social_n_shlomi";
const MAX_BASE64_BYTES = 25 * 1024 * 1024; // ~25MB raw upload payload cap

const router = express.Router();

router.use(requireAuth);

const analyzeImage = async (imageBase64) => {
  if (!visionClient) return null;
  try {
    const cleanedBase64 = imageBase64.split(",")[1] || imageBase64;
    const [result] = await visionClient.safeSearchDetection({
      image: { content: cleanedBase64 },
    });
    const detections = result.safeSearchAnnotation || {};
    return {
      adult: detections.adult,
      violence: detections.violence,
      racy: detections.racy,
    };
  } catch (err) {
    logger.error("Vision safeSearch failed: " + err.message);
    return null;
  }
};

router.post("/upload", async (req, res) => {
  try {
    const { file, resourceType } = req.body;

    if (!file || typeof file !== "string") {
      return res.status(400).send({ err: "No file provided" });
    }

    if (file.length > MAX_BASE64_BYTES) {
      return res.status(413).send({ err: "File too large" });
    }

    const safeResourceType = ["image", "video", "auto"].includes(resourceType)
      ? resourceType
      : "auto";

    const isImage = safeResourceType === "image" || safeResourceType === "auto";
    if (isImage) {
      const analysis = await analyzeImage(file);
      if (
        analysis &&
        (analysis.adult === "LIKELY" ||
          analysis.adult === "VERY_LIKELY" ||
          analysis.violence === "LIKELY" ||
          analysis.violence === "VERY_LIKELY")
      ) {
        return res
          .status(400)
          .send({ err: "The image contains inappropriate content." });
      }
    }

    const result = await cloudinary.uploader.upload(file, {
      resource_type: safeResourceType,
      upload_preset: UPLOAD_PRESET,
      moderation: "webpurify",
    });

    res.json(result);
  } catch (err) {
    logger.error("Error uploading file: " + err.message);
    res.status(500).send({ err: "Failed to upload file" });
  }
});

module.exports = router;
