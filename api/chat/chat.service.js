const dbService = require("../../services/db.service");
const logger = require("../../services/logger.service");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  query,
  getById,
  add,
  update,
};

async function query(filterBy) {
  try {
    const criteria = {
      $or: [{ userId: filterBy.userId }, { userId2: filterBy.userId }],
    };

    const collection = await dbService.getCollection("chat");

    var chats = await collection
      .find(criteria)
      .sort({ createdAt: -1 })
      .toArray();
    return chats;
  } catch (err) {
    logger.error("cannot find chats", err);
    throw err;
  }
}

async function getById(chatId) {
  try {
    const collection = await dbService.getCollection("chat");
    const chat = collection.findOne({ _id: ObjectId(chatId) });
    return chat;
  } catch (err) {
    logger.error(`while finding chats ${chatId}`, err);
    throw err;
  }
}

// async function remove(chatId) {
//   try {
//     const collection = await dbService.getCollection('chat')
//     await collection.deleteOne({ _id: ObjectId(chatId) })
//     return chatId
//   } catch (err) {
//     logger.error(`cannot remove chats ${chatId}`, err)
//     throw err
//   }
// }

async function add(chat) {
  const { userId, userId2, messages, createdAt, users } = chat;
  try {
    const collection = await dbService.getCollection("chat");
    
    // Check if chat between these users already exists (in either direction)
    const existingChat = await collection.findOne({
      $or: [
        { userId: userId, userId2: userId2 },
        { userId: userId2, userId2: userId }
      ]
    });

    if (existingChat) {
      // If chat exists, return it instead of creating a new one
      return existingChat;
    }
    
    const chatToAdd = {
      messages,
      createdAt,
      userId,
      userId2,
      users,
    };

    await collection.insertOne(chatToAdd);
    return chatToAdd;
  } catch (err) {
    logger.error("cannot insert chats", err);
    throw err;
  }
}

async function update(chat) {
  try {
    var id = ObjectId(chat._id);
    delete chat._id;
    const collection = await dbService.getCollection("chat");
    await collection.updateOne({ _id: id }, { $set: { ...chat } });
    const addedPost = { ...chat, _id: id };
    return addedPost;
  } catch (err) {
    logger.error(`cannot update chat ${chat._id}`, err);
    throw err;
  }
}
