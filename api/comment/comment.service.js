const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;
const utilService = require("../../services/util.service");

module.exports = {
  add,
  updateText,
  remove,
  getCommentInPost,
  reactToComment,
  unreactToComment,
  addReply,
  updateReplyText,
  removeReply,
  reactToReply,
  unreactToReply,
};

async function getCommentInPost(postId, commentId) {
  const collection = await dbService.getCollection("post");
  const post = await collection.findOne(
    { _id: ObjectId(postId) },
    { projection: { comments: 1 } }
  );
  if (!post) return { post: null, comment: null };
  const comment = (post.comments || []).find((c) => c._id === commentId);
  return { post, comment };
}

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

async function updateText(postId, commentId, txt) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $set: { "comments.$.txt": txt } }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function remove(postId, commentId) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId) },
    { $pull: { comments: { _id: commentId } } }
  );
  return commentId;
}

async function reactToComment(postId, commentId, reaction) {
  const collection = await dbService.getCollection("post");
  // Strip any prior reaction by this user on this comment, then add fresh.
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    {
      $pull: { "comments.$.reactions": { userId: String(reaction.userId) } },
    }
  );
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $push: { "comments.$.reactions": reaction } }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function unreactToComment(postId, commentId, userId) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $pull: { "comments.$.reactions": { userId: String(userId) } } }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function addReply(postId, commentId, reply) {
  const collection = await dbService.getCollection("post");
  const replyToAdd = {
    _id: utilService.makeId(24),
    userId: reply.userId,
    fullname: reply.fullname,
    imgUrl: reply.imgUrl,
    txt: reply.txt,
    reactions: [],
    createdAt: Date.now(),
  };
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $push: { "comments.$.replies": replyToAdd } }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return { comment, reply: replyToAdd };
}

async function updateReplyText(postId, commentId, replyId, txt) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $set: { "comments.$[c].replies.$[r].txt": txt } },
    {
      arrayFilters: [{ "c._id": commentId }, { "r._id": replyId }],
    }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function removeReply(postId, commentId, replyId) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $pull: { "comments.$.replies": { _id: replyId } } }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function reactToReply(postId, commentId, replyId, reaction) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    {
      $pull: {
        "comments.$.replies.$[r].reactions": { userId: String(reaction.userId) },
      },
    },
    { arrayFilters: [{ "r._id": replyId }] }
  );
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    { $push: { "comments.$.replies.$[r].reactions": reaction } },
    { arrayFilters: [{ "r._id": replyId }] }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}

async function unreactToReply(postId, commentId, replyId, userId) {
  const collection = await dbService.getCollection("post");
  await collection.updateOne(
    { _id: ObjectId(postId), "comments._id": commentId },
    {
      $pull: {
        "comments.$.replies.$[r].reactions": { userId: String(userId) },
      },
    },
    { arrayFilters: [{ "r._id": replyId }] }
  );
  const { comment } = await getCommentInPost(postId, commentId);
  return comment;
}
