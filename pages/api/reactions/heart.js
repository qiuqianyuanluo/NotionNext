import {
  getUpstashConfig,
  isValidReactionPostId,
  isValidVisitorId,
  normalizeReactionPostId,
  upstashRequest
} from '@/lib/server/upstash'

function getReactionKeys(postId) {
  return {
    voters: `reaction:heart:${postId}:voters`
  }
}

async function getReactionState(postId, visitorId) {
  const keys = getReactionKeys(postId)
  const [{ result: count = 0 }, { result: liked = 0 }] = await Promise.all([
    upstashRequest(['SCARD', keys.voters], { readOnly: true }),
    visitorId
      ? upstashRequest(['SISMEMBER', keys.voters, visitorId], { readOnly: true })
      : Promise.resolve({ result: 0 })
  ])

  return {
    count: Number(count || 0),
    liked: Boolean(Number(liked || 0))
  }
}

async function toggleReaction(postId, visitorId) {
  const keys = getReactionKeys(postId)
  const { liked } = await getReactionState(postId, visitorId)

  if (liked) {
    await upstashRequest(['SREM', keys.voters, visitorId])
  } else {
    await upstashRequest(['SADD', keys.voters, visitorId])
  }

  const { count } = await getReactionState(postId, visitorId)
  return {
    count,
    liked: !liked
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const { enabled } = getUpstashConfig()

  if (!enabled) {
    return res.status(503).json({ error: 'Heart reactions are not configured' })
  }

  try {
    if (req.method === 'GET') {
      const postId = normalizeReactionPostId(req.query.postId)
      const visitorId = String(req.query.visitorId || '').trim()

      if (!isValidReactionPostId(postId)) {
        return res.status(400).json({ error: 'Invalid postId' })
      }

      if (visitorId && !isValidVisitorId(visitorId)) {
        return res.status(400).json({ error: 'Invalid visitorId' })
      }

      const reactionState = await getReactionState(postId, visitorId)
      return res.status(200).json(reactionState)
    }

    if (req.method === 'POST') {
      const { postId: rawPostId, visitorId } = req.body || {}
      const postId = normalizeReactionPostId(rawPostId)

      if (!isValidReactionPostId(postId)) {
        return res.status(400).json({ error: 'Invalid postId' })
      }

      if (!isValidVisitorId(visitorId)) {
        return res.status(400).json({ error: 'Invalid visitorId' })
      }

      const reactionState = await toggleReaction(postId, visitorId)
      return res.status(200).json(reactionState)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Heart reaction API failed', error)
    return res.status(500).json({ error: 'Heart reaction request failed' })
  }
}
