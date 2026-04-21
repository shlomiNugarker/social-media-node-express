const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = { query, add, update, getLength };

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy);
    const collection = await dbService.getCollection("activity");
    const activities = await collection
      .find(criteria)
      .sort({ createdAt: -1 })
      .toArray();
    return activities;
  } catch (err) {
    logger.error("cannot find activities", err);
    throw err;
  }
}

async function add(activity) {
  try {
    const activityToAdd = {
      ...activity,
      createdAt: new Date().getTime(),
    };

    const collection = await dbService.getCollection("activity");
    await collection.insertOne(activityToAdd);
    return activityToAdd;
  } catch (err) {
    logger.error("cannot insert activity", err);
    throw err;
  }
}

async function update(activity) {
  try {
    const id = ObjectId(activity._id);
    delete activity._id;
    const collection = await dbService.getCollection("activity");
    await collection.updateOne({ _id: id }, { $set: { ...activity } });
    return { ...activity, _id: id };
  } catch (err) {
    logger.error(`cannot update activity ${activity._id}`, err);
    throw err;
  }
}

async function getLength(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy);
    const collection = await dbService.getCollection("activity");
    return await collection.countDocuments(criteria);
  } catch (err) {
    logger.error("cannot count activities", err);
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
    ];
  }

  if (filterBy.userId) {
    and.push({ createdTo: filterBy.userId });
  }

  if (filterBy.createdTo) {
    and.push({ createdTo: filterBy.createdTo });
  }

  if (filterBy.createdBy) {
    and.push({ createdBy: filterBy.createdBy });
  }

  if (typeof filterBy.isRead === "boolean") {
    and.push({ isRead: filterBy.isRead });
  }

  if (and.length) criteria.$and = and;

  return criteria;
}

function _escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
