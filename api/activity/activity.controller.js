const logger = require('../../services/logger.service')
const activityService = require('./activity.service')

module.exports = {
  getActivties,
  addActivity,
  updateActivity,
  getActivitiesLength,
}

async function getActivties(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const isAdmin = !!req.session?.user?.isAdmin
    const filterBy = req.validatedQuery || req.query

    // Non-admins may only fetch activities directed at themselves.
    if (!isAdmin) {
      filterBy.createdTo = sessionUserId
      delete filterBy.userId
    }

    const activities = await activityService.query(filterBy)
    res.json(activities)
  } catch (err) {
    logger.error('Failed to get activities', err)
    res.status(500).send({ err: 'Failed to get activities' })
  }
}

// CREATE
async function addActivity(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const activity = { ...req.body, createdBy: sessionUserId }
    const addedActivity = await activityService.add(activity)
    res.json(addedActivity)
  } catch (err) {
    logger.error('Failed to add activity', err)
    res.status(500).send({ err: 'Failed to add activity' })
  }
}

// UPDATE
async function updateActivity(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const isAdmin = !!req.session?.user?.isAdmin
    const incoming = { ...req.body, _id: req.params.id }

    if (!isAdmin) {
      // Only permit updating activities directed at the current user (e.g. mark as read).
      const allowed = { _id: incoming._id, isRead: incoming.isRead }
      if (incoming.createdTo && String(incoming.createdTo) !== sessionUserId) {
        return res.status(403).send({ err: 'Forbidden' })
      }
      const updatedActivity = await activityService.update(allowed)
      return res.json(updatedActivity)
    }

    const updatedActivity = await activityService.update(incoming)
    res.json(updatedActivity)
  } catch (err) {
    logger.error('Failed to update activity', err)
    res.status(500).send({ err: 'Failed to update activity' })
  }
}

async function getActivitiesLength(req, res) {
  try {
    const sessionUserId = String(req.session?.user?._id || '')
    const isAdmin = !!req.session?.user?.isAdmin
    const filterBy = req.validatedQuery || req.query
    if (!isAdmin) {
      filterBy.createdTo = sessionUserId
      delete filterBy.userId
    }
    const activitiesLength = await activityService.getLength(filterBy)
    res.json(activitiesLength)
  } catch (err) {
    logger.error('Failed to get activities length', err)
    res.status(500).send({ err: 'Failed to get activities' })
  }
}
