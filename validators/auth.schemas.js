const { z } = require("./common.schemas");

const googleLoginSchema = z.object({
  credential: z.string().min(20).max(4096),
});

module.exports = { googleLoginSchema };
