const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;

const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVe0cFaZ9e5Hm9X-tdWRLSvoZqg2bjemBABA&usqp=CAU";

module.exports = {
  query,
  getById,
  getByEmail,
  getByGoogleId,
  remove,
  update,
  add,
  upsertFromGoogle,
};

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy);
    const collection = await dbService.getCollection("user");
    const users = await collection.find(criteria).toArray();
    return users;
  } catch (err) {
    logger.error("cannot find users", err);
    throw err;
  }
}

async function getById(userId) {
  try {
    const collection = await dbService.getCollection("user");
    return await collection.findOne({ _id: ObjectId(userId) });
  } catch (err) {
    logger.error(`while finding user ${userId}`, err);
    throw err;
  }
}

async function getByEmail(email) {
  if (!email) return null;
  try {
    const collection = await dbService.getCollection("user");
    return await collection.findOne({ email: String(email).toLowerCase() });
  } catch (err) {
    logger.error(`while finding user by email`, err);
    throw err;
  }
}

async function getByGoogleId(googleId) {
  if (!googleId) return null;
  try {
    const collection = await dbService.getCollection("user");
    return await collection.findOne({ googleId: String(googleId) });
  } catch (err) {
    logger.error(`while finding user by googleId`, err);
    throw err;
  }
}

async function remove(userId) {
  try {
    const collection = await dbService.getCollection("user");
    await collection.deleteOne({ _id: ObjectId(userId) });
  } catch (err) {
    logger.error(`cannot remove user ${userId}`, err);
    throw err;
  }
}

async function update(user) {
  try {
    const userToSave = { ...user, _id: ObjectId(user._id) };
    const collection = await dbService.getCollection("user");
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave });
    return userToSave;
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err);
    throw err;
  }
}

async function add(user) {
  try {
    const collection = await dbService.getCollection("user");

    const email = user.email ? String(user.email).toLowerCase() : null;
    if (email) {
      const existing = await collection.findOne({ email });
      if (existing) throw new Error("Email already exists");
    }

    const userToAdd = {
      fullname: user.fullname,
      email,
      googleId: user.googleId ? String(user.googleId) : null,
      profession: user.profession ?? null,
      isAdmin: user.isAdmin || false,
      age: user.age ?? null,
      gender: user.gender ?? null,
      phone: user.phone ?? null,
      birthDate: user.birthDate ?? null,
      bio: user.bio ?? null,
      bg: user.bg ?? "",
      position: user.position ?? null,
      imgUrl: user.imgUrl || DEFAULT_AVATAR,
      connections: [],
      following: [],
      followers: [],
      createdAt: Date.now(),
    };

    await collection.insertOne(userToAdd);
    return userToAdd;
  } catch (err) {
    logger.error("cannot insert user", err);
    throw err;
  }
}

async function upsertFromGoogle({ googleId, email, fullname, imgUrl }) {
  if (!googleId || !email) {
    throw new Error("googleId and email are required");
  }

  const collection = await dbService.getCollection("user");
  const normalizedEmail = String(email).toLowerCase();

  // 1) Match by googleId — most stable identifier
  let user = await collection.findOne({ googleId: String(googleId) });

  // 2) Otherwise link an existing account by email
  if (!user) {
    user = await collection.findOne({ email: normalizedEmail });
    if (user) {
      await collection.updateOne(
        { _id: user._id },
        { $set: { googleId: String(googleId) } }
      );
      user.googleId = String(googleId);
    }
  }

  // 3) Create a new account
  if (!user) {
    user = await add({
      fullname,
      email: normalizedEmail,
      googleId,
      imgUrl,
    });
  }

  return user;
}

function _buildCriteria(filterBy) {
  const criteria = {};

  if (filterBy.txt) {
    const txtCriteria = { $regex: _escapeRegex(filterBy.txt), $options: "i" };
    criteria.$or = [{ fullname: txtCriteria }, { email: txtCriteria }];
  }

  if (filterBy.position) {
    criteria.$and = [
      { "position.lat": { $exists: true } },
      { "position.lng": { $exists: true } },
    ];
  }

  return criteria;
}

function _escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
