const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;
const utilService = require("../../services/util.service");

module.exports = {
  add,
  update,
  remove,
};

async function add(comment) {
  const { txt, postId, userId, fullname, imgUrl } = comment;
  try {
    const commentToAdd = {
      _id: utilService.makeId(24),
      userId,
      postId: ObjectId(postId),
      fullname,
      imgUrl,
      txt,
      reactions: [],
      replies: [],
      createdAt: new Date().getTime(),
    };

    const collection = await dbService.getCollection("post");
    await collection.updateOne(
      { _id: ObjectId(postId) },
      { $push: { comments: commentToAdd } }
    );
    return commentToAdd;
  } catch (err) {
    logger.error("comment.service - cannot insert comment", err);
    throw err;
  }
}

async function update(comment) {
  const { postId } = comment;
  try {
    const collection = await dbService.getCollection("post");
    await collection.updateOne(
      { _id: ObjectId(postId), "comments._id": comment._id },
      { $set: { "comments.$": comment } }
    );
    return comment;
  } catch (err) {
    logger.error(
      `comment.service - cannot update post with id: ${postId}`,
      err
    );
    throw err;
  }
}

async function remove(comment) {
  try {
    const collection = await dbService.getCollection("post");
    await collection.updateOne(
      { _id: ObjectId(comment.postId) },
      { $pull: { comments: { _id: comment._id } } }
    );
    return comment._id;
  } catch (err) {
    logger.error(`cannot remove comment ${comment._id}`, err);
    throw err;
  }
}
