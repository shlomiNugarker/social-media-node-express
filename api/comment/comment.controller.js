const logger = require('../../services/logger.service')
const commentService = require('./comment.service')
const postService = require('../post/post.service')

module.exports = {
  addComment,
  updateComment,
  removeComment,
  reactComment,
  unreactComment,
  addReply,
  updateReply,
  removeReply,
  reactReply,
  unreactReply,
}

function makeReaction(sessionUser) {
  return {
    userId: String(sessionUser._id),
    fullname: sessionUser.fullname,
    imgUrl: sessionUser.imgUrl,
  }
}

async function addComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const comment = {
      ...req.body,
      userId: String(sessionUser._id),
      fullname: sessionUser.fullname,
      imgUrl: sessionUser.imgUrl,
    }
    const added = await commentService.add(comment)
    res.json(added)
  } catch (err) {
    logger.error('comment.controller - Failed to add comment: ' + err.message)
    res.status(500).send({ err: 'Failed to add comment' })
  }
}

async function updateComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId, txt } = req.body
    const commentId = req.params.id

    const { comment } = await commentService.getCommentInPost(postId, commentId)
    if (!comment) return res.status(404).send({ err: 'Comment not found' })

    const isOwner = String(comment.userId) === String(sessionUser._id)
    if (!isOwner && !sessionUser.isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const updated = await commentService.updateText(postId, commentId, txt)
    res.json(updated)
  } catch (err) {
    logger.error('Failed to update comment: ' + err.message)
    res.status(500).send({ err: 'Failed to update comment' })
  }
}

async function removeComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId } = req.body
    const commentId = req.params.id

    const post = await postService.getById(postId)
    if (!post) return res.status(404).send({ err: 'Post not found' })

    const comment = (post.comments || []).find((c) => c._id === commentId)
    if (!comment) return res.status(404).send({ err: 'Comment not found' })

    const isCommentOwner = String(comment.userId) === String(sessionUser._id)
    const isPostOwner = String(post.userId) === String(sessionUser._id)
    if (!isCommentOwner && !isPostOwner && !sessionUser.isAdmin) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const removedId = await commentService.remove(postId, commentId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove comment: ' + err.message)
    res.status(500).send({ err: 'Failed to remove comment' })
  }
}

async function reactComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const updated = await commentService.reactToComment(
      req.body.postId,
      req.params.id,
      makeReaction(sessionUser)
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to react to comment: ' + err.message)
    res.status(500).send({ err: 'Failed to react to comment' })
  }
}

async function unreactComment(req, res) {
  try {
    const sessionUser = req.session?.user
    const updated = await commentService.unreactToComment(
      req.body.postId,
      req.params.id,
      String(sessionUser._id)
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to unreact comment: ' + err.message)
    res.status(500).send({ err: 'Failed to unreact comment' })
  }
}

async function addReply(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId, txt } = req.body
    const commentId = req.params.id
    const result = await commentService.addReply(postId, commentId, {
      userId: String(sessionUser._id),
      fullname: sessionUser.fullname,
      imgUrl: sessionUser.imgUrl,
      txt,
    })
    res.json(result)
  } catch (err) {
    logger.error('Failed to add reply: ' + err.message)
    res.status(500).send({ err: 'Failed to add reply' })
  }
}

async function updateReply(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId, txt } = req.body
    const { id: commentId, replyId } = req.params

    const { comment } = await commentService.getCommentInPost(postId, commentId)
    if (!comment) return res.status(404).send({ err: 'Comment not found' })
    const reply = (comment.replies || []).find((r) => r._id === replyId)
    if (!reply) return res.status(404).send({ err: 'Reply not found' })

    if (
      String(reply.userId) !== String(sessionUser._id) &&
      !sessionUser.isAdmin
    ) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const updated = await commentService.updateReplyText(
      postId,
      commentId,
      replyId,
      txt
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to update reply: ' + err.message)
    res.status(500).send({ err: 'Failed to update reply' })
  }
}

async function removeReply(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId } = req.body
    const { id: commentId, replyId } = req.params

    const post = await postService.getById(postId)
    if (!post) return res.status(404).send({ err: 'Post not found' })
    const comment = (post.comments || []).find((c) => c._id === commentId)
    if (!comment) return res.status(404).send({ err: 'Comment not found' })
    const reply = (comment.replies || []).find((r) => r._id === replyId)
    if (!reply) return res.status(404).send({ err: 'Reply not found' })

    const isReplyOwner = String(reply.userId) === String(sessionUser._id)
    const isCommentOwner = String(comment.userId) === String(sessionUser._id)
    const isPostOwner = String(post.userId) === String(sessionUser._id)
    if (
      !isReplyOwner &&
      !isCommentOwner &&
      !isPostOwner &&
      !sessionUser.isAdmin
    ) {
      return res.status(403).send({ err: 'Forbidden' })
    }

    const updated = await commentService.removeReply(
      postId,
      commentId,
      replyId
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to remove reply: ' + err.message)
    res.status(500).send({ err: 'Failed to remove reply' })
  }
}

async function reactReply(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId } = req.body
    const { id: commentId, replyId } = req.params
    const updated = await commentService.reactToReply(
      postId,
      commentId,
      replyId,
      makeReaction(sessionUser)
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to react to reply: ' + err.message)
    res.status(500).send({ err: 'Failed to react to reply' })
  }
}

async function unreactReply(req, res) {
  try {
    const sessionUser = req.session?.user
    const { postId } = req.body
    const { id: commentId, replyId } = req.params
    const updated = await commentService.unreactToReply(
      postId,
      commentId,
      replyId,
      String(sessionUser._id)
    )
    res.json(updated)
  } catch (err) {
    logger.error('Failed to unreact reply: ' + err.message)
    res.status(500).send({ err: 'Failed to unreact reply' })
  }
}
