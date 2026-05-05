const userService = require('./user.service')
const logger = require('../../services/logger.service')

module.exports = {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  addUser,
  followUser,
  unfollowUser,
}

async function getUser(req, res) {
  try {
    const user = await userService.getById(req.params.id)
    res.send(user)
  } catch (err) {
    logger.error('Failed to get user', err)
    res.status(500).send({ err: 'Failed to get user' })
  }
}

async function getUsers(req, res) {
  try {
    const filterBy = req.validatedQuery || req.query
    const users = await userService.query(filterBy)
    res.send(users)
  } catch (err) {
    logger.error('Failed to get users', err)
    res.status(500).send({ err: 'Failed to get users' })
  }
}

async function deleteUser(req, res) {
  try {
    await userService.remove(req.params.id)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to delete user', err)
    res.status(500).send({ err: 'Failed to delete user' })
  }
}

async function updateUser(req, res) {
  try {
    const sessionUser = req.session?.user
    const targetId = req.params.id
    const isSelf = String(sessionUser._id) === String(targetId)
    const isAdmin = !!sessionUser.isAdmin
    if (!isSelf && !isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const incoming = { ...req.body, _id: targetId }

    // Block privilege escalation + identity hijacking
    if (!isAdmin) {
      delete incoming.isAdmin
    }
    delete incoming.email
    delete incoming.googleId

    const savedUser = await userService.update(incoming)
    res.send(savedUser)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(500).send({ err: 'Failed to update user' })
  }
}

async function followUser(req, res) {
  try {
    const meId = String(req.session?.user?._id || '')
    const targetId = req.params.id
    const result = await userService.follow(meId, targetId)
    if (req.session?.user) {
      req.session.user = { ...req.session.user, following: result.me.following }
    }
    res.json(result)
  } catch (err) {
    logger.warn('Failed to follow: ' + err.message)
    res.status(400).send({ err: err.message || 'Failed to follow' })
  }
}

async function unfollowUser(req, res) {
  try {
    const meId = String(req.session?.user?._id || '')
    const targetId = req.params.id
    const result = await userService.unfollow(meId, targetId)
    if (req.session?.user) {
      req.session.user = { ...req.session.user, following: result.me.following }
    }
    res.json(result)
  } catch (err) {
    logger.warn('Failed to unfollow: ' + err.message)
    res.status(400).send({ err: err.message || 'Failed to unfollow' })
  }
}

async function addUser(req, res) {
  try {
    const user = req.body
    const savedUser = await userService.add(user)
    res.send(savedUser)
  } catch (err) {
    logger.error('Failed to add user', err)
    res.status(500).send({ err: 'Failed to add user' })
  }
}
