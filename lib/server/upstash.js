const EXACT_ENV_KEYS = {
  url: ['UPSTASH_REDIS_REST_URL'],
  writeToken: ['UPSTASH_REDIS_REST_TOKEN'],
  readToken: ['UPSTASH_REDIS_REST_READ_ONLY_TOKEN']
}

const FUZZY_ENV_PATTERNS = {
  url: /(?:^|_)(?:KV_REST_API_URL|UPSTASH_REDIS_REST_URL)$/i,
  writeToken: /(?:^|_)(?:KV_REST_API_TOKEN|UPSTASH_REDIS_REST_TOKEN)$/i,
  readToken:
    /(?:^|_)(?:KV_REST_API_READ_ONLY_TOKEN|UPSTASH_REDIS_REST_READ_ONLY_TOKEN)$/i
}

function findEnvValue(kind) {
  const exactKeys = EXACT_ENV_KEYS[kind] || []
  for (const key of exactKeys) {
    if (process.env[key]) {
      return process.env[key]
    }
  }

  const pattern = FUZZY_ENV_PATTERNS[kind]
  const match = Object.entries(process.env).find(
    ([key, value]) => pattern.test(key) && value
  )

  return match?.[1] || ''
}

export function getUpstashConfig() {
  const url = findEnvValue('url')
  const writeToken = findEnvValue('writeToken')
  const readToken = findEnvValue('readToken') || writeToken

  return {
    url,
    writeToken,
    readToken,
    enabled: Boolean(url && writeToken)
  }
}

export async function upstashRequest(commandParts, { readOnly = false } = {}) {
  const { url, writeToken, readToken, enabled } = getUpstashConfig()

  if (!enabled) {
    throw new Error('Upstash is not configured')
  }

  const token = readOnly ? readToken : writeToken
  const endpoint = `${url}/${commandParts.map(part => encodeURIComponent(String(part))).join('/')}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upstash request failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

export function normalizeReactionPostId(postId) {
  return String(postId || '')
    .trim()
    .toLowerCase()
}

export function isValidReactionPostId(postId) {
  return /^[a-f0-9-]{32,36}$/.test(normalizeReactionPostId(postId))
}

export function isValidVisitorId(visitorId) {
  return /^[a-zA-Z0-9_-]{8,128}$/.test(String(visitorId || '').trim())
}

