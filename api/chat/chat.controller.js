const logger = require('../../services/logger.service')
const chatService = require('./chat.service')

module.exports = {
  getChats,
  getChatById,
  addChat,
  updateChat,
}

// LIST
async function getChats(req, res) {
  try {
    const sessionUserId = req.session?.user?._id
    const filterBy = { userId: sessionUserId }
    const chats = await chatService.query(filterBy)
    res.json(chats)
  } catch (err) {
    logger.error('Failed to get chats', err)
    res.status(500).send({ err: 'Failed to get chats' })
  }
}

// READ
async function getChatById(req, res) {
  try {
    const { id } = req.params
    const sessionUserId = String(req.session?.user?._id || '')
    const chat = await chatService.getById(id)
    if (!chat) return res.status(404).send({ err: 'Chat not found' })
    const inChat =
      String(chat.userId) === sessionUserId ||
      String(chat.userId2) === sessionUserId
    if (!inChat) return res.status(403).send({ err: 'Forbidden' })
    res.json(chat)
  } catch (err) {
    logger.error('Failed to get chat', err)
    res.status(500).send({ err: 'Failed to get chat' })
  }
}

// CREATE
async function addChat(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const chat = req.body
    if (
      String(chat.userId) !== sessionUserId &&
      String(chat.userId2) !== sessionUserId
    ) {
      return res.status(403).send({ err: 'Forbidden' })
    }
    const addedChat = await chatService.add(chat)
    res.json(addedChat)
  } catch (err) {
    logger.error('Failed to add chat', err)
    res.status(500).send({ err: 'Failed to add chat' })
  }
}

// UPDATE
async function updateChat(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const chat = req.body
    const existing = await chatService.getById(chat._id)
    if (!existing) return res.status(404).send({ err: 'Chat not found' })
    const inChat =
      String(existing.userId) === sessionUserId ||
      String(existing.userId2) === sessionUserId
    if (!inChat) return res.status(403).send({ err: 'Forbidden' })
    const updatedChat = await chatService.update(chat)
    res.json(updatedChat)
  } catch (err) {
    logger.error('Failed to update chat', err)
    res.status(500).send({ err: 'Failed to update chat' })
  }
}

// // DELETE
// async function removeChat(req, res) {
//   try {
//     const { id } = req.params
//     const removedId = await chatService.remove(id)
//     res.send(removedId)
//   } catch (err) {
//     logger.error('Failed to remove chat', err)
//     res.status(500).send({ err: 'Failed to remove chat' })
//   }
// }
