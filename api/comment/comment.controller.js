const logger = require('../../services/logger.service')
const commentService = require('./comment.service')
const postService = require('../post/post.service')

module.exports = {
  addComment,
  updateComment,
  removeComment,
}

// CREATE
async function addComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const comment = { ...req.body, userId: String(sessionUser._id) }
    const addedComment = await commentService.add(comment)
    res.json(addedComment)
  } catch (err) {
    logger.error('comment.controller - Failed to add comment', err)
    res.status(500).send({ err: 'Failed to add comment' })
  }
}

// UPDATE
async function updateComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const comment = req.body
    const post = await postService.getById(comment.postId)
    if (!post) return res.status(404).send({ err: 'Post not found' })
    const existing = (post.comments || []).find((c) => c._id === comment._id)
    if (!existing) return res.status(404).send({ err: 'Comment not found' })

    const isOwner = String(existing.userId) === String(sessionUser._id)
    const isAdmin = !!sessionUser.isAdmin
    if (!isOwner && !isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const updatedComment = await commentService.update({
      ...comment,
      userId: existing.userId,
    })
    res.json(updatedComment)
  } catch (err) {
    logger.error('comment.controller - Failed to update comment', err)
    res.status(500).send({ err: 'Failed to update comment' })
  }
}

// REMOVE
async function removeComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const comment = req.body
    const post = await postService.getById(comment.postId)
    if (!post) return res.status(404).send({ err: 'Post not found' })
    const existing = (post.comments || []).find((c) => c._id === comment._id)
    if (!existing) return res.status(404).send({ err: 'Comment not found' })

    const isOwner = String(existing.userId) === String(sessionUser._id)
    const isPostOwner = String(post.userId) === String(sessionUser._id)
    const isAdmin = !!sessionUser.isAdmin
    if (!isOwner && !isPostOwner && !isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const removedId = await commentService.remove(comment)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove comment', err)
    res.status(500).send({ err: 'Failed to remove comment' })
  }
}
