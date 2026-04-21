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

    // Normalize ids to strings so legacy rows stored as ObjectId won't bypass the check.
    const a = String(userId);
    const b = String(userId2);

    // Find all chats between these two users (handles both orderings + legacy dup rows).
    const duplicates = await collection
      .find({
        $or: [
          { userId: a, userId2: b },
          { userId: b, userId2: a },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    if (duplicates.length > 0) {
      const [canonical, ...extras] = duplicates;

      // Merge any stray duplicates into the canonical chat, then remove them.
      if (extras.length > 0) {
        const mergedMessages = [
          ...(canonical.messages ?? []),
          ...extras.flatMap((d) => d.messages ?? []),
        ].sort((m1, m2) => (m1.createdAt ?? 0) - (m2.createdAt ?? 0));

        // de-dup messages by _id if any
        const seen = new Set();
        const uniqueMessages = [];
        for (const m of mergedMessages) {
          const key = m && m._id ? String(m._id) : `${m.userId}:${m.createdAt}:${m.txt}`;
          if (seen.has(key)) continue;
          seen.add(key);
          uniqueMessages.push(m);
        }

        await collection.updateOne(
          { _id: canonical._id },
          { $set: { messages: uniqueMessages } }
        );
        await collection.deleteMany({
          _id: { $in: extras.map((d) => d._id) },
        });
        return { ...canonical, messages: uniqueMessages };
      }

      return canonical;
    }

    const chatToAdd = {
      messages,
      createdAt,
      userId: a,
      userId2: b,
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
