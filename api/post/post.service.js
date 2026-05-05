const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  remove,
  query,
  getById,
  add,
  update,
  getLength,
  react,
  unreact,
};

async function query(filterBy) {
  try {
    const collection = await dbService.getCollection("post");

    let sort = {
      createdAt: -1,
    };

    if (!Object.keys(filterBy).length) {
      const posts = await collection.find({}).sort(sort).toArray();
      return posts;
    } else {
      const criteria = _buildCriteria(filterBy);

      let limit = 5;
      let endIndex = 0;

      if (filterBy.page) {
        const page = filterBy.page;
        endIndex = page * limit;
      }

      if (filterBy.sort) {
        sort.createdAt = filterBy.sort;
      }

      // Map/geo queries return all matching results (no pagination)
      if (filterBy.position || filterBy.bbox || filterBy.near) {
        limit = Infinity;
        endIndex = 0;
      }

      let cursor = collection.find(criteria).sort(sort);
      if (limit !== Infinity) {
        cursor = cursor.limit(limit).skip(endIndex);
      }
      let posts = await cursor.toArray();

      // `near` = radius filter computed in-memory (MongoDB $near needs geo index)
      if (filterBy.near) {
        const [lat, lng] = String(filterBy.near).split(",").map(Number);
        const radiusKm = Number(filterBy.radius) || 50;
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          posts = posts.filter((p) => {
            if (!p.position) return false;
            return _haversine(lat, lng, p.position.lat, p.position.lng) <= radiusKm;
          });
        }
      }

      return posts;
    }
  } catch (err) {
    logger.error("cannot find posts", err);
    throw err;
  }
}
async function getLength(filterBy) {
  try {
    const criteria = _buildCriteria(filterBy);

    const collection = await dbService.getCollection("post");

    var posts = await collection
      .find(criteria)
      .sort({ createdAt: -1 })
      .toArray();
    return posts.length;
  } catch (err) {
    logger.error("cannot find posts", err);
    throw err;
  }
}

async function getById(postId) {
  try {
    const collection = await dbService.getCollection("post");
    const post = collection.findOne({ _id: ObjectId(postId) });
    return post;
  } catch (err) {
    logger.error(`while finding posts ${postId}`, err);
    throw err;
  }
}

async function remove(postId) {
  try {
    const collection = await dbService.getCollection("post");
    await collection.deleteOne({ _id: ObjectId(postId) });
    return postId;
  } catch (err) {
    logger.error(`cannot remove posts ${postId}`, err);
    throw err;
  }
}

async function add(post) {
  const {
    body,
    imgBodyUrl,
    title,
    userId,
    position,
    videoBodyUrl,
    fullname,
    imgUrl,
    link,
    country,
    category,
  } = post;
  try {
    const postToAdd = {
      userId: userId,
      title,
      body,
      style: null,
      reactions: [],
      createdAt: new Date().getTime(),
      imgBodyUrl,
      shares: [],
      comments: [],
      position: position || null,
      videoBodyUrl,
      fullname,
      imgUrl,
      link,
      country,
      category,
    };

    const collection = await dbService.getCollection("post");
    await collection.insertOne(postToAdd);
    return postToAdd;
  } catch (err) {
    logger.error("cannot insert posts", err);
    throw err;
  }
}

async function update(post) {
  try {
    var id = ObjectId(post._id);
    delete post._id;
    const collection = await dbService.getCollection("post");
    await collection.updateOne({ _id: id }, { $set: { ...post } });
    const addedPost = { ...post, _id: id };
    return addedPost;
  } catch (err) {
    logger.error(`cannot update post ${post._id}`, err);
    throw err;
  }
}

async function react(postId, reaction) {
  try {
    const collection = await dbService.getCollection("post");
    const _id = ObjectId(postId);

    // Remove any existing reaction by this user, then add the fresh one.
    await collection.updateOne(
      { _id },
      { $pull: { reactions: { userId: String(reaction.userId) } } }
    );
    await collection.updateOne(
      { _id },
      { $push: { reactions: reaction } }
    );

    return await collection.findOne({ _id });
  } catch (err) {
    logger.error(`cannot react to post ${postId}`, err);
    throw err;
  }
}

async function unreact(postId, userId) {
  try {
    const collection = await dbService.getCollection("post");
    const _id = ObjectId(postId);
    await collection.updateOne(
      { _id },
      { $pull: { reactions: { userId: String(userId) } } }
    );
    return await collection.findOne({ _id });
  } catch (err) {
    logger.error(`cannot unreact post ${postId}`, err);
    throw err;
  }
}

function _buildCriteria(filterBy) {
  const criteria = {};
  const and = [];

  if (filterBy.txt) {
    const regex = new RegExp(_escapeRegex(filterBy.txt), "i");
    criteria.$or = [
      { body: { $regex: regex } },
      { fullname: { $regex: regex } },
      { title: { $regex: regex } },
      { country: { $regex: regex } },
    ];
  }

  if (filterBy.userId) {
    criteria.userId = filterBy.userId;
  }

  if (filterBy._id) {
    criteria._id = ObjectId(filterBy._id);
  }

  if (filterBy.category) {
    // supports comma-separated list: "beach,hiking"
    const list = String(filterBy.category)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 1) criteria.category = list[0];
    else if (list.length > 1) criteria.category = { $in: list };
  }

  if (filterBy.country) {
    criteria.country = filterBy.country;
  }

  if (filterBy.dateFrom) {
    and.push({ createdAt: { $gte: Number(filterBy.dateFrom) } });
  }
  if (filterBy.dateTo) {
    and.push({ createdAt: { $lte: Number(filterBy.dateTo) } });
  }

  // any of: position | bbox | near implies geo-tagged post
  if (filterBy.position || filterBy.bbox || filterBy.near) {
    and.push(
      { "position.lat": { $exists: true } },
      { "position.lng": { $exists: true } }
    );
  }

  // bbox = "minLng,minLat,maxLng,maxLat"
  if (filterBy.bbox) {
    const [minLng, minLat, maxLng, maxLat] = String(filterBy.bbox)
      .split(",")
      .map(Number);
    if (
      [minLng, minLat, maxLng, maxLat].every((n) => !Number.isNaN(n))
    ) {
      and.push(
        { "position.lat": { $gte: minLat, $lte: maxLat } },
        { "position.lng": { $gte: minLng, $lte: maxLng } }
      );
    }
  }

  if (and.length) criteria.$and = and;

  return criteria;
}

function _escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
