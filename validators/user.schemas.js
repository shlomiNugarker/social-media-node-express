const { z, objectId, url, position } = require("./common.schemas");

const userBase = z.object({
  fullname: z.string().min(2).max(80).optional(),
  email: z.string().email().max(200).optional().nullable(),
  googleId: z.string().max(64).optional().nullable(),
  profession: z.string().max(120).optional().nullable(),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  birthDate: z.string().max(40).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  isAdmin: z.boolean().optional(),
  imgUrl: url,
  bg: url,
  position,
  connections: z.array(z.any()).optional(),
  following: z.array(z.string()).optional(),
  followers: z.array(z.string()).optional(),
});

const addUserSchema = userBase.required({
  fullname: true,
  email: true,
});

const updateUserSchema = userBase.extend({ _id: objectId });

const userQuerySchema = z
  .object({
    txt: z.string().max(200).optional(),
    isAdmin: z.coerce.boolean().optional(),
  })
  .strict()
  .partial();

module.exports = { addUserSchema, updateUserSchema, userQuerySchema };
