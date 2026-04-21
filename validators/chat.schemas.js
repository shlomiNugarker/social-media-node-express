const { z, objectId } = require("./common.schemas");

const messageSchema = z.object({
  _id: z.string().min(1).max(64).optional(),
  userId: objectId,
  txt: z.string().min(1).max(2000),
  createdAt: z.number().optional(),
});

const addChatSchema = z.object({
  userId: objectId,
  userId2: objectId,
  users: z.array(z.any()).optional(),
  messages: z.array(messageSchema).optional(),
});

const updateChatSchema = z.object({
  _id: objectId,
  userId: objectId,
  userId2: objectId,
  users: z.array(z.any()).optional(),
  messages: z.array(messageSchema),
  createdAt: z.number().optional(),
});

const chatQuerySchema = z
  .object({
    userId: objectId.optional(),
    userId2: objectId.optional(),
  })
  .strict()
  .partial();

module.exports = { addChatSchema, updateChatSchema, chatQuerySchema };
