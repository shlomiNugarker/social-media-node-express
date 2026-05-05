const logger = require('../../services/logger.service')
const postService = require('./post.service')

module.exports = {
  getPosts,
  getPostById,
  addPost,
  updatePost,
  removePost,
  getPostsLength,
  reactToPost,
  unreactToPost,
}

// LIST
async function getPosts(req, res) {
  try {
    const filterBy = req.validatedQuery || req.query
    const posts = await postService.query(filterBy)
    res.json(posts)
  } catch (err) {
    logger.error('Failed to get posts', err)
    res.status(500).send({ err: 'Failed to get posts' })
  }
}

async function getPostsLength(req, res) {
  try {
    const filterBy = req.validatedQuery || req.query
    const postsLength = await postService.getLength(filterBy)
    res.json(postsLength)
  } catch (err) {
    logger.error('Failed to get posts length', err)
    res.status(500).send({ err: 'Failed to get posts' })
  }
}

// READ
async function getPostById(req, res) {
  try {
    const { id } = req.params
    const post = await postService.getById(id)
    res.json(post)
  } catch (err) {
    logger.error('Failed to get post', err)
    res.status(500).send({ err: 'Failed to get post' })
  }
}

// CREATE
async function addPost(req, res) {
  try {
    const sessionUser = req.session?.user
    const post = { ...req.body, userId: String(sessionUser._id) }
    const addedPost = await postService.add(post)
    res.json(addedPost)
  } catch (err) {
    logger.error('Failed to add post', err)
    res.status(500).send({ err: 'Failed to add post' })
  }
}

// UPDATE
async function updatePost(req, res) {
  try {
    const sessionUser = req.session?.user
    const { id } = req.params
    const existing = await postService.getById(id)
    if (!existing) return res.status(404).send({ err: 'Post not found' })

    const isOwner = String(existing.userId) === String(sessionUser._id)
    const isAdmin = !!sessionUser.isAdmin
    if (!isOwner && !isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const post = { ...req.body, _id: id, userId: String(existing.userId) }
    const updatedPost = await postService.update(post)
    res.json(updatedPost)
  } catch (err) {
    logger.error('Failed to update post', err)
    res.status(500).send({ err: 'Failed to update post' })
  }
}

// DELETE
async function removePost(req, res) {
  try {
    const sessionUser = req.session?.user
    const { id } = req.params
    const existing = await postService.getById(id)
    if (!existing) return res.status(404).send({ err: 'Post not found' })

    const isOwner = String(existing.userId) === String(sessionUser._id)
    const isAdmin = !!sessionUser.isAdmin
    if (!isOwner && !isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const removedId = await postService.remove(id)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove post', err)
    res.status(500).send({ err: 'Failed to remove post' })
  }
}

// REACT (like)
async function reactToPost(req, res) {
  try {
    const sessionUser = req.session?.user
    const { id } = req.params
    const reaction = {
      userId: String(sessionUser._id),
      fullname: sessionUser.fullname,
      imgUrl: sessionUser.imgUrl,
      type: req.body?.type ?? 'like',
    }
    const updated = await postService.react(id, reaction)
    res.json(updated)
  } catch (err) {
    logger.error('Failed to react to post: ' + err.message)
    res.status(500).send({ err: 'Failed to react to post' })
  }
}

// UNREACT
async function unreactToPost(req, res) {
  try {
    const sessionUser = req.session?.user
    const { id } = req.params
    const updated = await postService.unreact(id, String(sessionUser._id))
    res.json(updated)
  } catch (err) {
    logger.error('Failed to unreact: ' + err.message)
    res.status(500).send({ err: 'Failed to unreact' })
  }
}
